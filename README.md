# 🧬 BioTwin AI — Multi-Modal Early Disease Detection Platform

> Hackathon Project: A digital-twin-inspired platform that fuses lab reports, wearable sensor data, and medical imaging to predict disease risk early.

---

## 🏗️ Architecture

```
┌────────────┐     ┌────────────────┐     ┌──────────────────┐
│  React UI  │────▶│  Express API   │────▶│  FastAPI ML Srv  │
│  Tailwind  │     │  MongoDB/Redis │     │  TF / sklearn    │
│  Recharts  │     │  JWT Auth      │     │  3 AI Models     │
└────────────┘     └────────────────┘     └──────────────────┘
     :3000              :5000                   :8000
```

## 🤖 AI Models

| # | Model | Input | Output |
|---|-------|-------|--------|
| 1 | **Gradient Boosting** | Lab report values | Risk score + SHAP explanations |
| 2 | **LSTM** | Wearable time-series (HR, SpO2, steps) | Risk trend over time |
| 3 | **EfficientNet CNN** | Chest X-ray image | Classification + GradCAM heatmap |

## 📂 Project Structure

```
biotwin-ai/
├── backend/            # Node.js + Express API
│   ├── config/         # DB, Redis, S3 config
│   ├── middleware/      # Auth, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── frontend/           # React + Tailwind
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   ├── services/   # API service layer
│   │   └── App.jsx     # Root component
│   └── package.json
├── ml-server/          # Python + FastAPI
│   ├── models/         # Saved model artifacts
│   ├── routes/         # Prediction endpoints
│   ├── utils/          # SHAP, GradCAM helpers
│   ├── main.py         # Entry point
│   └── requirements.txt
├── models/             # Trained model files (.pkl, .h5)
├── datasets/           # Sample/training datasets
└── README.md
```

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env   # Fill in your values
npm install
npm run dev
```

### 2. ML Server
```bash
cd ml-server
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

## 🔑 Environment Variables

See `backend/.env.example` for all required variables.

## 📜 License

MIT — Built for hackathon demonstration purposes.
