const express = require('express');
const router = express.Router();

const ML_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

// ── Disease Knowledge Base ──
const DISEASES = {
  'heart disease': {
    name: 'Heart Disease',
    emoji: '❤️',
    description: 'Heart disease refers to conditions affecting the heart, including coronary artery disease, heart rhythm problems (arrhythmias), and heart defects.',
    symptoms: ['Chest pain or discomfort', 'Shortness of breath', 'Pain in neck, jaw, or throat', 'Fatigue and weakness', 'Irregular heartbeat', 'Swollen legs, ankles, or feet', 'Dizziness or lightheadedness'],
    causes: ['High blood pressure', 'High cholesterol', 'Smoking', 'Diabetes', 'Obesity', 'Sedentary lifestyle', 'Family history', 'Stress'],
    prevention: ['Exercise regularly (30 min/day)', 'Eat a heart-healthy diet (low salt, low saturated fat)', 'Maintain healthy weight', 'Quit smoking', 'Manage stress', 'Control blood pressure & cholesterol', 'Get regular checkups'],
    riskFactors: ['Age (men >45, women >55)', 'Family history', 'Smoking', 'Poor diet', 'High blood pressure', 'High cholesterol', 'Diabetes', 'Obesity'],
    stats: 'Heart disease is the #1 cause of death globally, killing ~17.9 million people per year (WHO).',
    relatedModel: 'Lab Risk Prediction — uses 13 clinical features to assess your heart disease risk with AI.',
  },
  pneumonia: {
    name: 'Pneumonia',
    emoji: '🫁',
    description: 'Pneumonia is an infection that inflames the air sacs in one or both lungs.',
    symptoms: ['Cough with phlegm or pus', 'Fever, sweating, and chills', 'Shortness of breath', 'Chest pain when breathing or coughing', 'Fatigue', 'Nausea, vomiting, or diarrhea', 'Confusion (in older adults)'],
    causes: ['Bacteria (Streptococcus pneumoniae)', 'Viruses (flu, COVID-19, RSV)', 'Fungi', 'Aspiration of food/liquid into lungs'],
    prevention: ['Get vaccinated (pneumococcal vaccine)', 'Practice good hygiene', "Don't smoke", 'Keep immune system strong', 'Get flu vaccine annually'],
    riskFactors: ['Age (children <2, adults >65)', 'Chronic lung disease', 'Weakened immune system', 'Smoking', 'Hospitalization (ventilator use)'],
    stats: 'Pneumonia kills ~2.5 million people annually, including 672,000 children under 5 (WHO).',
    relatedModel: 'X-ray Classification — our CNN can detect pneumonia from chest X-rays with GradCAM visualization.',
  },
  'covid-19': {
    name: 'COVID-19',
    emoji: '🦠',
    description: 'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus.',
    symptoms: ['Fever or chills', 'Cough', 'Loss of taste or smell', 'Shortness of breath', 'Fatigue', 'Body aches', 'Sore throat', 'Headache', 'Congestion'],
    causes: ['SARS-CoV-2 virus', 'Spread through respiratory droplets', 'Airborne transmission in enclosed spaces'],
    prevention: ['Get vaccinated and boosted', 'Wear masks in crowded indoor spaces', 'Wash hands frequently', 'Maintain social distance'],
    riskFactors: ['Age (older adults)', 'Obesity', 'Diabetes', 'Heart or lung disease', 'Weakened immune system', 'Smoking'],
    stats: 'COVID-19 has caused over 7 million confirmed deaths worldwide since 2020 (WHO).',
    relatedModel: 'X-ray Classification — our CNN detects COVID-19 patterns (ground-glass opacities) in chest X-rays.',
  },
  tuberculosis: {
    name: 'Tuberculosis (TB)',
    emoji: '🔬',
    description: 'Tuberculosis is a bacterial infection caused by Mycobacterium tuberculosis that primarily affects the lungs.',
    symptoms: ['Persistent cough (3+ weeks)', 'Coughing up blood', 'Chest pain', 'Unintentional weight loss', 'Fatigue', 'Night sweats', 'Fever', 'Loss of appetite'],
    causes: ['Mycobacterium tuberculosis bacteria', 'Airborne transmission from infected person'],
    prevention: ['BCG vaccination', 'Good ventilation', 'Cover mouth when coughing', 'Complete full course of TB treatment'],
    riskFactors: ['HIV/AIDS', 'Weakened immune system', 'Close contact with TB patients', 'Living in crowded conditions', 'Malnutrition'],
    stats: 'TB kills ~1.3 million people annually (WHO).',
    relatedModel: 'X-ray Classification — our CNN identifies TB patterns in chest X-rays.',
  },
  diabetes: {
    name: 'Diabetes',
    emoji: '🩸',
    description: 'Diabetes is a chronic condition where the body cannot properly process blood glucose (sugar).',
    symptoms: ['Frequent urination', 'Excessive thirst', 'Unexplained weight loss', 'Blurred vision', 'Slow-healing sores', 'Frequent infections', 'Tingling in hands/feet', 'Fatigue'],
    causes: ['Type 1: Autoimmune destruction of insulin-producing cells', 'Type 2: Insulin resistance + inadequate insulin production'],
    prevention: ['Maintain healthy weight', 'Exercise regularly', 'Eat balanced diet (limit sugar and refined carbs)', 'Monitor blood sugar levels'],
    riskFactors: ['Family history', 'Obesity', 'Sedentary lifestyle', 'Age >45', 'High blood pressure'],
    stats: '~537 million adults worldwide have diabetes (IDF).',
    relatedModel: 'Our Lab Risk Model includes fasting blood sugar as a key feature — diabetes significantly increases heart disease risk.',
  },
  hypertension: {
    name: 'Hypertension (High Blood Pressure)',
    emoji: '🩺',
    description: 'Hypertension is persistently elevated blood pressure (≥130/80 mmHg). It\'s called the "silent killer".',
    symptoms: ['Usually no symptoms (silent)', 'Severe cases: headaches', 'Shortness of breath', 'Nosebleeds', 'Dizziness'],
    causes: ['Primary: No identifiable cause (genetic + lifestyle)', 'Secondary: Kidney disease, thyroid problems', 'High sodium diet', 'Chronic stress'],
    prevention: ['Reduce sodium intake (<2,300mg/day)', 'Exercise regularly', 'Maintain healthy weight', 'Limit alcohol', 'Manage stress'],
    riskFactors: ['Age', 'Family history', 'Obesity', 'High sodium diet', 'Lack of exercise', 'Excessive alcohol', 'Stress', 'Smoking'],
    stats: '~1.28 billion adults worldwide have hypertension (WHO).',
    relatedModel: 'Our Lab Risk Model uses resting blood pressure (trestbps) as a key predictor of heart disease.',
  },
  stroke: {
    name: 'Stroke',
    emoji: '🧠',
    description: 'A stroke occurs when blood supply to part of the brain is interrupted or reduced.',
    symptoms: ['Sudden numbness (face, arm, leg)', 'Confusion, trouble speaking', 'Vision problems', 'Difficulty walking, dizziness', 'Severe headache', 'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency'],
    causes: ['Ischemic stroke (blood clot blocks artery — 87%)', 'Hemorrhagic stroke (blood vessel bursts)'],
    prevention: ['Control blood pressure', 'Exercise regularly', 'Healthy diet', 'Manage diabetes', 'Quit smoking'],
    riskFactors: ['High blood pressure (#1 risk)', 'Heart disease', 'Diabetes', 'Smoking', 'Obesity', 'High cholesterol', 'Age'],
    stats: 'Stroke is the 2nd leading cause of death worldwide, killing ~6.5 million people annually (WHO).',
    relatedModel: 'Our platform monitors multiple stroke risk factors through lab tests and wearable heart rate monitoring.',
  },
};

// ── BioTwin Feature Info ──
const FEATURES = {
  lab: {
    name: 'Lab Risk Prediction',
    emoji: '🧪',
    description: 'Analyzes 13 clinical lab values using a Gradient Boosting AI model trained on real heart disease data.',
    howToUse: 'Go to **Lab Prediction** page, enter your values or click "Fill sample", then submit.',
    accuracy: '91% AUC-ROC on UCI Heart Disease dataset',
    explanation: 'Uses SHAP (SHapley Additive exPlanations) to show which lab values contributed most to your risk score.',
  },
  wearable: {
    name: 'Wearable Health Monitor',
    emoji: '⌚',
    description: 'Processes 24-hour smartwatch data (heart rate, SpO2, steps) using a Bidirectional LSTM neural network.',
    howToUse: 'Go to **Wearable Prediction** page, enter your 24-hour readings or click "Generate sample".',
    accuracy: '100% classification AUC on validation data',
  },
  xray: {
    name: 'X-ray Classification',
    emoji: '🫁',
    description: 'Classifies chest X-rays into Normal, Pneumonia, COVID-19, or Tuberculosis using EfficientNetB0.',
    howToUse: 'Go to **X-ray Analysis** page, upload a chest X-ray image, then submit.',
    accuracy: '100% test accuracy across 4 classes',
    explanation: 'Generates a GradCAM heatmap overlay showing which regions the AI focused on.',
  },
  diagnosis: {
    name: 'Health Diagnosis',
    emoji: '🏥',
    description: 'Comprehensive 6-disease detection engine. Enter your vitals, labs, and lifestyle to get a full health report.',
    howToUse: 'Go to **Health Diagnosis** page, fill in your data (or use sample profiles), and run the diagnosis.',
  },
};

// ── Health Tips ──
const HEALTH_TIPS = [
  '💪 Aim for at least 150 minutes of moderate exercise per week.',
  '🥗 Fill half your plate with fruits and vegetables at every meal.',
  '😴 Adults need 7-9 hours of sleep per night for optimal health.',
  '💧 Drink at least 8 glasses of water daily to stay hydrated.',
  '🧘 Practice stress management through meditation or deep breathing.',
  '🚶 Take a 10-minute walk after meals to improve blood sugar control.',
  '🫀 Know your numbers: blood pressure, cholesterol, and blood sugar.',
  '🚭 If you smoke, quitting is the single best thing you can do for your health.',
  '🧂 Limit sodium to less than 2,300mg per day (about 1 teaspoon of salt).',
  '🍎 Replace processed snacks with whole fruits, nuts, or yogurt.',
  "📱 Use BioTwin's wearable monitoring to track your heart rate trends!",
  '🩻 Regular health checkups can catch diseases early when they\'re most treatable.',
  '🏋️ Strength training 2x per week helps maintain muscle mass and bone density.',
  '🫁 Practice deep breathing exercises: inhale 4 sec, hold 7 sec, exhale 8 sec.',
  '❤️ Laugh more! Laughter reduces stress hormones and boosts immune function.',
];

// ── Symptom synonym mapping ──
const SYMPTOM_MAP = {
  'chest pain': 'chest_pain',
  'chest tightness': 'chest_pain',
  'chest discomfort': 'chest_pain',
  'shortness of breath': 'shortness_of_breath',
  'breathing difficulty': 'shortness_of_breath',
  'hard to breathe': 'shortness_of_breath',
  "can't breathe": 'shortness_of_breath',
  'breathless': 'shortness_of_breath',
  'difficulty breathing': 'shortness_of_breath',
  'headache': 'headache',
  'head pain': 'headache',
  'migraine': 'headache',
  'fatigue': 'fatigue',
  'tired': 'fatigue',
  'exhausted': 'fatigue',
  'weakness': 'fatigue',
  'no energy': 'fatigue',
  'low energy': 'fatigue',
  'dizziness': 'dizziness',
  'dizzy': 'dizziness',
  'lightheaded': 'dizziness',
  'vertigo': 'dizziness',
  'fever': 'fever',
  'high temperature': 'fever',
  'chills': 'fever',
  'cough': 'persistent_cough',
  'coughing': 'persistent_cough',
  'persistent cough': 'persistent_cough',
  'nausea': 'nausea',
  'vomiting': 'nausea',
  'feel sick': 'nausea',
  'blurred vision': 'blurred_vision',
  'vision problem': 'vision_problems',
  'vision problems': 'vision_problems',
  "can't see clearly": 'blurred_vision',
  'frequent urination': 'frequent_urination',
  'peeing a lot': 'frequent_urination',
  'excessive thirst': 'excessive_thirst',
  'very thirsty': 'excessive_thirst',
  'always thirsty': 'excessive_thirst',
  'weight loss': 'unexplained_weight_loss',
  'losing weight': 'unexplained_weight_loss',
  'numbness': 'sudden_numbness',
  'tingling': 'sudden_numbness',
  'confusion': 'confusion',
  'confused': 'confusion',
  'palpitations': 'palpitations',
  'heart racing': 'palpitations',
  'rapid heartbeat': 'palpitations',
  'irregular heartbeat': 'palpitations',
  'swollen legs': 'swollen_legs',
  'swollen ankles': 'swollen_legs',
  'swelling': 'swollen_legs',
  'pale skin': 'pale_skin',
  'cold hands': 'cold_hands_feet',
  'cold feet': 'cold_hands_feet',
  'night sweats': 'night_sweats',
  'sweating at night': 'night_sweats',
  'loss of appetite': 'loss_of_appetite',
  'no appetite': 'loss_of_appetite',
  'body ache': 'body_ache',
  'body pain': 'body_ache',
  'muscle pain': 'body_ache',
  'sore throat': 'sore_throat',
  'throat pain': 'sore_throat',
  'back pain': 'back_pain',
  'joint pain': 'joint_pain',
  'stomach pain': 'stomach_pain',
  'abdominal pain': 'stomach_pain',
};

// ── Extract vitals from natural text ──
function extractVitals(msg) {
  const vitals = {};
  const lower = msg.toLowerCase();

  // Heart rate
  const hrMatch = lower.match(/(?:heart\s*rate|hr|pulse|bpm)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)/i) ||
                  lower.match(/(\d+)\s*(?:bpm|heart\s*rate|pulse)/i);
  if (hrMatch) vitals.heartRate = parseInt(hrMatch[1]);

  // Blood pressure
  const bpMatch = lower.match(/(?:bp|blood\s*pressure)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)\s*[\/\-]\s*(\d+)/i) ||
                  lower.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})\s*(?:mmhg|bp|blood\s*pressure)/i);
  if (bpMatch) {
    vitals.systolicBP = parseInt(bpMatch[1]);
    vitals.diastolicBP = parseInt(bpMatch[2]);
  }

  // SpO2
  const spo2Match = lower.match(/(?:spo2|oxygen|o2\s*sat(?:uration)?)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)/i) ||
                    lower.match(/(\d+)\s*(?:%?\s*spo2|%?\s*oxygen\s*level)/i);
  if (spo2Match) {
    const v = parseInt(spo2Match[1]);
    if (v >= 70 && v <= 100) vitals.spo2 = v;
  }

  // Temperature
  const tempMatch = lower.match(/(?:temp(?:erature)?|fever)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?([\d.]+)\s*(?:°?\s*f|fahrenheit)?/i) ||
                    lower.match(/([\d.]+)\s*(?:°?\s*f|degrees?\s*f)/i);
  if (tempMatch) {
    const v = parseFloat(tempMatch[1]);
    if (v >= 90 && v <= 110) vitals.temperature = v;
  }

  // Respiratory rate
  const rrMatch = lower.match(/(?:resp(?:iratory)?\s*rate|rr|breathing\s*rate)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)/i);
  if (rrMatch) vitals.respiratoryRate = parseInt(rrMatch[1]);

  // Blood sugar / glucose
  const bsMatch = lower.match(/(?:blood\s*(?:sugar|glucose)|glucose|sugar\s*level|fasting\s*(?:sugar|glucose))[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)/i) ||
                  lower.match(/(\d+)\s*(?:mg\s*\/?\s*dl\s*(?:sugar|glucose|blood))/i);
  if (bsMatch) vitals.bloodGlucose = parseInt(bsMatch[1]);

  // Cholesterol
  const cholMatch = lower.match(/(?:cholesterol|chol)[\s:=]*(?:is\s*|of\s*|at\s*|around\s*)?(\d+)/i);
  if (cholMatch) vitals.cholesterol = parseInt(cholMatch[1]);

  // Age
  const ageMatch = lower.match(/(?:age|i\s*am|i'm|i\s*m)\s*(\d+)\s*(?:years?\s*old|yrs?|y\.?o\.?)?/i) ||
                   lower.match(/(\d+)\s*(?:years?\s*old|yr\s*old)/i);
  if (ageMatch) {
    const v = parseInt(ageMatch[1]);
    if (v >= 1 && v <= 120) vitals.age = v;
  }

  return Object.keys(vitals).length > 0 ? vitals : null;
}

// ── Extract symptoms from natural text ──
function extractSymptoms(msg) {
  const lower = msg.toLowerCase();
  const found = [];
  const foundLabels = [];

  // Sort by phrase length descending so longer phrases match first
  const entries = Object.entries(SYMPTOM_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [phrase, code] of entries) {
    if (lower.includes(phrase) && !found.includes(code)) {
      found.push(code);
      foundLabels.push(phrase);
    }
  }

  return found.length > 0 ? { codes: found, labels: foundLabels } : null;
}

// ── Run disease prediction from extracted data ──
function runQuickDiagnosis(vitals, symptomCodes) {
  const diseases = [];

  const v = {
    heart_rate: vitals.heartRate,
    systolic_bp: vitals.systolicBP,
    diastolic_bp: vitals.diastolicBP,
    spo2: vitals.spo2,
    temperature: vitals.temperature,
    respiratory_rate: vitals.respiratoryRate,
  };

  const symptoms = symptomCodes || [];

  // ── Heart Disease ──
  let heartScore = 0;
  const heartFactors = [];
  if (v.systolic_bp > 140 || v.diastolic_bp > 90) { heartScore += 25; heartFactors.push('High blood pressure'); }
  if (vitals.cholesterol > 240) { heartScore += 20; heartFactors.push('High cholesterol'); }
  else if (vitals.cholesterol > 200) { heartScore += 10; heartFactors.push('Borderline cholesterol'); }
  if (symptoms.includes('chest_pain')) { heartScore += 30; heartFactors.push('Chest pain'); }
  if (symptoms.includes('shortness_of_breath')) { heartScore += 15; heartFactors.push('Shortness of breath'); }
  if (symptoms.includes('palpitations')) { heartScore += 15; heartFactors.push('Palpitations'); }
  if (v.heart_rate > 100) { heartScore += 10; heartFactors.push('Elevated heart rate'); }
  if (vitals.age > 55) { heartScore += 10; heartFactors.push('Age > 55'); }
  if (symptoms.includes('swollen_legs')) { heartScore += 10; heartFactors.push('Swelling in legs'); }
  if (heartScore > 0) diseases.push({ name: 'Heart Disease', emoji: '❤️', score: Math.min(heartScore, 100), level: heartScore >= 50 ? 'HIGH' : heartScore >= 25 ? 'MODERATE' : 'LOW', factors: heartFactors });

  // ── Diabetes ──
  let diabetesScore = 0;
  const diabetesFactors = [];
  if (vitals.bloodGlucose > 126) { diabetesScore += 35; diabetesFactors.push(`High fasting glucose (${vitals.bloodGlucose} mg/dL)`); }
  else if (vitals.bloodGlucose > 100) { diabetesScore += 15; diabetesFactors.push(`Pre-diabetic glucose (${vitals.bloodGlucose} mg/dL)`); }
  if (symptoms.includes('frequent_urination')) { diabetesScore += 25; diabetesFactors.push('Frequent urination'); }
  if (symptoms.includes('excessive_thirst')) { diabetesScore += 20; diabetesFactors.push('Excessive thirst'); }
  if (symptoms.includes('blurred_vision')) { diabetesScore += 15; diabetesFactors.push('Blurred vision'); }
  if (symptoms.includes('fatigue')) { diabetesScore += 10; diabetesFactors.push('Fatigue'); }
  if (symptoms.includes('unexplained_weight_loss')) { diabetesScore += 15; diabetesFactors.push('Unexplained weight loss'); }
  if (diabetesScore > 0) diseases.push({ name: 'Diabetes', emoji: '🩸', score: Math.min(diabetesScore, 100), level: diabetesScore >= 50 ? 'HIGH' : diabetesScore >= 25 ? 'MODERATE' : 'LOW', factors: diabetesFactors });

  // ── Hypertension ──
  let htScore = 0;
  const htFactors = [];
  if (v.systolic_bp >= 180 || v.diastolic_bp >= 120) { htScore += 50; htFactors.push(`Hypertensive crisis (${v.systolic_bp}/${v.diastolic_bp})`); }
  else if (v.systolic_bp >= 140 || v.diastolic_bp >= 90) { htScore += 35; htFactors.push(`Stage 2 hypertension (${v.systolic_bp}/${v.diastolic_bp})`); }
  else if (v.systolic_bp >= 130 || v.diastolic_bp >= 80) { htScore += 20; htFactors.push(`Stage 1 hypertension (${v.systolic_bp}/${v.diastolic_bp})`); }
  else if (v.systolic_bp >= 120) { htScore += 10; htFactors.push('Elevated BP'); }
  if (symptoms.includes('headache')) { htScore += 10; htFactors.push('Headaches'); }
  if (symptoms.includes('dizziness')) { htScore += 10; htFactors.push('Dizziness'); }
  if (htScore > 0) diseases.push({ name: 'Hypertension', emoji: '🩺', score: Math.min(htScore, 100), level: htScore >= 50 ? 'HIGH' : htScore >= 25 ? 'MODERATE' : 'LOW', factors: htFactors });

  // ── Respiratory ──
  let respScore = 0;
  const respFactors = [];
  if (v.spo2 && v.spo2 < 90) { respScore += 40; respFactors.push(`Critical SpO2 (${v.spo2}%)`); }
  else if (v.spo2 && v.spo2 < 94) { respScore += 20; respFactors.push(`Low SpO2 (${v.spo2}%)`); }
  if (v.respiratory_rate > 25) { respScore += 25; respFactors.push('High respiratory rate'); }
  if (symptoms.includes('shortness_of_breath')) { respScore += 20; respFactors.push('Shortness of breath'); }
  if (symptoms.includes('persistent_cough')) { respScore += 15; respFactors.push('Persistent cough'); }
  if (v.temperature > 101) { respScore += 10; respFactors.push('Fever'); }
  if (respScore > 0) diseases.push({ name: 'Respiratory Disease', emoji: '🫁', score: Math.min(respScore, 100), level: respScore >= 50 ? 'HIGH' : respScore >= 25 ? 'MODERATE' : 'LOW', factors: respFactors });

  // ── Stroke ──
  let strokeScore = 0;
  const strokeFactors = [];
  if (v.systolic_bp >= 180) { strokeScore += 30; strokeFactors.push('Severe hypertension'); }
  else if (v.systolic_bp >= 140) { strokeScore += 15; strokeFactors.push('High blood pressure'); }
  if (symptoms.includes('sudden_numbness')) { strokeScore += 35; strokeFactors.push('Sudden numbness/tingling'); }
  if (symptoms.includes('confusion')) { strokeScore += 25; strokeFactors.push('Confusion'); }
  if (symptoms.includes('vision_problems')) { strokeScore += 20; strokeFactors.push('Vision problems'); }
  if (vitals.age > 65) { strokeScore += 10; strokeFactors.push('Age > 65'); }
  if (strokeScore > 0) diseases.push({ name: 'Stroke Risk', emoji: '🧠', score: Math.min(strokeScore, 100), level: strokeScore >= 50 ? 'HIGH' : strokeScore >= 25 ? 'MODERATE' : 'LOW', factors: strokeFactors });

  // ── Anemia ──
  let anemiaScore = 0;
  const anemiaFactors = [];
  if (symptoms.includes('fatigue')) { anemiaScore += 20; anemiaFactors.push('Fatigue'); }
  if (symptoms.includes('dizziness')) { anemiaScore += 15; anemiaFactors.push('Dizziness'); }
  if (symptoms.includes('pale_skin')) { anemiaScore += 20; anemiaFactors.push('Pale skin'); }
  if (symptoms.includes('cold_hands_feet')) { anemiaScore += 10; anemiaFactors.push('Cold extremities'); }
  if (v.heart_rate > 100) { anemiaScore += 10; anemiaFactors.push('Elevated heart rate'); }
  if (symptoms.includes('shortness_of_breath')) { anemiaScore += 10; anemiaFactors.push('Shortness of breath'); }
  if (anemiaScore > 0) diseases.push({ name: 'Anemia', emoji: '🔴', score: Math.min(anemiaScore, 100), level: anemiaScore >= 40 ? 'MODERATE' : 'LOW', factors: anemiaFactors });

  // ── Infection / Fever ──
  let feverScore = 0;
  const feverFactors = [];
  if (v.temperature > 103) { feverScore += 40; feverFactors.push(`High fever (${v.temperature}°F)`); }
  else if (v.temperature > 100.4) { feverScore += 25; feverFactors.push(`Fever (${v.temperature}°F)`); }
  else if (v.temperature > 99.5) { feverScore += 10; feverFactors.push('Low-grade fever'); }
  if (symptoms.includes('body_ache')) { feverScore += 10; feverFactors.push('Body ache'); }
  if (symptoms.includes('sore_throat')) { feverScore += 10; feverFactors.push('Sore throat'); }
  if (symptoms.includes('persistent_cough')) { feverScore += 10; feverFactors.push('Cough'); }
  if (symptoms.includes('nausea')) { feverScore += 10; feverFactors.push('Nausea/vomiting'); }
  if (feverScore > 0) diseases.push({ name: 'Infection / Fever', emoji: '🤒', score: Math.min(feverScore, 100), level: feverScore >= 50 ? 'HIGH' : feverScore >= 25 ? 'MODERATE' : 'LOW', factors: feverFactors });

  return diseases.sort((a, b) => b.score - a.score);
}

// ── Format prediction result as readable message ──
function formatPredictionResponse(diseases, vitals, symptomLabels) {
  let msg = '🔬 **BioTwin AI — Health Risk Analysis**\n\n';

  // Show parsed data
  const dataPoints = [];
  if (vitals.heartRate) dataPoints.push(`Heart Rate: **${vitals.heartRate} bpm**`);
  if (vitals.systolicBP) dataPoints.push(`Blood Pressure: **${vitals.systolicBP}/${vitals.diastolicBP || '?'} mmHg**`);
  if (vitals.spo2) dataPoints.push(`SpO2: **${vitals.spo2}%**`);
  if (vitals.temperature) dataPoints.push(`Temperature: **${vitals.temperature}°F**`);
  if (vitals.bloodGlucose) dataPoints.push(`Blood Glucose: **${vitals.bloodGlucose} mg/dL**`);
  if (vitals.cholesterol) dataPoints.push(`Cholesterol: **${vitals.cholesterol} mg/dL**`);
  if (vitals.age) dataPoints.push(`Age: **${vitals.age}**`);
  if (vitals.respiratoryRate) dataPoints.push(`Respiratory Rate: **${vitals.respiratoryRate}/min**`);

  if (dataPoints.length > 0) {
    msg += '📋 **Detected Health Data:**\n';
    dataPoints.forEach((p) => { msg += `• ${p}\n`; });
    msg += '\n';
  }

  if (symptomLabels && symptomLabels.length > 0) {
    msg += '🩹 **Symptoms Detected:** ' + symptomLabels.map((s) => `_${s}_`).join(', ') + '\n\n';
  }

  if (diseases.length === 0) {
    msg += '✅ **No significant disease risk detected** from the data you provided.\n\nYour values appear to be within normal ranges. Keep maintaining a healthy lifestyle!\n\n💡 For a more thorough analysis with 6-disease detection, visit the **Health Diagnosis** page.';
    return msg;
  }

  msg += '📊 **Risk Assessment Results:**\n\n';
  diseases.forEach((d) => {
    const badge = d.level === 'HIGH' ? '🔴' : d.level === 'MODERATE' ? '🟡' : '🟢';
    msg += `${d.emoji} **${d.name}** — ${badge} ${d.level} Risk (${d.score}%)\n`;
    msg += `   ↳ ${d.factors.join(' • ')}\n\n`;
  });

  // Recommendations
  const topDisease = diseases[0];
  msg += '---\n\n';
  if (topDisease.score >= 50) {
    msg += '🚨 **Action Required:** Your risk indicators are concerning. Please **consult a doctor** as soon as possible.\n';
  } else if (topDisease.score >= 25) {
    msg += '⚠️ **Recommendation:** Monitor your health closely and consider scheduling a **medical checkup**.\n';
  } else {
    msg += '💚 **Recommendation:** Your overall risk is low. Keep up the healthy lifestyle and monitor regularly.\n';
  }

  msg += '\n🏥 For a **comprehensive diagnosis** with alerts, health score, and AI lab analysis, visit the **Health Diagnosis** page!';
  return msg;
}

// ── Intent Detection ──
function detectIntent(message) {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|hola|greetings|good\s*(morning|afternoon|evening)|sup|yo)\b/.test(msg)) {
    return { intent: 'greeting' };
  }

  // Farewell
  if (/^(bye|goodbye|see you|take care|thanks|thank you|thnx|thx)\b/.test(msg)) {
    return { intent: 'farewell' };
  }

  // What can you do / help
  if (/what.*(can you|do you|features|capabilities)|help me|how.*work|what.*biotwin/i.test(msg)) {
    return { intent: 'capabilities' };
  }

  // Predict / diagnose / analyze
  if (/predict|diagnos|analyze|assess|check\s*(my|me|health|risk|disease)|what.*disease.*i\s*(have|got)|do\s*i\s*have|am\s*i\s*(sick|ill|healthy|at\s*risk)|my\s*(health|risk|condition|status)|scan\s*my|evaluate|test\s*my\s*health/i.test(msg)) {
    return { intent: 'predict' };
  }

  // User providing symptoms (e.g., "I have chest pain and headache")
  if (/^(i\s*(have|feel|am\s*having|am\s*feeling|got|experience|suffer|notice)|my\s*symptoms?|symptoms?\s*(?:are|:)|feeling)\b/i.test(msg)) {
    return { intent: 'symptoms_report' };
  }

  // Vitals provided (e.g., "my heart rate is 90 bp 140/90")
  if (/(?:heart\s*rate|hr|pulse|bp|blood\s*pressure|spo2|oxygen|temp|temperature|sugar|glucose|cholesterol)\s*(?:is|=|:|was)/i.test(msg)) {
    return { intent: 'vitals_report' };
  }

  // Health tips
  if (/health\s*tip|tip|advice|suggestion|recommend|healthy|wellness/i.test(msg)) {
    return { intent: 'health_tip' };
  }

  // Feature questions
  if (/lab\s*(test|risk|predict|model|blood|report)/i.test(msg)) return { intent: 'feature', feature: 'lab' };
  if (/wearable|smartwatch|heart\s*rate\s*monitor|spo2\s*monitor|fitbit|apple\s*watch/i.test(msg)) return { intent: 'feature', feature: 'wearable' };
  if (/x-?ray|xray|chest\s*scan|radiol/i.test(msg)) return { intent: 'feature', feature: 'xray' };
  if (/diagnos.*page|health\s*diagnosis|full\s*diagnosis/i.test(msg)) return { intent: 'feature', feature: 'diagnosis' };

  // Disease questions
  for (const key of Object.keys(DISEASES)) {
    const variations = [key];
    if (key === 'heart disease') variations.push('heart attack', 'cardiac', 'coronary', 'cardiovascular');
    if (key === 'pneumonia') variations.push('lung infection');
    if (key === 'covid-19') variations.push('covid', 'coronavirus', 'corona');
    if (key === 'tuberculosis') variations.push('tb');
    if (key === 'diabetes') variations.push('blood sugar', 'insulin', 'diabetic');
    if (key === 'hypertension') variations.push('high blood pressure');
    if (key === 'stroke') variations.push('brain attack');

    for (const v of variations) {
      if (msg.includes(v)) {
        let subIntent = 'overview';
        if (/symptom|sign|feel|how.*know/i.test(msg)) subIntent = 'symptoms';
        if (/cause|why|reason|how.*get/i.test(msg)) subIntent = 'causes';
        if (/prevent|avoid|reduce|protect|stop/i.test(msg)) subIntent = 'prevention';
        if (/risk|factor|chance|who.*get|likely/i.test(msg)) subIntent = 'riskFactors';
        if (/stat|number|data|how\s*many|death|mortality/i.test(msg)) subIntent = 'stats';
        return { intent: 'disease', disease: key, subIntent };
      }
    }
  }

  // List diseases
  if (/disease|illness|condition|what.*detect/i.test(msg)) {
    return { intent: 'list_diseases' };
  }

  // Emergency
  if (/emergency|call\s*911|i'm\s*dying|dying|heart\s*attack\s*now/i.test(msg)) {
    return { intent: 'emergency' };
  }

  // Fallback: check if message contains symptoms or vitals
  const vitals = extractVitals(msg);
  const symptoms = extractSymptoms(msg);
  if (vitals || symptoms) {
    return { intent: 'predict' };
  }

  return { intent: 'unknown' };
}

// ── Response Generator ──
function generateResponse(intent, message) {
  switch (intent.intent) {
    case 'greeting': {
      const greetings = [
        "Hello! 👋 I'm BioTwin's AI Health Assistant. I can **predict diseases** from your health data, answer questions about diseases, or give health tips!\n\n💬 Try telling me your symptoms & vitals like:\n\"I have chest pain, BP 140/90, heart rate 95\"",
        "Hey there! 🧬 Welcome to BioTwin AI!\n\n🔬 **Predict diseases** — tell me your symptoms or vitals\n📚 **Disease info** — ask about any disease\n💡 **Health tips** — get wellness advice\n\nWhat would you like to do?",
        "Hi! 👨‍⚕️ I'm your BioTwin health companion.\n\nI can analyze your health data and predict disease risks! Just tell me your symptoms, vitals, or ask me anything health-related.",
      ];
      return { reply: greetings[Math.floor(Math.random() * greetings.length)], suggestions: ['Predict my disease risk', 'What diseases can you detect?', 'Health tip', 'Tell me about heart disease'] };
    }

    case 'farewell':
      return { reply: "Take care! 💙 Remember, your health is your greatest wealth. Come back anytime you have health questions!", suggestions: ['Predict my disease risk', 'Tell me about heart disease', 'Health tips'] };

    case 'capabilities':
      return {
        reply: "🧬 **BioTwin AI Health Assistant**\n\nHere's everything I can do:\n\n🔬 **Predict Diseases** — Tell me your symptoms and vitals and I'll assess risk for **7 diseases** (Heart Disease, Diabetes, Hypertension, Respiratory Disease, Stroke, Anemia, Infections)\n\n🧪 **Lab Risk Analysis** — Our Gradient Boosting AI analyzes 13 lab values for heart disease (91% accuracy)\n\n⌚ **Wearable Monitoring** — 24-hour health risk tracking with Bidirectional LSTM\n\n🫁 **X-ray Detection** — Upload chest X-rays to detect Pneumonia, COVID-19, TB\n\n🏥 **Health Diagnosis** — Full interactive checkup with alerts and health score\n\n📚 **Disease Info** — Symptoms, causes, prevention for any disease\n\n💬 **Try it now:** \"I have chest pain and headache, BP 150/95, heart rate 100, age 55\"",
        suggestions: ['Predict my disease risk', 'What is heart disease?', 'How does the lab model work?', 'Health tips'],
      };

    case 'health_tip': {
      const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
      return { reply: `Here's a health tip for you:\n\n${tip}`, suggestions: ['Another tip!', 'Predict my disease risk', 'Tell me about diabetes'] };
    }

    case 'feature': {
      const f = FEATURES[intent.feature];
      if (!f) return { reply: "I don't have info on that feature yet.", suggestions: [] };
      let msg = `${f.emoji} **${f.name}**\n\n${f.description}`;
      if (f.howToUse) msg += `\n\n**How to use:** ${f.howToUse}`;
      if (f.accuracy) msg += `\n\n**Accuracy:** ${f.accuracy}`;
      if (f.explanation) msg += `\n\n**Explainability:** ${f.explanation}`;
      return { reply: msg, suggestions: ['Predict my disease risk', 'What diseases can you detect?', 'Health tip'] };
    }

    case 'predict':
    case 'symptoms_report':
    case 'vitals_report': {
      const vitals = extractVitals(message) || {};
      const symptomData = extractSymptoms(message);
      const symptomCodes = symptomData ? symptomData.codes : [];
      const symptomLabels = symptomData ? symptomData.labels : [];

      const hasData = Object.keys(vitals).length > 0 || symptomCodes.length > 0;

      if (!hasData) {
        return {
          reply: "🔬 **I'd love to analyze your health!**\n\nPlease share any of the following:\n\n**Symptoms you can mention:**\n• chest pain, headache, fatigue, shortness of breath, dizziness, fever, cough, nausea, blurred vision, numbness, palpitations, frequent urination, excessive thirst, etc.\n\n**Vitals you can share:**\n• Heart rate (e.g., \"heart rate 90\")\n• Blood pressure (e.g., \"BP 140/90\")\n• SpO2 (e.g., \"oxygen 96\")\n• Temperature (e.g., \"temp 101.5\")\n• Blood glucose (e.g., \"sugar 130\")\n• Cholesterol (e.g., \"cholesterol 250\")\n• Age (e.g., \"age 55\" or \"I'm 55\")\n\n💬 **Example:** \"I'm 55, have chest pain and fatigue, BP 150/95, heart rate 100, cholesterol 260\"",
          suggestions: ['I have chest pain and headache, age 50', 'BP 140/90 heart rate 95 age 60', 'I feel dizzy and tired', 'fever and cough, temp 101'],
        };
      }

      // Run the prediction
      const diseases = runQuickDiagnosis(vitals, symptomCodes);
      const reply = formatPredictionResponse(diseases, vitals, symptomLabels);

      const suggestions = [];
      if (diseases.length > 0) {
        suggestions.push(`How to prevent ${diseases[0].name}?`);
        suggestions.push(`Tell me about ${diseases[0].name}`);
      }
      suggestions.push('Check with different symptoms');
      suggestions.push('Open Health Diagnosis page');
      return { reply, suggestions: suggestions.slice(0, 4) };
    }

    case 'disease': {
      const d = DISEASES[intent.disease];
      if (!d) return { reply: "I don't have information on that disease.", suggestions: [] };

      let msg = `${d.emoji} **${d.name}**\n\n`;

      switch (intent.subIntent) {
        case 'symptoms':
          msg += `**Common Symptoms:**\n${d.symptoms.map((s) => `• ${s}`).join('\n')}`;
          break;
        case 'causes':
          msg += `**Causes:**\n${d.causes.map((s) => `• ${s}`).join('\n')}`;
          break;
        case 'prevention':
          msg += `**Prevention:**\n${d.prevention.map((s) => `• ${s}`).join('\n')}`;
          break;
        case 'riskFactors':
          msg += `**Risk Factors:**\n${d.riskFactors.map((s) => `• ${s}`).join('\n')}`;
          break;
        case 'stats':
          msg += `**Statistics:** ${d.stats}`;
          break;
        default:
          msg += `${d.description}\n\n**Key Symptoms:** ${d.symptoms.slice(0, 4).join(', ')}\n\n**Prevention:** ${d.prevention.slice(0, 3).join(', ')}\n\n📊 ${d.stats}\n\n🤖 **BioTwin AI:** ${d.relatedModel}`;
      }

      return { reply: msg, suggestions: [`Symptoms of ${d.name}`, `How to prevent ${d.name}`, `Risk factors for ${d.name}`, 'Predict my disease risk'] };
    }

    case 'list_diseases': {
      const list = Object.values(DISEASES).map((d) => `${d.emoji} **${d.name}**`).join('\n');
      return {
        reply: `BioTwin AI can help you with these diseases:\n\n${list}\n\n🔬 I can also **predict your risk** — just tell me your symptoms and vitals!\n\n💬 Try: \"I have chest pain and shortness of breath, BP 150/95\"`,
        suggestions: ['Heart disease', 'Diabetes', 'Predict my disease risk', 'Health tips'],
      };
    }

    case 'emergency':
      return {
        reply: "🚨 **EMERGENCY — If you're experiencing a medical emergency, call your local emergency number immediately!**\n\n🇺🇸 USA: **911**\n🇮🇳 India: **112** or **108**\n🇬🇧 UK: **999**\n🇪🇺 EU: **112**\n\n⚠️ BioTwin AI is an informational tool and **NOT** a substitute for professional medical care.\n\nWhile waiting for help:\n• Stay calm and sit down\n• Loosen tight clothing\n• If possible, chew an aspirin (for suspected heart attack)\n• Note the time symptoms started",
        suggestions: ['Heart attack symptoms', 'Signs of stroke', 'Tell me about heart disease'],
      };

    default:
      return {
        reply: "I'm not sure I understand that. Here's what I can do:\n\n🔬 **Predict diseases** — Tell me your symptoms & vitals\n📚 **Disease info** — Ask about heart disease, diabetes, pneumonia, etc.\n🤖 **AI models** — Learn how our predictions work\n💡 **Health tips** — Get wellness advice\n\n💬 **Try:** \"I have chest pain, BP 140/90, heart rate 95, age 50\"",
        suggestions: ['Predict my disease risk', 'What diseases can you detect?', 'How does BioTwin work?', 'Health tip'],
      };
  }
}

// ── POST /api/chatbot ──
router.post('/', (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const userMessage = message.trim();
    const intent = detectIntent(userMessage);
    const response = generateResponse(intent, userMessage);

    res.json({
      success: true,
      data: {
        reply: response.reply,
        suggestions: response.suggestions || [],
        intent: intent.intent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, error: 'Chatbot failed to respond.' });
  }
});

// ── GET /api/chatbot/diseases ──
router.get('/diseases', (_req, res) => {
  const list = Object.entries(DISEASES).map(([key, d]) => ({
    id: key,
    name: d.name,
    emoji: d.emoji,
    description: d.description,
    symptoms: d.symptoms,
    prevention: d.prevention,
  }));
  res.json({ success: true, data: list });
});

// ── GET /api/chatbot/tips ──
router.get('/tips', (_req, res) => {
  const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
  res.json({ success: true, data: { tip } });
});

module.exports = router;
