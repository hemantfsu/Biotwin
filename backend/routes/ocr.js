/**
 * OCR Proxy Route — Forwards report image to ML server for text extraction.
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const ML_SERVER = process.env.ML_SERVER_URL || 'http://localhost:8000';

// POST /api/ocr  — Send base64 image to ML server, return extracted values
router.post('/', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No file data provided. Please upload a medical report (image or PDF).',
      });
    }

    // Detect file type from data-URI prefix
    let fileType = 'auto';
    if (image.startsWith('data:application/pdf')) {
      fileType = 'pdf';
    } else if (image.startsWith('data:image/')) {
      fileType = 'image';
    }

    // Strip data-URI prefix if present (e.g. "data:image/png;base64,..." or "data:application/pdf;base64,...")
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // Forward to ML server OCR endpoint
    const mlResponse = await axios.post(
      `${ML_SERVER}/ocr/ocr`,
      { image: base64Data, file_type: fileType },
      { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
    );

    const data = mlResponse.data;

    return res.json({
      success: data.success,
      data: {
        raw_text: data.raw_text,
        extracted: data.extracted,
        matches: data.matches,
        total_fields_found: data.total_fields_found,
        page_count: data.page_count || 1,
        file_type: data.file_type || 'image',
      },
    });
  } catch (err) {
    console.error('OCR proxy error:', err.message);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML server is not running. Please start it first.',
      });
    }

    return res.status(500).json({
      success: false,
      error: err.response?.data?.error || 'OCR processing failed. Please try a clearer image.',
    });
  }
});

module.exports = router;
