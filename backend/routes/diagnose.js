const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Prediction = require('../models/Prediction');

const router = express.Router();
const ML_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

// ── Reference ranges for lab values ──
const REFERENCE_RANGES = {
  age: { label: 'Age', unit: 'years', normal: [18, 65], warning: [65, 75], critical: [75, 120] },
  trestbps: { label: 'Resting Blood Pressure', unit: 'mmHg', normal: [90, 120], warning: [120, 140], critical: [140, 250] },
  chol: { label: 'Cholesterol', unit: 'mg/dL', normal: [125, 200], warning: [200, 240], critical: [240, 600] },
  fbs: { label: 'Fasting Blood Sugar >120', unit: '', normal: [0, 0], warning: [1, 1], critical: [1, 1] },
  thalach: { label: 'Max Heart Rate', unit: 'bpm', normal: [100, 200], warning: [70, 100], critical: [0, 70] },
  oldpeak: { label: 'ST Depression', unit: 'mm', normal: [0, 1], warning: [1, 2.5], critical: [2.5, 10] },
};

// ── Vital sign reference ranges ──
const VITAL_RANGES = {
  heart_rate: { label: 'Heart Rate', unit: 'bpm', low: [0, 50], normal: [50, 100], high: [100, 150], critical: [150, 300] },
  spo2: { label: 'Blood Oxygen (SpO2)', unit: '%', critical: [0, 90], low: [90, 94], normal: [95, 100], high: [100, 100] },
  systolic_bp: { label: 'Systolic BP', unit: 'mmHg', low: [0, 90], normal: [90, 120], high: [120, 140], critical: [140, 300] },
  diastolic_bp: { label: 'Diastolic BP', unit: 'mmHg', low: [0, 60], normal: [60, 80], high: [80, 90], critical: [90, 200] },
  temperature: { label: 'Temperature', unit: '°F', low: [90, 97], normal: [97, 99.5], high: [99.5, 101.3], critical: [101.3, 110] },
  respiratory_rate: { label: 'Respiratory Rate', unit: '/min', low: [0, 12], normal: [12, 20], high: [20, 25], critical: [25, 60] },
  bmi: { label: 'BMI', unit: 'kg/m²', low: [0, 18.5], normal: [18.5, 25], high: [25, 30], critical: [30, 60] },
};

// ── Disease detection rules ──
function analyzeForDiseases(healthData) {
  const diseases = [];
  const { vitals = {}, labValues = {}, symptoms = [], lifestyle = {} } = healthData;

  // ── Heart Disease Risk ──
  let heartScore = 0;
  const heartFactors = [];
  if (vitals.systolic_bp > 140 || vitals.diastolic_bp > 90) { heartScore += 25; heartFactors.push('High blood pressure'); }
  if (labValues.chol > 240) { heartScore += 20; heartFactors.push('High cholesterol'); }
  if (labValues.chol > 200 && labValues.chol <= 240) { heartScore += 10; heartFactors.push('Borderline cholesterol'); }
  if (labValues.fbs === 1) { heartScore += 15; heartFactors.push('High fasting blood sugar'); }
  if (lifestyle.smoking) { heartScore += 20; heartFactors.push('Smoking'); }
  if (vitals.bmi > 30) { heartScore += 15; heartFactors.push('Obesity (BMI > 30)'); }
  if (labValues.age > 55) { heartScore += 10; heartFactors.push('Age > 55'); }
  if (symptoms.includes('chest_pain')) { heartScore += 30; heartFactors.push('Chest pain reported'); }
  if (symptoms.includes('shortness_of_breath')) { heartScore += 15; heartFactors.push('Shortness of breath'); }
  if (lifestyle.sedentary) { heartScore += 10; heartFactors.push('Sedentary lifestyle'); }
  if (lifestyle.family_heart_disease) { heartScore += 15; heartFactors.push('Family history of heart disease'); }
  if (heartScore > 0) {
    diseases.push({
      name: 'Heart Disease',
      emoji: '❤️',
      riskScore: Math.min(heartScore, 100),
      riskLevel: heartScore >= 60 ? 'high' : heartScore >= 30 ? 'moderate' : 'low',
      factors: heartFactors,
      recommendation: heartScore >= 60
        ? 'Urgent: Consult a cardiologist immediately. Your risk factors are significant.'
        : heartScore >= 30
        ? 'Schedule a cardiac checkup. Improve diet and exercise.'
        : 'Maintain a healthy lifestyle. Monitor blood pressure regularly.',
    });
  }

  // ── Diabetes Risk ──
  let diabetesScore = 0;
  const diabetesFactors = [];
  if (labValues.fbs === 1) { diabetesScore += 30; diabetesFactors.push('Elevated fasting blood sugar'); }
  if (vitals.bmi > 30) { diabetesScore += 20; diabetesFactors.push('Obesity'); }
  if (vitals.bmi > 25 && vitals.bmi <= 30) { diabetesScore += 10; diabetesFactors.push('Overweight'); }
  if (symptoms.includes('frequent_urination')) { diabetesScore += 25; diabetesFactors.push('Frequent urination'); }
  if (symptoms.includes('excessive_thirst')) { diabetesScore += 20; diabetesFactors.push('Excessive thirst'); }
  if (symptoms.includes('blurred_vision')) { diabetesScore += 15; diabetesFactors.push('Blurred vision'); }
  if (lifestyle.sedentary) { diabetesScore += 10; diabetesFactors.push('Sedentary lifestyle'); }
  if (lifestyle.family_diabetes) { diabetesScore += 15; diabetesFactors.push('Family history of diabetes'); }
  if (labValues.age > 45) { diabetesScore += 10; diabetesFactors.push('Age > 45'); }
  if (diabetesScore > 0) {
    diseases.push({
      name: 'Diabetes',
      emoji: '🩸',
      riskScore: Math.min(diabetesScore, 100),
      riskLevel: diabetesScore >= 50 ? 'high' : diabetesScore >= 25 ? 'moderate' : 'low',
      factors: diabetesFactors,
      recommendation: diabetesScore >= 50
        ? 'Urgent: Get an HbA1c test. Consult an endocrinologist.'
        : 'Monitor blood sugar regularly. Reduce carb intake and exercise.',
    });
  }

  // ── Hypertension ──
  let htScore = 0;
  const htFactors = [];
  if (vitals.systolic_bp >= 180 || vitals.diastolic_bp >= 120) { htScore += 50; htFactors.push('Hypertensive crisis (≥180/120)'); }
  else if (vitals.systolic_bp >= 140 || vitals.diastolic_bp >= 90) { htScore += 35; htFactors.push('Stage 2 hypertension'); }
  else if (vitals.systolic_bp >= 130 || vitals.diastolic_bp >= 80) { htScore += 20; htFactors.push('Stage 1 hypertension'); }
  else if (vitals.systolic_bp >= 120) { htScore += 10; htFactors.push('Elevated blood pressure'); }
  if (lifestyle.high_salt_diet) { htScore += 15; htFactors.push('High salt diet'); }
  if (lifestyle.smoking) { htScore += 10; htFactors.push('Smoking'); }
  if (symptoms.includes('headache')) { htScore += 10; htFactors.push('Frequent headaches'); }
  if (vitals.bmi > 30) { htScore += 10; htFactors.push('Obesity'); }
  if (htScore > 0) {
    diseases.push({
      name: 'Hypertension',
      emoji: '🩺',
      riskScore: Math.min(htScore, 100),
      riskLevel: htScore >= 50 ? 'high' : htScore >= 25 ? 'moderate' : 'low',
      factors: htFactors,
      recommendation: htScore >= 50
        ? 'Urgent: Seek medical attention. Your blood pressure is dangerously high.'
        : 'Reduce sodium intake, exercise regularly, manage stress.',
    });
  }

  // ── Respiratory Issues ──
  let respScore = 0;
  const respFactors = [];
  if (vitals.spo2 && vitals.spo2 < 90) { respScore += 40; respFactors.push('Critical: SpO2 below 90%'); }
  else if (vitals.spo2 && vitals.spo2 < 94) { respScore += 20; respFactors.push('Low SpO2 (below 94%)'); }
  if (vitals.respiratory_rate > 25) { respScore += 25; respFactors.push('High respiratory rate'); }
  if (symptoms.includes('shortness_of_breath')) { respScore += 20; respFactors.push('Shortness of breath'); }
  if (symptoms.includes('persistent_cough')) { respScore += 15; respFactors.push('Persistent cough'); }
  if (symptoms.includes('chest_pain')) { respScore += 15; respFactors.push('Chest pain when breathing'); }
  if (lifestyle.smoking) { respScore += 15; respFactors.push('Smoking history'); }
  if (respScore > 0) {
    diseases.push({
      name: 'Respiratory Disease',
      emoji: '🫁',
      riskScore: Math.min(respScore, 100),
      riskLevel: respScore >= 50 ? 'high' : respScore >= 25 ? 'moderate' : 'low',
      factors: respFactors,
      recommendation: respScore >= 50
        ? 'Urgent: Get a chest X-ray and pulmonary function test. Low oxygen levels need immediate attention.'
        : 'Monitor breathing. Consider a chest X-ray if symptoms persist.',
    });
  }

  // ── Stroke Risk ──
  let strokeScore = 0;
  const strokeFactors = [];
  if (vitals.systolic_bp >= 180) { strokeScore += 30; strokeFactors.push('Severe hypertension'); }
  else if (vitals.systolic_bp >= 140) { strokeScore += 15; strokeFactors.push('High blood pressure'); }
  if (symptoms.includes('sudden_numbness')) { strokeScore += 35; strokeFactors.push('Sudden numbness/weakness'); }
  if (symptoms.includes('confusion')) { strokeScore += 25; strokeFactors.push('Confusion or speech difficulty'); }
  if (symptoms.includes('vision_problems')) { strokeScore += 20; strokeFactors.push('Sudden vision problems'); }
  if (symptoms.includes('severe_headache')) { strokeScore += 20; strokeFactors.push('Severe headache'); }
  if (labValues.age > 65) { strokeScore += 10; strokeFactors.push('Age > 65'); }
  if (lifestyle.smoking) { strokeScore += 10; strokeFactors.push('Smoking'); }
  if (strokeScore > 0) {
    diseases.push({
      name: 'Stroke',
      emoji: '🧠',
      riskScore: Math.min(strokeScore, 100),
      riskLevel: strokeScore >= 50 ? 'high' : strokeScore >= 25 ? 'moderate' : 'low',
      factors: strokeFactors,
      recommendation: strokeScore >= 50
        ? '🚨 EMERGENCY: If experiencing symptoms NOW, call 911 immediately! Remember FAST: Face, Arms, Speech, Time.'
        : 'Control blood pressure, maintain healthy lifestyle, regular checkups.',
    });
  }

  // ── Anemia ──
  let anemiaScore = 0;
  const anemiaFactors = [];
  if (symptoms.includes('fatigue')) { anemiaScore += 20; anemiaFactors.push('Persistent fatigue'); }
  if (symptoms.includes('dizziness')) { anemiaScore += 15; anemiaFactors.push('Dizziness'); }
  if (symptoms.includes('pale_skin')) { anemiaScore += 20; anemiaFactors.push('Pale skin'); }
  if (symptoms.includes('cold_hands_feet')) { anemiaScore += 10; anemiaFactors.push('Cold hands/feet'); }
  if (vitals.heart_rate > 100) { anemiaScore += 10; anemiaFactors.push('Elevated resting heart rate'); }
  if (anemiaScore > 0) {
    diseases.push({
      name: 'Anemia',
      emoji: '🔴',
      riskScore: Math.min(anemiaScore, 100),
      riskLevel: anemiaScore >= 40 ? 'moderate' : 'low',
      factors: anemiaFactors,
      recommendation: 'Get a complete blood count (CBC) test. Increase iron-rich foods (spinach, red meat, lentils).',
    });
  }

  return diseases.sort((a, b) => b.riskScore - a.riskScore);
}

// ── Generate alerts/notifications ──
function generateAlerts(healthData, diseases, mlResults) {
  const alerts = [];
  const { vitals = {}, labValues = {} } = healthData;

  // Critical vital alerts
  if (vitals.spo2 && vitals.spo2 < 90) {
    alerts.push({ severity: 'critical', icon: '🚨', title: 'Critical: Dangerously Low Oxygen', message: `SpO2 is ${vitals.spo2}%. Normal is 95-100%. Seek emergency care immediately.`, action: 'Call 911 / Emergency' });
  }
  if (vitals.systolic_bp >= 180 || vitals.diastolic_bp >= 120) {
    alerts.push({ severity: 'critical', icon: '🚨', title: 'Hypertensive Crisis', message: `BP is ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg. This is a medical emergency.`, action: 'Seek emergency care' });
  }
  if (vitals.heart_rate && vitals.heart_rate > 150) {
    alerts.push({ severity: 'critical', icon: '🚨', title: 'Dangerously High Heart Rate', message: `Heart rate is ${vitals.heart_rate} bpm. Normal resting is 60-100 bpm.`, action: 'Seek medical attention' });
  }
  if (vitals.heart_rate && vitals.heart_rate < 40) {
    alerts.push({ severity: 'critical', icon: '🚨', title: 'Dangerously Low Heart Rate', message: `Heart rate is ${vitals.heart_rate} bpm. This may indicate bradycardia.`, action: 'Seek medical attention' });
  }
  if (vitals.temperature && vitals.temperature > 103) {
    alerts.push({ severity: 'critical', icon: '🚨', title: 'High Fever', message: `Temperature is ${vitals.temperature}°F. High fever needs medical attention.`, action: 'Seek medical care' });
  }

  // Warning alerts
  if (vitals.spo2 && vitals.spo2 >= 90 && vitals.spo2 < 94) {
    alerts.push({ severity: 'warning', icon: '⚠️', title: 'Low Blood Oxygen', message: `SpO2 is ${vitals.spo2}%. Consider monitoring closely.`, action: 'Monitor and consult doctor if persistent' });
  }
  if (vitals.systolic_bp >= 140 && vitals.systolic_bp < 180) {
    alerts.push({ severity: 'warning', icon: '⚠️', title: 'High Blood Pressure', message: `BP is ${vitals.systolic_bp}/${vitals.diastolic_bp || '?'} mmHg. Stage 2 hypertension.`, action: 'Consult your doctor' });
  }
  if (labValues.chol > 240) {
    alerts.push({ severity: 'warning', icon: '⚠️', title: 'High Cholesterol', message: `Cholesterol is ${labValues.chol} mg/dL. Goal is <200 mg/dL.`, action: 'Diet changes + consult doctor' });
  }
  if (vitals.bmi > 30) {
    alerts.push({ severity: 'warning', icon: '⚠️', title: 'Obesity Detected', message: `BMI is ${vitals.bmi}. Healthy range is 18.5-24.9.`, action: 'Weight management plan' });
  }
  if (vitals.temperature && vitals.temperature > 99.5 && vitals.temperature <= 103) {
    alerts.push({ severity: 'warning', icon: '⚠️', title: 'Fever Detected', message: `Temperature is ${vitals.temperature}°F. Monitor and rest.`, action: 'Rest and hydrate' });
  }

  // ML model alerts
  if (mlResults?.labRisk?.prediction > 0.7) {
    alerts.push({ severity: 'warning', icon: '🤖', title: 'AI: High Heart Disease Risk', message: `Our AI model predicts ${(mlResults.labRisk.prediction * 100).toFixed(0)}% heart disease risk based on your lab values.`, action: 'Use Lab Prediction for details' });
  }

  // Info / early warning alerts
  if (labValues.chol > 200 && labValues.chol <= 240) {
    alerts.push({ severity: 'info', icon: '💡', title: 'Borderline Cholesterol', message: 'Your cholesterol is borderline high. Dietary changes can help.', action: 'Reduce saturated fats' });
  }
  if (vitals.systolic_bp >= 120 && vitals.systolic_bp < 130) {
    alerts.push({ severity: 'info', icon: '💡', title: 'Elevated Blood Pressure', message: 'Your BP is elevated. Lifestyle changes can prevent hypertension.', action: 'Reduce salt, exercise more' });
  }
  if (vitals.bmi > 25 && vitals.bmi <= 30) {
    alerts.push({ severity: 'info', icon: '💡', title: 'Overweight', message: `BMI is ${vitals.bmi}. You're slightly above healthy range.`, action: 'Aim for 150 min exercise/week' });
  }

  // High-risk disease alerts
  diseases.filter(d => d.riskLevel === 'high').forEach(d => {
    alerts.push({ severity: 'warning', icon: d.emoji, title: `High Risk: ${d.name}`, message: `Risk score: ${d.riskScore}%. ${d.factors.slice(0, 2).join(', ')}.`, action: d.recommendation.slice(0, 80) });
  });

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
}

// ── Generate health score ──
function calculateHealthScore(vitals, labValues, diseases) {
  let score = 100;
  
  // Deduct for abnormal vitals
  if (vitals.systolic_bp > 140) score -= 15;
  else if (vitals.systolic_bp > 120) score -= 5;
  if (vitals.spo2 && vitals.spo2 < 95) score -= 15;
  if (vitals.heart_rate > 100 || vitals.heart_rate < 50) score -= 10;
  if (vitals.bmi > 30) score -= 10;
  else if (vitals.bmi > 25) score -= 5;
  if (vitals.temperature && vitals.temperature > 99.5) score -= 10;
  
  // Deduct for high-risk diseases
  diseases.forEach(d => {
    if (d.riskLevel === 'high') score -= 15;
    else if (d.riskLevel === 'moderate') score -= 8;
    else score -= 3;
  });

  // Deduct for lab abnormalities
  if (labValues.chol > 240) score -= 10;
  if (labValues.fbs === 1) score -= 5;
  if (labValues.oldpeak > 2) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── POST /api/diagnose — Comprehensive health diagnosis ──
router.post(
  '/',
  authenticate,
  [
    body('vitals').optional().isObject(),
    body('labValues').optional().isObject(),
    body('symptoms').optional().isArray(),
    body('lifestyle').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid data.', details: errors.array() });
      }

      const healthData = {
        vitals: req.body.vitals || {},
        labValues: req.body.labValues || {},
        symptoms: req.body.symptoms || [],
        lifestyle: req.body.lifestyle || {},
      };

      // Run AI lab risk model if lab values provided
      let mlResults = {};
      const lab = healthData.labValues;
      if (lab.age && lab.chol && lab.trestbps) {
        try {
          const mlRes = await axios.post(`${ML_URL}/predict/lab`, {
            age: lab.age, sex: lab.sex ?? 1, cp: lab.cp ?? 0,
            trestbps: lab.trestbps || healthData.vitals.systolic_bp || 120,
            chol: lab.chol, fbs: lab.fbs ?? 0, restecg: lab.restecg ?? 0,
            thalach: lab.thalach || healthData.vitals.heart_rate || 150,
            exang: lab.exang ?? 0, oldpeak: lab.oldpeak ?? 0,
            slope: lab.slope ?? 1, ca: lab.ca ?? 0, thal: lab.thal ?? 2,
          });
          mlResults.labRisk = mlRes.data;
        } catch (e) {
          console.error('ML lab call failed:', e.message);
        }
      }

      // Analyze for diseases
      const diseases = analyzeForDiseases(healthData);
      
      // Generate alerts
      const alerts = generateAlerts(healthData, diseases, mlResults);
      
      // Calculate health score
      const healthScore = calculateHealthScore(healthData.vitals, healthData.labValues, diseases);

      // Vital sign analysis
      const vitalAnalysis = {};
      for (const [key, value] of Object.entries(healthData.vitals)) {
        const ref = VITAL_RANGES[key];
        if (!ref || typeof value !== 'number') continue;
        let status = 'normal';
        if (ref.critical && value >= ref.critical[0] && value <= ref.critical[1]) status = key === 'spo2' ? 'critical' : 'critical';
        if (ref.low && value >= ref.low[0] && value < ref.low[1]) status = 'low';
        if (ref.high && value >= ref.high[0] && value <= ref.high[1]) status = 'high';
        if (ref.normal && value >= ref.normal[0] && value <= ref.normal[1]) status = 'normal';
        // For SpO2, low/critical ranges are reversed
        if (key === 'spo2') {
          if (value < 90) status = 'critical';
          else if (value < 95) status = 'low';
          else status = 'normal';
        }
        vitalAnalysis[key] = { value, label: ref.label, unit: ref.unit, status };
      }

      // Save diagnosis to DB
      const record = await Prediction.create({
        userId: req.user.id,
        type: 'lab',
        input: healthData,
        prediction: {
          riskScore: healthScore / 100,
          riskLevel: healthScore < 40 ? 'high' : healthScore < 70 ? 'moderate' : 'low',
          confidence: 0.85,
        },
        explanation: { diseases, alerts, mlResults },
      });

      res.json({
        success: true,
        data: {
          healthScore,
          healthGrade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : healthScore >= 20 ? 'D' : 'F',
          diseases,
          alerts,
          vitalAnalysis,
          mlResults,
          diagnosisId: record._id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Diagnosis error:', err.message);
      res.status(500).json({ success: false, error: 'Diagnosis failed.' });
    }
  }
);

module.exports = router;
