"""Lab report risk prediction route — Gradient Boosting + SHAP."""

import numpy as np
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class LabInput(BaseModel):
    """Input features matching the UCI Heart Disease dataset."""
    age: float
    sex: int          # 0 = female, 1 = male
    cp: int           # chest pain type (0-3)
    trestbps: float   # resting blood pressure
    chol: float       # serum cholesterol
    fbs: int          # fasting blood sugar > 120 mg/dl
    restecg: int      # resting ECG results (0-2)
    thalach: float    # max heart rate achieved
    exang: int        # exercise induced angina
    oldpeak: float    # ST depression
    slope: int        # slope of peak exercise ST
    ca: int           # number of major vessels (0-3)
    thal: int         # thalassemia (1=normal, 2=fixed, 3=reversible)


@router.post("/lab")
async def predict_lab(data: LabInput, request: Request):
    """Return risk score + SHAP explanation for lab values."""
    models = request.app.state.models
    features = np.array([[
        data.age, data.sex, data.cp, data.trestbps, data.chol,
        data.fbs, data.restecg, data.thalach, data.exang,
        data.oldpeak, data.slope, data.ca, data.thal,
    ]])

    # If model is loaded, do real prediction
    if "lab_model" in models and "lab_scaler" in models:
        scaler = models["lab_scaler"]
        model = models["lab_model"]

        features_scaled = scaler.transform(features)
        prob = float(model.predict_proba(features_scaled)[0][1])

        # SHAP values
        try:
            import shap
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(features_scaled)
            feature_names = [
                "age", "sex", "cp", "trestbps", "chol", "fbs",
                "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
            ]
            shap_dict = dict(zip(feature_names, shap_vals[0].tolist()))
        except Exception:
            shap_dict = {}

        risk_level = (
            "critical" if prob > 0.8
            else "high" if prob > 0.6
            else "moderate" if prob > 0.4
            else "low"
        )

        return {
            "prediction": round(prob, 4),
            "confidence": round(max(prob, 1 - prob), 4),
            "risk_level": risk_level,
            "shap_values": shap_dict,
        }

    # Fallback dummy response when model not trained yet
    dummy_risk = round(np.random.uniform(0.2, 0.85), 4)
    return {
        "prediction": dummy_risk,
        "confidence": 0.65,
        "risk_level": "moderate",
        "shap_values": {"note": "Model not loaded — dummy response"},
    }
