"""
BioTwin AI — Gradient Boosting Risk Prediction Training Script
==============================================================
Dataset : UCI Heart Disease (Cleveland)
Model   : GradientBoostingClassifier with GridSearchCV
Output  : risk_model.pkl, scaler.pkl, SHAP summary plot
Metrics : AUC, Accuracy, Precision, Recall

✅ Runnable in Google Colab — just upload or fetch the CSV.
"""

import os
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    roc_auc_score, classification_report, confusion_matrix,
    roc_curve,
)

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────
# 1. Load Dataset
# ──────────────────────────────────────────────
DATA_URL = (
    "https://archive.ics.uci.edu/ml/machine-learning-databases/"
    "heart-disease/processed.cleveland.data"
)

COLUMN_NAMES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target",
]

print("📥 Loading UCI Heart Disease dataset…")
df = pd.read_csv(DATA_URL, header=None, names=COLUMN_NAMES, na_values="?")
df.dropna(inplace=True)

# Binarise target: 0 = no disease, 1 = disease present
df["target"] = (df["target"] > 0).astype(int)

print(f"   Samples: {len(df)}  |  Positive: {df['target'].sum()}  |  Negative: {(df['target'] == 0).sum()}")

# ──────────────────────────────────────────────
# 2. Feature / Target Split
# ──────────────────────────────────────────────
X = df.drop("target", axis=1).values
y = df["target"].values
feature_names = COLUMN_NAMES[:-1]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y,
)

# ──────────────────────────────────────────────
# 3. Scale Features
# ──────────────────────────────────────────────
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

# ──────────────────────────────────────────────
# 4. Hyperparameter Tuning (GridSearchCV)
# ──────────────────────────────────────────────
print("\n🔍 Running GridSearchCV…")

param_grid = {
    "n_estimators": [100, 200, 300],
    "learning_rate": [0.05, 0.1, 0.2],
    "max_depth": [3, 4, 5],
    "subsample": [0.8, 1.0],
}

gb = GradientBoostingClassifier(random_state=42)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
grid = GridSearchCV(
    gb, param_grid, cv=cv, scoring="roc_auc", n_jobs=-1, verbose=1,
)
grid.fit(X_train_s, y_train)

best_model = grid.best_estimator_
print(f"\n🏆 Best params: {grid.best_params_}")
print(f"   Best CV AUC: {grid.best_score_:.4f}")

# ──────────────────────────────────────────────
# 5. Evaluate on Test Set
# ──────────────────────────────────────────────
y_pred = best_model.predict(X_test_s)
y_proba = best_model.predict_proba(X_test_s)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)

print("\n📊 Test Set Metrics")
print(f"   Accuracy  : {acc:.4f}")
print(f"   Precision : {prec:.4f}")
print(f"   Recall    : {rec:.4f}")
print(f"   AUC-ROC   : {auc:.4f}")
print("\n", classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))

# ──────────────────────────────────────────────
# 6. Plots
# ──────────────────────────────────────────────
os.makedirs("outputs", exist_ok=True)

# 6a. Confusion Matrix
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=axes[0],
            xticklabels=["No Disease", "Disease"],
            yticklabels=["No Disease", "Disease"])
axes[0].set_title("Confusion Matrix")
axes[0].set_ylabel("Actual")
axes[0].set_xlabel("Predicted")

# 6b. ROC Curve
fpr, tpr, _ = roc_curve(y_test, y_proba)
axes[1].plot(fpr, tpr, label=f"AUC = {auc:.3f}", linewidth=2)
axes[1].plot([0, 1], [0, 1], "k--", alpha=0.5)
axes[1].set_xlabel("False Positive Rate")
axes[1].set_ylabel("True Positive Rate")
axes[1].set_title("ROC Curve")
axes[1].legend()
plt.tight_layout()
plt.savefig("outputs/metrics.png", dpi=150)
plt.show()
print("💾 Saved outputs/metrics.png")

# ──────────────────────────────────────────────
# 7. SHAP Explainability
# ──────────────────────────────────────────────
print("\n🧠 Generating SHAP explanations…")
try:
    import shap

    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_test_s)

    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test_s, feature_names=feature_names, show=False)
    plt.tight_layout()
    plt.savefig("outputs/shap_summary.png", dpi=150, bbox_inches="tight")
    plt.show()
    print("💾 Saved outputs/shap_summary.png")
except ImportError:
    print("⚠️  SHAP not installed — pip install shap")

# ──────────────────────────────────────────────
# 8. Save Artefacts
# ──────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

model_path = os.path.join(MODEL_DIR, "risk_model.pkl")
scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")

joblib.dump(best_model, model_path)
joblib.dump(scaler, scaler_path)

print(f"\n✅ Model saved  → {model_path}")
print(f"✅ Scaler saved → {scaler_path}")
print("\n🎉 Training complete!")
