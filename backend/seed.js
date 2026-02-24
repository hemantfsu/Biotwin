#!/usr/bin/env node
/**
 * Seed script — populates MongoDB with mock predictions for demo user.
 * Run:  node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Prediction = require('./models/Prediction');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biotwin';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Find or create demo user
  let user = await User.findOne({ email: 'demo@biotwin.ai' });
  if (!user) {
    user = await User.create({
      name: 'Dr. Demo',
      email: 'demo@biotwin.ai',
      passwordHash: 'demo123456',
      age: 42,
      gender: 'male',
      role: 'doctor',
    });
    console.log('👤 Created demo user');
  }

  const uid = user._id;

  // Clear existing predictions for this user
  await Prediction.deleteMany({ userId: uid });
  console.log('🗑  Cleared old predictions');

  // ── Lab predictions (5 entries over the last 5 days) ──
  const labPredictions = [
    { riskScore: 0.32, riskLevel: 'low', confidence: 0.91, age: 42, trestbps: 120, chol: 200 },
    { riskScore: 0.45, riskLevel: 'moderate', confidence: 0.88, age: 42, trestbps: 135, chol: 230 },
    { riskScore: 0.58, riskLevel: 'moderate', confidence: 0.85, age: 42, trestbps: 142, chol: 255 },
    { riskScore: 0.41, riskLevel: 'moderate', confidence: 0.90, age: 42, trestbps: 128, chol: 215 },
    { riskScore: 0.27, riskLevel: 'low', confidence: 0.93, age: 42, trestbps: 118, chol: 195 },
  ];

  for (let i = 0; i < labPredictions.length; i++) {
    const lp = labPredictions[i];
    await Prediction.create({
      userId: uid,
      type: 'lab',
      input: {
        age: lp.age, sex: 1, cp: 2, trestbps: lp.trestbps, chol: lp.chol,
        fbs: 0, restecg: 1, thalach: 150, exang: 0, oldpeak: 1.2,
        slope: 1, ca: 0, thal: 2,
      },
      prediction: {
        riskScore: lp.riskScore,
        riskLevel: lp.riskLevel,
        confidence: lp.confidence,
      },
      explanation: {
        top_features: [
          { feature: 'chol', importance: 0.23 },
          { feature: 'trestbps', importance: 0.19 },
          { feature: 'age', importance: 0.15 },
          { feature: 'thalach', importance: 0.12 },
          { feature: 'oldpeak', importance: 0.09 },
        ],
      },
      createdAt: new Date(Date.now() - (labPredictions.length - i) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`🧪 Seeded ${labPredictions.length} lab predictions`);

  // ── Wearable predictions (4 entries) ──
  const wearablePredictions = [
    { riskScore: 0.22, riskLevel: 'low', confidence: 0.87 },
    { riskScore: 0.35, riskLevel: 'low', confidence: 0.82 },
    { riskScore: 0.51, riskLevel: 'moderate', confidence: 0.79 },
    { riskScore: 0.38, riskLevel: 'low', confidence: 0.84 },
  ];

  for (let i = 0; i < wearablePredictions.length; i++) {
    const wp = wearablePredictions[i];
    const trend = Array.from({ length: 24 }, (_, j) =>
      +(0.15 + 0.3 * Math.sin(j / 4) + Math.random() * 0.1).toFixed(3)
    );
    await Prediction.create({
      userId: uid,
      type: 'wearable',
      input: {
        readings: Array.from({ length: 24 }, (_, j) => ({
          heart_rate: 65 + Math.floor(Math.random() * 30),
          spo2: 95 + Math.floor(Math.random() * 4),
          steps: 1000 + Math.floor(Math.random() * 8000),
        })),
      },
      prediction: {
        riskScore: wp.riskScore,
        riskLevel: wp.riskLevel,
        confidence: wp.confidence,
      },
      explanation: { risk_trend: trend },
      createdAt: new Date(Date.now() - (wearablePredictions.length - i) * 18 * 60 * 60 * 1000),
    });
  }
  console.log(`⌚ Seeded ${wearablePredictions.length} wearable predictions`);

  // ── X-ray predictions (3 entries) ──
  const xrayPredictions = [
    { classification: 'Normal', confidence: 0.94, riskLevel: 'low', riskScore: 0.08 },
    { classification: 'Pneumonia', confidence: 0.81, riskLevel: 'high', riskScore: 0.78 },
    { classification: 'Normal', confidence: 0.89, riskLevel: 'low', riskScore: 0.12 },
  ];

  for (let i = 0; i < xrayPredictions.length; i++) {
    const xp = xrayPredictions[i];
    await Prediction.create({
      userId: uid,
      type: 'xray',
      input: { originalFilename: `chest_xray_${i + 1}.png` },
      prediction: {
        classification: xp.classification,
        confidence: xp.confidence,
        riskLevel: xp.riskLevel,
        riskScore: xp.riskScore,
      },
      explanation: { gradcam_url: null },
      imageUrl: null,
      createdAt: new Date(Date.now() - (xrayPredictions.length - i) * 36 * 60 * 60 * 1000),
    });
  }
  console.log(`🩻 Seeded ${xrayPredictions.length} x-ray predictions`);

  console.log('\n🎉 Seed complete! Demo dashboard should now show data.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
