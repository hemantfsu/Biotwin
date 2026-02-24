"""OCR route — Extract medical values from uploaded report photos and PDFs."""

import io
import re
import base64
import logging

import numpy as np
import fitz  # PyMuPDF — for PDF page-to-image conversion
from fastapi import APIRouter
from pydantic import BaseModel
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

router = APIRouter()
logger = logging.getLogger("biotwin-ml")


class OCRInput(BaseModel):
    image: str  # base64-encoded image or PDF
    file_type: str = "auto"  # "auto", "image", or "pdf"


# ── Medical value extraction patterns ──
# Each pattern: (field_key, category, [regex patterns], value_transform, validation_range)
EXTRACTION_RULES = [
    # Vitals
    ("heart_rate", "vitals", [
        r"(?:heart\s*rate|pulse|hr|pulse\s*rate)\s*[:\-=]?\s*(\d{2,3})\s*(?:bpm|/min|beats)?",
        r"(?:HR|PR)\s*[:\-=]?\s*(\d{2,3})",
        r"(\d{2,3})\s*bpm",
    ], float, (30, 220)),

    ("spo2", "vitals", [
        r"(?:spo2|sp\s*o2|oxygen\s*saturation|o2\s*sat|sao2)\s*[:\-=]?\s*(\d{2,3})\s*%?",
        r"(?:SpO2|O2)\s*[:\-=]?\s*(\d{2,3})",
    ], float, (50, 100)),

    ("systolic_bp", "vitals", [
        r"(?:systolic|sys|sbp)\s*[:\-=]?\s*(\d{2,3})",
        r"(?:blood\s*pressure|bp|b\.p\.?)\s*[:\-=]?\s*(\d{2,3})\s*/\s*\d{2,3}",
        r"(\d{2,3})\s*/\s*\d{2,3}\s*(?:mmhg|mm\s*hg)?",
    ], float, (70, 250)),

    ("diastolic_bp", "vitals", [
        r"(?:diastolic|dia|dbp)\s*[:\-=]?\s*(\d{2,3})",
        r"(?:blood\s*pressure|bp|b\.p\.?)\s*[:\-=]?\s*\d{2,3}\s*/\s*(\d{2,3})",
        r"\d{2,3}\s*/\s*(\d{2,3})\s*(?:mmhg|mm\s*hg)?",
    ], float, (40, 150)),

    ("temperature", "vitals", [
        r"(?:temp|temperature|body\s*temp)\s*[:\-=]?\s*(\d{2,3}\.?\d?)\s*(?:°?f|fahrenheit)?",
        r"(\d{2,3}\.\d)\s*°?\s*[fF]",
    ], float, (90, 110)),

    ("respiratory_rate", "vitals", [
        r"(?:respiratory\s*rate|resp\.?\s*rate|rr|breaths)\s*[:\-=]?\s*(\d{1,2})\s*(?:/min)?",
        r"RR\s*[:\-=]?\s*(\d{1,2})",
    ], float, (5, 60)),

    ("bmi", "vitals", [
        r"(?:bmi|body\s*mass\s*index)\s*[:\-=]?\s*(\d{1,2}\.?\d?)",
    ], float, (10, 60)),

    # Lab values
    ("age", "labValues", [
        r"(?:age|patient\s*age)\s*[:\-=]?\s*(\d{1,3})\s*(?:years?|yrs?|y)?",
    ], float, (1, 120)),

    ("chol", "labValues", [
        r"(?:cholesterol|total\s*cholesterol|tc|t\.?\s*chol)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
        r"(?:CHOL|TC)\s*[:\-=]?\s*(\d{2,3})",
    ], float, (100, 600)),

    ("trestbps", "labValues", [
        r"(?:resting\s*(?:blood\s*)?(?:pressure|bp)|resting\s*bp)\s*[:\-=]?\s*(\d{2,3})",
    ], float, (70, 250)),

    ("thalach", "labValues", [
        r"(?:max(?:imum)?\s*(?:heart\s*)?rate|max\s*hr|peak\s*(?:heart\s*)?rate|thalach)\s*[:\-=]?\s*(\d{2,3})",
    ], float, (50, 220)),

    ("oldpeak", "labValues", [
        r"(?:st\s*depression|oldpeak|st\s*segment)\s*[:\-=]?\s*(\d\.?\d?)",
    ], float, (0, 10)),

    ("fbs", "labValues", [
        r"(?:fasting\s*(?:blood\s*)?(?:sugar|glucose)|fbs|fbg|fasting\s*glucose)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
    ], lambda v: 1 if float(v) > 120 else 0, (50, 500)),

    # Additional common lab values
    ("hemoglobin", "extras", [
        r"(?:hemoglobin|hgb|hb)\s*[:\-=]?\s*(\d{1,2}\.?\d?)\s*(?:g/?dl|gm/?dl)?",
        r"(?:Hb|HGB)\s*[:\-=]?\s*(\d{1,2}\.?\d?)",
    ], float, (3, 20)),

    ("rbc", "extras", [
        r"(?:rbc|red\s*blood\s*cell|erythrocyte)\s*(?:count)?\s*[:\-=]?\s*(\d\.?\d{1,2})\s*(?:million|m/?ul|x\s*10)?",
    ], float, (1, 10)),

    ("wbc", "extras", [
        r"(?:wbc|white\s*blood\s*cell|leukocyte)\s*(?:count)?\s*[:\-=]?\s*(\d{1,2}\.?\d?)\s*(?:thousand|k/?ul|x\s*10)?",
    ], float, (1, 50)),

    ("platelet", "extras", [
        r"(?:platelet|plt)\s*(?:count)?\s*[:\-=]?\s*(\d{2,3})\s*(?:thousand|k/?ul|x\s*10)?",
    ], float, (50, 600)),

    ("glucose", "extras", [
        r"(?:blood\s*(?:sugar|glucose)|glucose|sugar\s*level|random\s*(?:blood\s*)?(?:sugar|glucose)|rbs)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
    ], float, (30, 500)),

    ("creatinine", "extras", [
        r"(?:creatinine|creat)\s*[:\-=]?\s*(\d\.?\d{1,2})\s*(?:mg/?dl)?",
    ], float, (0.1, 15)),

    ("urea", "extras", [
        r"(?:urea|bun|blood\s*urea)\s*[:\-=]?\s*(\d{1,3})\s*(?:mg/?dl)?",
    ], float, (5, 200)),

    ("triglycerides", "extras", [
        r"(?:triglyceride|tg|trigs)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
    ], float, (30, 600)),

    ("hdl", "extras", [
        r"(?:hdl|hdl[\-\s]?cholesterol|hdl[\-\s]?c)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
    ], float, (10, 150)),

    ("ldl", "extras", [
        r"(?:ldl|ldl[\-\s]?cholesterol|ldl[\-\s]?c)\s*[:\-=]?\s*(\d{2,3})\s*(?:mg/?dl)?",
    ], float, (30, 400)),

    ("hba1c", "extras", [
        r"(?:hba1c|a1c|glycated\s*hemoglobin|glycosylated)\s*[:\-=]?\s*(\d\.?\d?)\s*%?",
    ], float, (3, 15)),

    ("tsh", "extras", [
        r"(?:tsh|thyroid\s*stimulating)\s*[:\-=]?\s*(\d{1,2}\.?\d{0,2})\s*(?:miu/?l|uiu/?ml)?",
    ], float, (0.01, 50)),
]


def preprocess_image(img: Image.Image) -> Image.Image:
    """Enhance image for better OCR results."""
    # Convert to grayscale
    img = img.convert("L")
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    # Upscale small images
    w, h = img.size
    if w < 1000:
        scale = 1500 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    # Binarize
    img = img.point(lambda x: 255 if x > 140 else 0)
    return img


def extract_values(text: str) -> dict:
    """Extract medical values from OCR text using regex patterns."""
    results = {"vitals": {}, "labValues": {}, "extras": {}, "raw_matches": []}
    text_lower = text.lower()

    for field_key, category, patterns, transform, (vmin, vmax) in EXTRACTION_RULES:
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    raw_val = match.group(1)
                    value = transform(raw_val)
                    # Validate range
                    num_val = float(value) if not isinstance(value, (int, float)) else value
                    if vmin <= num_val <= vmax:
                        results[category][field_key] = value
                        results["raw_matches"].append({
                            "field": field_key,
                            "value": value,
                            "matched_text": match.group(0),
                            "category": category,
                        })
                        break
                except (ValueError, IndexError):
                    continue

    return results


def detect_sex_from_text(text: str) -> int | None:
    """Try to detect patient sex from OCR text."""
    lower = text.lower()
    if re.search(r"\b(?:sex|gender)\s*[:\-=]?\s*(?:male|m)\b", lower):
        return 1
    if re.search(r"\b(?:sex|gender)\s*[:\-=]?\s*(?:female|f)\b", lower):
        return 0
    return None


# ── PDF helpers ──

def is_pdf(raw_bytes: bytes) -> bool:
    """Check if raw bytes are a PDF (magic bytes %PDF)."""
    return raw_bytes[:5] == b"%PDF-"


def pdf_to_images(pdf_bytes: bytes, dpi: int = 250) -> list[Image.Image]:
    """Convert each page of a PDF to a PIL Image."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images: list[Image.Image] = []
    zoom = dpi / 72  # 72 is default PDF DPI
    mat = fitz.Matrix(zoom, zoom)
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
        logger.info(f"PDF page {page_num + 1}: {pix.width}x{pix.height}")
    doc.close()
    return images


def ocr_single_image(img: Image.Image) -> str:
    """Run Tesseract on a single PIL image and return combined text."""
    processed = preprocess_image(img)
    text_processed = pytesseract.image_to_string(processed, config="--psm 6 --oem 3")
    text_original = pytesseract.image_to_string(img, config="--psm 6 --oem 3")
    return text_processed + "\n" + text_original


@router.post("/ocr")
async def ocr_extract(data: OCRInput):
    """Extract medical data from uploaded report image or PDF using OCR."""
    try:
        # Decode
        raw_bytes = base64.b64decode(data.image)

        # Determine if PDF
        file_is_pdf = (
            data.file_type == "pdf"
            or is_pdf(raw_bytes)
        )

        all_text_parts: list[str] = []
        page_count = 0

        if file_is_pdf:
            # ── PDF path: convert each page to image, then OCR ──
            logger.info("OCR: Detected PDF input")
            pages = pdf_to_images(raw_bytes)
            page_count = len(pages)
            logger.info(f"OCR: PDF has {page_count} page(s)")

            for i, page_img in enumerate(pages):
                page_text = ocr_single_image(page_img)
                all_text_parts.append(page_text)
                logger.info(f"OCR: Page {i+1} → {len(page_text)} chars")
        else:
            # ── Image path (original behaviour) ──
            img = Image.open(io.BytesIO(raw_bytes))
            logger.info(f"OCR: Received image {img.size[0]}x{img.size[1]}, mode={img.mode}")
            all_text_parts.append(ocr_single_image(img))
            page_count = 1

        combined_text = "\n".join(all_text_parts)
        logger.info(f"OCR: Total extracted text = {len(combined_text)} chars from {page_count} page(s)")

        # Extract medical values
        extracted = extract_values(combined_text)

        # Try to detect sex
        sex = detect_sex_from_text(combined_text)
        if sex is not None:
            extracted["labValues"]["sex"] = sex

        # Count what was found
        total_found = len(extracted["vitals"]) + len(extracted["labValues"]) + len(extracted["extras"])

        return {
            "success": True,
            "raw_text": combined_text.strip(),
            "page_count": page_count,
            "file_type": "pdf" if file_is_pdf else "image",
            "extracted": {
                "vitals": extracted["vitals"],
                "labValues": extracted["labValues"],
                "extras": extracted["extras"],
            },
            "matches": extracted["raw_matches"],
            "total_fields_found": total_found,
        }

    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "raw_text": "",
            "page_count": 0,
            "file_type": "unknown",
            "extracted": {"vitals": {}, "labValues": {}, "extras": {}},
            "matches": [],
            "total_fields_found": 0,
        }
