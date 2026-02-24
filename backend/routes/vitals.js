const express = require('express');
const Vital = require('../models/Vital');
const router = express.Router();

// Medical reference ranges (clinical-grade thresholds)
const RANGES = {
  heartRate:       { min: 25, max: 250, decimals: 0 },
  systolicBP:      { min: 60, max: 260, decimals: 0 },
  diastolicBP:     { min: 30, max: 180, decimals: 0 },
  spo2:            { min: 60, max: 100, decimals: 0 },
  temperature:     { min: 90, max: 110, decimals: 1 },
  respiratoryRate: { min: 4,  max: 60,  decimals: 0 },
  steps:           { min: 0,  max: 200000, decimals: 0 },
  calories:        { min: 0,  max: 10000,  decimals: 0 },
  bloodGlucose:    { min: 30, max: 500, decimals: 0 },
  stressLevel:     { min: 0,  max: 100, decimals: 0 },
  sleepMinutes:    { min: 0,  max: 1440, decimals: 0 },
};

// Alert thresholds (comprehensive clinical rules)
const ALERT_RULES = [
  // Critical
  { field: 'heartRate',     test: v => v > 150,               type: 'critical', msg: v => `Heart rate ${v} bpm - tachycardia crisis!` },
  { field: 'heartRate',     test: v => v < 40,                type: 'critical', msg: v => `Heart rate ${v} bpm - severe bradycardia!` },
  { field: 'spo2',          test: v => v < 90,                type: 'critical', msg: v => `SpO2 ${v}% - dangerously low oxygen!` },
  { field: 'systolicBP',    test: v => v > 180,               type: 'critical', msg: v => `Systolic BP ${v} mmHg - hypertensive crisis!` },
  { field: 'systolicBP',    test: v => v < 70,                type: 'critical', msg: v => `Systolic BP ${v} mmHg - hypotension!` },
  { field: 'temperature',   test: v => v > 104,               type: 'critical', msg: v => `Temperature ${v}F - hyperthermia!` },
  { field: 'temperature',   test: v => v < 95,                type: 'critical', msg: v => `Temperature ${v}F - hypothermia!` },
  { field: 'bloodGlucose',  test: v => v < 54,                type: 'critical', msg: v => `Blood glucose ${v} mg/dL - severe hypoglycemia!` },
  { field: 'bloodGlucose',  test: v => v > 400,               type: 'critical', msg: v => `Blood glucose ${v} mg/dL - diabetic emergency!` },
  // Warning
  { field: 'heartRate',     test: v => v > 120 && v <= 150,   type: 'warning',  msg: v => `Heart rate ${v} bpm - elevated` },
  { field: 'heartRate',     test: v => v >= 40 && v < 50,     type: 'warning',  msg: v => `Heart rate ${v} bpm - low (bradycardia)` },
  { field: 'spo2',          test: v => v >= 90 && v < 94,     type: 'warning',  msg: v => `SpO2 ${v}% - below normal` },
  { field: 'systolicBP',    test: v => v > 140 && v <= 180,   type: 'warning',  msg: v => `Systolic BP ${v} mmHg - hypertension` },
  { field: 'diastolicBP',   test: v => v > 90,                type: 'warning',  msg: v => `Diastolic BP ${v} mmHg - elevated` },
  { field: 'temperature',   test: v => v > 100.4 && v <= 104, type: 'warning',  msg: v => `Temperature ${v}F - fever` },
  { field: 'respiratoryRate', test: v => v > 25,              type: 'warning',  msg: v => `Resp rate ${v}/min - tachypnea` },
  { field: 'respiratoryRate', test: v => v < 8,               type: 'warning',  msg: v => `Resp rate ${v}/min - bradypnea` },
  { field: 'bloodGlucose',  test: v => v < 70 && v >= 54,     type: 'warning',  msg: v => `Blood glucose ${v} mg/dL - low` },
  { field: 'bloodGlucose',  test: v => v > 200 && v <= 400,   type: 'warning',  msg: v => `Blood glucose ${v} mg/dL - high` },
  { field: 'stressLevel',   test: v => v > 75,                type: 'warning',  msg: v => `Stress level ${v}/100 - very high` },
];

// Extract userId from body / query / JWT header
const getUserId = (req) => {
  if (req.body && req.body.userId) return req.body.userId;
  if (req.query && req.query.userId) return req.query.userId;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'biotwin_hackathon_secret_key_2026');
      return decoded.id;
    } catch (e) { /* ignore */ }
  }
  return null;
};

// Validate + clamp a numeric vital to its medical range
// Returns null if the raw value is garbage; otherwise clamps to valid bounds
const sanitizeVital = (raw, key) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const num = Number(raw);
  if (isNaN(num)) return null;
  const range = RANGES[key];
  if (!range) return num;
  // Reject values wildly outside sensor range (+/-50% beyond)
  const span = range.max - range.min;
  if (num < range.min - span * 0.5 || num > range.max + span * 0.5) return null;
  // Clamp to valid range
  const clamped = Math.max(range.min, Math.min(range.max, num));
  return Number(clamped.toFixed(range.decimals));
};

// Build clean vitals object from raw request body
const sanitizeAllVitals = (body) => {
  const clean = {};
  let hasAtLeastOne = false;
  for (const key of Object.keys(RANGES)) {
    const val = sanitizeVital(body[key], key);
    if (val !== null) { clean[key] = val; hasAtLeastOne = true; }
  }
  return { clean, hasAtLeastOne };
};

// Duplicate detection within 3 seconds (same user + same HR + same SpO2)
const DEDUP_WINDOW_MS = 3000;
const isDuplicate = async (userId, vitals) => {
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);
  const query = { userId, createdAt: { $gte: cutoff } };
  if (vitals.heartRate != null) query.heartRate = vitals.heartRate;
  if (vitals.spo2 != null) query.spo2 = vitals.spo2;
  return !!(await Vital.findOne(query).lean());
};

// Generate alerts for a vitals reading
const generateAlerts = (vitals) => {
  const alerts = [];
  for (const rule of ALERT_RULES) {
    const val = vitals[rule.field];
    if (val != null && rule.test(val)) {
      alerts.push({ type: rule.type, field: rule.field, value: val, msg: rule.msg(val) });
    }
  }
  // Sort: critical first
  alerts.sort((a, b) => (a.type === 'critical' ? -1 : 1) - (b.type === 'critical' ? -1 : 1));
  return alerts;
};

// ========================================================================
// POST /api/vitals - Ingest live reading from phone/watch
// ========================================================================
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'userId required' });

    // 1. Sanitize & validate all incoming vitals
    const { clean, hasAtLeastOne } = sanitizeAllVitals(req.body);
    if (!hasAtLeastOne) {
      return res.status(400).json({
        success: false,
        error: 'At least one valid vital sign required within medical ranges.',
      });
    }

    // 2. Duplicate detection (skip if identical reading within 3s)
    if (await isDuplicate(userId, clean)) {
      return res.status(200).json({
        success: true, duplicate: true,
        message: 'Duplicate reading ignored (within 3s window)',
      });
    }

    // 3. Determine source & device info
    const validSources = ['watch', 'phone', 'manual', 'simulator'];
    const source = validSources.includes(req.body.source) ? req.body.source : 'watch';
    const deviceInfo = typeof req.body.deviceInfo === 'string'
      ? req.body.deviceInfo.substring(0, 100) : undefined;

    // 4. Save to MongoDB
    const vital = await Vital.create({ userId, ...clean, source, deviceInfo });
    const serverTs = vital.createdAt.toISOString();

    console.log(
      'Vitals [' + source + ']: HR=' + (clean.heartRate || '-') +
      ' BP=' + (clean.systolicBP || '-') + '/' + (clean.diastolicBP || '-') +
      ' SpO2=' + (clean.spo2 || '-') +
      ' Temp=' + (clean.temperature || '-') + 'F' +
      ' Steps=' + (clean.steps || '-') +
      ' | ' + serverTs
    );

    // 5. Real-time push via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const payload = {
        _id: vital._id,
        userId,
        ...clean,
        source,
        deviceInfo,
        createdAt: serverTs,
        serverTimestamp: Date.now(),
      };

      // Push to personal room + global feed
      io.to('user:' + userId).emit('vitals:new', payload);
      io.to('vitals:feed').emit('vitals:new', payload);

      // 6. Generate & push alerts
      const alerts = generateAlerts(clean);
      if (alerts.length > 0) {
        console.log('ALERTS for ' + userId + ':', alerts.map(a => a.msg).join(' | '));
        io.to('user:' + userId).emit('vitals:alert', { alerts, vital: payload });
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        id: vital._id,
        timestamp: serverTs,
        validated: clean,
        alertCount: generateAlerts(clean).length,
      },
    });
  } catch (err) {
    console.error('Vitals ingest error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================================
// GET /api/vitals/latest - Most recent reading
// ========================================================================
router.get('/latest', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Auth required' });

    const latest = await Vital.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!latest) return res.json({ success: true, data: null });

    const alerts = generateAlerts(latest);
    return res.json({ success: true, data: { ...latest, alerts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================================
// GET /api/vitals/history - Recent readings (default 100, max 500)
// ========================================================================
router.get('/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Auth required' });

    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const history = await Vital.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const enriched = history.map(v => ({ ...v, alerts: generateAlerts(v) }));
    return res.json({ success: true, data: enriched, count: enriched.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================================
// GET /api/vitals/stats - Today's aggregated stats
// ========================================================================
router.get('/stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Auth required' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const mongoose = require('mongoose');
    const stats = await Vital.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId.createFromHexString(userId),
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgHR: { $avg: '$heartRate' },
          minHR: { $min: '$heartRate' },
          maxHR: { $max: '$heartRate' },
          avgSpo2: { $avg: '$spo2' },
          minSpo2: { $min: '$spo2' },
          avgSystolic: { $avg: '$systolicBP' },
          maxSystolic: { $max: '$systolicBP' },
          avgDiastolic: { $avg: '$diastolicBP' },
          maxDiastolic: { $max: '$diastolicBP' },
          avgTemp: { $avg: '$temperature' },
          maxTemp: { $max: '$temperature' },
          maxSteps: { $max: '$steps' },
          maxCalories: { $max: '$calories' },
          avgRespRate: { $avg: '$respiratoryRate' },
          avgStress: { $avg: '$stressLevel' },
          maxStress: { $max: '$stressLevel' },
          avgGlucose: { $avg: '$bloodGlucose' },
          firstReading: { $first: '$createdAt' },
          lastReading: { $last: '$createdAt' },
        },
      },
    ]);

    const data = stats[0] || { count: 0 };

    // Round aggregated values for clean display
    if (data.avgHR) data.avgHR = Math.round(data.avgHR);
    if (data.avgSpo2) data.avgSpo2 = Number(data.avgSpo2.toFixed(1));
    if (data.avgSystolic) data.avgSystolic = Math.round(data.avgSystolic);
    if (data.avgDiastolic) data.avgDiastolic = Math.round(data.avgDiastolic);
    if (data.avgTemp) data.avgTemp = Number(data.avgTemp.toFixed(1));
    if (data.avgRespRate) data.avgRespRate = Math.round(data.avgRespRate);
    if (data.avgStress) data.avgStress = Math.round(data.avgStress);
    if (data.avgGlucose) data.avgGlucose = Math.round(data.avgGlucose);
    data.totalSteps = data.maxSteps || 0;
    data.totalCalories = data.maxCalories || 0;

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
