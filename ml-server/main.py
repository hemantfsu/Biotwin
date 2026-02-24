"""
BioTwin AI — ML Server Entry Point
FastAPI application serving 3 AI models:
  1. Gradient Boosting  → lab report risk prediction + SHAP
  2. LSTM              → wearable time-series risk trend
  3. EfficientNet CNN  → chest X-ray classification + GradCAM
"""

import os
import logging
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.lab import router as lab_router
from routes.wearable import router as wearable_router
from routes.xray import router as xray_router
from routes.ocr import router as ocr_router

load_dotenv()

# ── Logging ──
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("biotwin-ml")

# ── Global model registry (populated at startup) ──
models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models once at startup; release on shutdown."""
    logger.info("🔄 Loading models…")

    # 1. Gradient Boosting (lab risk)
    try:
        import joblib

        models["lab_model"] = joblib.load("models/risk_model.pkl")
        models["lab_scaler"] = joblib.load("models/scaler.pkl")
        logger.info("✅ Lab risk model loaded")
    except FileNotFoundError:
        logger.warning("⚠️  Lab risk model not found — /predict/lab will return dummy results")

    # 2. LSTM (wearable)
    try:
        import tensorflow as tf

        models["wearable_model"] = tf.keras.models.load_model("models/lstm_wearable.h5")
        logger.info("✅ Wearable LSTM model loaded")
    except Exception:
        logger.warning("⚠️  Wearable LSTM model not found — /predict/wearable will return dummy results")

    # 3. EfficientNet CNN (X-ray)
    try:
        import tensorflow as tf

        models["xray_model"] = tf.keras.models.load_model("models/efficientnet_xray.h5")
        logger.info("✅ X-ray CNN model loaded")
    except Exception:
        logger.warning("⚠️  X-ray CNN model not found — /predict/xray will return dummy results")

    # Attach to app state so routes can access
    app.state.models = models

    yield  # ← app runs here

    logger.info("🛑 Shutting down ML server")
    models.clear()


# ── FastAPI app ──
app = FastAPI(
    title="BioTwin AI — ML Server",
    description="Prediction endpoints for lab reports, wearable data, and chest X-rays",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000"), "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health ──
@app.get("/health")
async def health():
    loaded = list(models.keys())
    return {
        "service": "biotwin-ml-server",
        "status": "running",
        "models_loaded": loaded,
    }


# ── Mount route modules ──
app.include_router(lab_router, prefix="/predict")
app.include_router(wearable_router, prefix="/predict")
app.include_router(xray_router, prefix="/predict")
app.include_router(ocr_router, prefix="/ocr")
