const express = require('express');
const { authenticate } = require('../middleware/auth');
const Prediction = require('../models/Prediction');

const router = express.Router();

// ────────────────────────────────────────────────────
// GET /api/dashboard/:userId — Aggregated health dash
// ────────────────────────────────────────────────────
router.get('/:userId', authenticate, async (req, res) => {
  try {
    // Users can only view their own dashboard (unless doctor)
    if (req.user.role !== 'doctor' && req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const userId = req.params.userId;

    // Fetch latest prediction of each type
    const [latestLab, latestWearable, latestXray, history] = await Promise.all([
      Prediction.findOne({ userId, type: 'lab' }).sort({ createdAt: -1 }),
      Prediction.findOne({ userId, type: 'wearable' }).sort({ createdAt: -1 }),
      Prediction.findOne({ userId, type: 'xray' }).sort({ createdAt: -1 }),
      Prediction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('type prediction.riskScore prediction.riskLevel createdAt'),
    ]);

    // Compute overall risk (weighted average of available scores)
    const scores = [
      latestLab?.prediction?.riskScore,
      latestWearable?.prediction?.riskScore,
      latestXray?.prediction?.riskScore,
    ].filter((s) => s !== undefined && s !== null);

    const overallRisk =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

    res.json({
      success: true,
      data: {
        overallRisk,
        latestLab,
        latestWearable,
        latestXray,
        history,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Could not load dashboard.' });
  }
});

module.exports = router;
