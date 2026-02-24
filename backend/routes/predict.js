const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const { authenticate } = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const { uploadToS3 } = require('../config/s3');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ML_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

// ────────────────────────────────────────────────────
// POST /api/predict/lab  — Lab report risk prediction
// ────────────────────────────────────────────────────
router.post(
  '/lab',
  authenticate,
  [
    body('age').isNumeric(),
    body('sex').isIn([0, 1]),
    body('cp').isNumeric(),
    body('trestbps').isNumeric(),
    body('chol').isNumeric(),
    body('fbs').isIn([0, 1]),
    body('restecg').isNumeric(),
    body('thalach').isNumeric(),
    body('exang').isIn([0, 1]),
    body('oldpeak').isNumeric(),
    body('slope').isNumeric(),
    body('ca').isNumeric(),
    body('thal').isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid lab values.', details: errors.array() });
      }

      // Forward to ML server
      const mlResponse = await axios.post(`${ML_URL}/predict/lab`, req.body);
      const { prediction, confidence, risk_level, shap_values } = mlResponse.data;

      // Save to DB
      const record = await Prediction.create({
        userId: req.user.id,
        type: 'lab',
        input: req.body,
        prediction: {
          riskScore: prediction,
          riskLevel: risk_level,
          confidence,
        },
        explanation: shap_values,
      });

      res.json({ success: true, data: record });
    } catch (err) {
      console.error('Lab prediction error:', err.message);
      res.status(500).json({ success: false, error: 'Lab prediction failed.' });
    }
  }
);

// ────────────────────────────────────────────────────
// POST /api/predict/wearable  — Wearable time-series
// ────────────────────────────────────────────────────
router.post(
  '/wearable',
  authenticate,
  [body('readings').isArray({ min: 10 }).withMessage('Need at least 10 readings')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
      }

      const mlResponse = await axios.post(`${ML_URL}/predict/wearable`, {
        readings: req.body.readings,
      });

      const { risk_trend, current_risk, confidence } = mlResponse.data;

      const record = await Prediction.create({
        userId: req.user.id,
        type: 'wearable',
        input: { readings: req.body.readings },
        prediction: {
          riskScore: current_risk,
          riskLevel: current_risk > 0.7 ? 'high' : current_risk > 0.4 ? 'moderate' : 'low',
          confidence,
        },
        explanation: { risk_trend },
      });

      res.json({ success: true, data: record });
    } catch (err) {
      console.error('Wearable prediction error:', err.message);
      res.status(500).json({ success: false, error: 'Wearable prediction failed.' });
    }
  }
);

// ────────────────────────────────────────────────────
// POST /api/predict/xray  — Chest X-ray classification
// ────────────────────────────────────────────────────
router.post('/xray', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image file is required.' });
    }

    // Upload original to S3 (skip in dev if no AWS credentials)
    let imageUrl = null;
    if (process.env.AWS_ACCESS_KEY_ID) {
      const s3Key = `xrays/${req.user.id}/${Date.now()}_${req.file.originalname}`;
      imageUrl = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
    }

    // Send to ML server as base64
    const base64Image = req.file.buffer.toString('base64');
    const mlResponse = await axios.post(`${ML_URL}/predict/xray`, {
      image: base64Image,
    });

    const { classification, confidence, gradcam_url } = mlResponse.data;

    const record = await Prediction.create({
      userId: req.user.id,
      type: 'xray',
      input: { originalFilename: req.file.originalname },
      prediction: {
        classification,
        confidence,
        riskLevel: confidence > 0.7 && classification !== 'Normal' ? 'high' : 'low',
      },
      explanation: { gradcam_url },
      imageUrl,
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('X-ray prediction error:', err.message);
    res.status(500).json({ success: false, error: 'X-ray prediction failed.' });
  }
});

module.exports = router;
