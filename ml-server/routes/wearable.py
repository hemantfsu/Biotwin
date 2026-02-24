"""Wearable time-series risk prediction route — LSTM."""

import os
import json
import numpy as np
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List

router = APIRouter()

N_FEATURES = 3  # heart_rate, spo2, steps

# Load normalization stats if available
NORM_STATS = None
stats_path = os.path.join(os.path.dirname(__file__), "..", "models", "wearable_norm_stats.json")
if os.path.exists(stats_path):
    with open(stats_path) as f:
        NORM_STATS = json.load(f)


class WearableReading(BaseModel):
    heart_rate: float
    spo2: float
    steps: float


class WearableInput(BaseModel):
    readings: List[WearableReading]


@router.post("/wearable")
async def predict_wearable(data: WearableInput, request: Request):
    """LSTM prediction over a sequence of wearable readings."""
    models = request.app.state.models

    # Convert readings to numpy array: shape (1, timesteps, 3)
    sequence = np.array(
        [[r.heart_rate, r.spo2, r.steps] for r in data.readings],
        dtype=np.float32,
    )

    if "wearable_model" in models:
        import tensorflow as tf

        model = models["wearable_model"]

        # Normalize using saved stats
        if NORM_STATS:
            sequence[:, 0] = (sequence[:, 0] - NORM_STATS["hr_mean"]) / NORM_STATS["hr_std"]
            sequence[:, 1] = (sequence[:, 1] - NORM_STATS["spo2_mean"]) / NORM_STATS["spo2_std"]
            sequence[:, 2] = (sequence[:, 2] - NORM_STATS["steps_mean"]) / NORM_STATS["steps_std"]

        # Pad or truncate to expected sequence length (model trained on 24 steps)
        expected_len = 24
        actual_len = sequence.shape[0]
        if actual_len < expected_len:
            # Pad by repeating last reading
            pad = np.tile(sequence[-1:], (expected_len - actual_len, 1))
            sequence = np.vstack([sequence, pad])
        elif actual_len > expected_len:
            # Take last N steps (most recent data)
            sequence = sequence[-expected_len:]

        sequence = sequence.reshape(1, expected_len, N_FEATURES)
        preds = model.predict(sequence, verbose=0)  # shape (1, timesteps, 1) or (1, 1)

        if preds.ndim == 3:
            risk_trend = preds[0, :, 0].tolist()
            current_risk = float(risk_trend[-1])
        else:
            current_risk = float(preds[0][0])
            risk_trend = [current_risk]

        confidence = float(np.clip(0.7 + abs(current_risk - 0.5) * 0.5, 0.7, 0.95))

        return {
            "risk_trend": [round(v, 4) for v in risk_trend],
            "current_risk": round(np.clip(current_risk, 0, 1), 4),
            "confidence": round(confidence, 4),
        }

    # Fallback dummy
    sequence = sequence.reshape(1, sequence.shape[0], sequence.shape[1])
    n = len(data.readings)
    dummy_trend = np.linspace(0.3, 0.6, n).tolist()
    return {
        "risk_trend": [round(v, 4) for v in dummy_trend],
        "current_risk": round(dummy_trend[-1], 4),
        "confidence": 0.55,
    }
