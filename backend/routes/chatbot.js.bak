const express = require('express');
const router = express.Router();

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
    description: 'Pneumonia is an infection that inflames the air sacs in one or both lungs. The air sacs may fill with fluid or pus, causing cough with phlegm, fever, chills, and difficulty breathing.',
    symptoms: ['Cough with phlegm or pus', 'Fever, sweating, and chills', 'Shortness of breath', 'Chest pain when breathing or coughing', 'Fatigue', 'Nausea, vomiting, or diarrhea', 'Confusion (in older adults)'],
    causes: ['Bacteria (Streptococcus pneumoniae)', 'Viruses (flu, COVID-19, RSV)', 'Fungi', 'Aspiration of food/liquid into lungs'],
    prevention: ['Get vaccinated (pneumococcal vaccine)', 'Practice good hygiene', 'Don\'t smoke', 'Keep immune system strong', 'Get flu vaccine annually'],
    riskFactors: ['Age (children <2, adults >65)', 'Chronic lung disease', 'Weakened immune system', 'Smoking', 'Hospitalization (ventilator use)'],
    stats: 'Pneumonia kills ~2.5 million people annually, including 672,000 children under 5 (WHO).',
    relatedModel: 'X-ray Classification — our CNN can detect pneumonia from chest X-rays with GradCAM visualization.',
  },
  'covid-19': {
    name: 'COVID-19',
    emoji: '🦠',
    description: 'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. It ranges from mild symptoms to severe pneumonia and can affect multiple organ systems.',
    symptoms: ['Fever or chills', 'Cough', 'Loss of taste or smell', 'Shortness of breath', 'Fatigue', 'Body aches', 'Sore throat', 'Headache', 'Congestion'],
    causes: ['SARS-CoV-2 virus', 'Spread through respiratory droplets', 'Airborne transmission in enclosed spaces', 'Contact with contaminated surfaces'],
    prevention: ['Get vaccinated and boosted', 'Wear masks in crowded indoor spaces', 'Wash hands frequently', 'Maintain social distance', 'Improve ventilation indoors', 'Stay home when sick'],
    riskFactors: ['Age (older adults)', 'Obesity', 'Diabetes', 'Heart or lung disease', 'Weakened immune system', 'Smoking'],
    stats: 'COVID-19 has caused over 7 million confirmed deaths worldwide since 2020 (WHO).',
    relatedModel: 'X-ray Classification — our CNN detects COVID-19 patterns (ground-glass opacities) in chest X-rays.',
  },
  tuberculosis: {
    name: 'Tuberculosis (TB)',
    emoji: '🔬',
    description: 'Tuberculosis is a bacterial infection caused by Mycobacterium tuberculosis that primarily affects the lungs. It spreads through the air when an infected person coughs or sneezes.',
    symptoms: ['Persistent cough (3+ weeks)', 'Coughing up blood', 'Chest pain', 'Unintentional weight loss', 'Fatigue', 'Night sweats', 'Fever', 'Loss of appetite'],
    causes: ['Mycobacterium tuberculosis bacteria', 'Airborne transmission from infected person', 'Latent TB can become active when immune system weakens'],
    prevention: ['BCG vaccination', 'Good ventilation', 'Cover mouth when coughing', 'Complete full course of TB treatment', 'Regular screening for high-risk groups'],
    riskFactors: ['HIV/AIDS', 'Weakened immune system', 'Close contact with TB patients', 'Living in crowded conditions', 'Malnutrition', 'Substance abuse', 'Healthcare workers'],
    stats: 'TB kills ~1.3 million people annually, making it the 2nd deadliest infectious disease after COVID-19 (WHO).',
    relatedModel: 'X-ray Classification — our CNN identifies TB patterns (upper lobe cavities, calcified nodules) in chest X-rays.',
  },
  diabetes: {
    name: 'Diabetes',
    emoji: '🩸',
    description: 'Diabetes is a chronic condition where the body cannot properly process blood glucose (sugar). Type 1 is autoimmune; Type 2 is linked to lifestyle and genetics.',
    symptoms: ['Frequent urination', 'Excessive thirst', 'Unexplained weight loss', 'Blurred vision', 'Slow-healing sores', 'Frequent infections', 'Tingling in hands/feet', 'Fatigue'],
    causes: ['Type 1: Autoimmune destruction of insulin-producing cells', 'Type 2: Insulin resistance + inadequate insulin production', 'Gestational: Hormonal changes during pregnancy'],
    prevention: ['Maintain healthy weight', 'Exercise regularly', 'Eat balanced diet (limit sugar and refined carbs)', 'Monitor blood sugar levels', 'Regular health screenings'],
    riskFactors: ['Family history', 'Obesity', 'Sedentary lifestyle', 'Age >45', 'High blood pressure', 'Polycystic ovary syndrome'],
    stats: '~537 million adults worldwide have diabetes, projected to reach 783 million by 2045 (IDF).',
    relatedModel: 'Our Lab Risk Model includes fasting blood sugar as a key feature — diabetes significantly increases heart disease risk.',
  },
  hypertension: {
    name: 'Hypertension (High Blood Pressure)',
    emoji: '🩺',
    description: 'Hypertension is persistently elevated blood pressure (≥130/80 mmHg). It\'s called the "silent killer" because it often has no symptoms but damages blood vessels and organs over time.',
    symptoms: ['Usually no symptoms (silent)', 'Severe cases: headaches', 'Shortness of breath', 'Nosebleeds', 'Dizziness', 'Chest pain', 'Visual changes'],
    causes: ['Primary: No identifiable cause (genetic + lifestyle)', 'Secondary: Kidney disease, thyroid problems, medications', 'High sodium diet', 'Chronic stress'],
    prevention: ['Reduce sodium intake (<2,300mg/day)', 'Exercise regularly', 'Maintain healthy weight', 'Limit alcohol', 'Manage stress', 'DASH diet (fruits, vegetables, whole grains)'],
    riskFactors: ['Age', 'Family history', 'Obesity', 'High sodium diet', 'Lack of exercise', 'Excessive alcohol', 'Stress', 'Smoking'],
    stats: '~1.28 billion adults worldwide have hypertension, but nearly half don\'t know it (WHO).',
    relatedModel: 'Our Lab Risk Model uses resting blood pressure (trestbps) as a key predictor of heart disease.',
  },
  stroke: {
    name: 'Stroke',
    emoji: '🧠',
    description: 'A stroke occurs when blood supply to part of the brain is interrupted or reduced, depriving brain tissue of oxygen and nutrients. Time is critical — "Time is Brain."',
    symptoms: ['Sudden numbness (face, arm, leg — especially one side)', 'Confusion, trouble speaking', 'Vision problems', 'Difficulty walking, dizziness', 'Severe headache with no known cause', 'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency'],
    causes: ['Ischemic stroke (blood clot blocks artery — 87%)', 'Hemorrhagic stroke (blood vessel bursts)', 'Transient ischemic attack (mini-stroke)'],
    prevention: ['Control blood pressure', 'Exercise regularly', 'Healthy diet', 'Manage diabetes', 'Quit smoking', 'Limit alcohol', 'Treat atrial fibrillation'],
    riskFactors: ['High blood pressure (#1 risk)', 'Heart disease', 'Diabetes', 'Smoking', 'Obesity', 'High cholesterol', 'Age', 'Family history'],
    stats: 'Stroke is the 2nd leading cause of death worldwide, killing ~6.5 million people annually (WHO).',
    relatedModel: 'Our platform monitors multiple stroke risk factors through lab tests and wearable heart rate monitoring.',
  },
};

// ── BioTwin Feature Info ──
const FEATURES = {
  lab: {
    name: 'Lab Risk Prediction',
    emoji: '🧪',
    description: 'Analyzes 13 clinical lab values (age, cholesterol, blood pressure, etc.) using a Gradient Boosting AI model trained on real heart disease data.',
    howToUse: 'Go to Predictions → Lab Risk, enter your values or click "Load Sample Data", then submit.',
    accuracy: '91% AUC-ROC on UCI Heart Disease dataset',
    explanation: 'Uses SHAP (SHapley Additive exPlanations) to show which lab values contributed most to your risk score.',
  },
  wearable: {
    name: 'Wearable Health Monitor',
    emoji: '⌚',
    description: 'Processes 24-hour smartwatch data (heart rate, SpO2, steps) using a Bidirectional LSTM neural network to predict health risk trends over time.',
    howToUse: 'Go to Predictions → Wearable, enter your 24-hour readings or click "Load Sample Data", then submit.',
    accuracy: '100% classification AUC on validation data',
    explanation: 'Shows an hourly risk trend so you can see when your risk was highest during the day.',
  },
  xray: {
    name: 'X-ray Classification',
    emoji: '🫁',
    description: 'Classifies chest X-rays into Normal, Pneumonia, COVID-19, or Tuberculosis using EfficientNetB0 deep learning with transfer learning from ImageNet.',
    howToUse: 'Go to Predictions → X-ray, upload a chest X-ray image, then submit.',
    accuracy: '100% test accuracy across 4 classes',
    explanation: 'Generates a GradCAM heatmap overlay showing exactly which regions of the X-ray the AI focused on.',
  },
  gradcam: {
    name: 'GradCAM Visualization',
    emoji: '🔥',
    description: 'Gradient-weighted Class Activation Mapping — highlights the important regions in an X-ray that influenced the AI\'s decision. Red/yellow areas = high importance.',
    howToUse: 'Automatically generated when you submit an X-ray for classification.',
  },
  shap: {
    name: 'SHAP Explanations',
    emoji: '📊',
    description: 'SHAP values explain how each feature (e.g., cholesterol, blood pressure) pushed the prediction higher or lower. Red bars increase risk, blue bars decrease risk.',
    howToUse: 'Automatically shown in Lab Risk prediction results.',
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
  '📱 Use BioTwin\'s wearable monitoring to track your heart rate trends!',
  '🩻 Regular health checkups can catch diseases early when they\'re most treatable.',
  '🏋️ Strength training 2x per week helps maintain muscle mass and bone density.',
  '🫁 Practice deep breathing exercises: inhale 4 sec, hold 7 sec, exhale 8 sec.',
  '❤️ Laugh more! Laughter reduces stress hormones and boosts immune function.',
];

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

  // Health tips
  if (/health\s*tip|tip|advice|suggestion|recommend|healthy|wellness/i.test(msg)) {
    return { intent: 'health_tip' };
  }

  // Feature questions
  if (/lab\s*(test|risk|predict|model|blood)/i.test(msg)) return { intent: 'feature', feature: 'lab' };
  if (/wearable|smartwatch|heart\s*rate|spo2|fitbit|apple\s*watch|steps/i.test(msg)) return { intent: 'feature', feature: 'wearable' };
  if (/x-?ray|xray|chest|scan|radiol/i.test(msg)) return { intent: 'feature', feature: 'xray' };
  if (/gradcam|grad-cam|heatmap|attention\s*map|activation/i.test(msg)) return { intent: 'feature', feature: 'gradcam' };
  if (/shap|explain|feature\s*importance|interpretab/i.test(msg)) return { intent: 'feature', feature: 'shap' };

  // Disease questions
  for (const key of Object.keys(DISEASES)) {
    const variations = [key];
    if (key === 'heart disease') variations.push('heart attack', 'cardiac', 'coronary', 'cardiovascular', 'cad');
    if (key === 'pneumonia') variations.push('lung infection');
    if (key === 'covid-19') variations.push('covid', 'coronavirus', 'sars', 'corona');
    if (key === 'tuberculosis') variations.push('tb', 'tuberculosis');
    if (key === 'diabetes') variations.push('blood sugar', 'insulin', 'diabetic', 'type 1', 'type 2');
    if (key === 'hypertension') variations.push('high blood pressure', 'bp', 'blood pressure');
    if (key === 'stroke') variations.push('brain attack', 'cerebrovascular');

    for (const v of variations) {
      if (msg.includes(v)) {
        // Detect sub-intent
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
  if (/disease|illness|condition|what.*detect|what.*diagnos/i.test(msg)) {
    return { intent: 'list_diseases' };
  }

  // Emergency
  if (/emergency|chest\s*pain|can't\s*breathe|heart\s*attack|call\s*911|dying/i.test(msg)) {
    return { intent: 'emergency' };
  }

  return { intent: 'unknown' };
}

// ── Response Generator ──
function generateResponse(intent, context = {}) {
  switch (intent.intent) {
    case 'greeting': {
      const greetings = [
        "Hello! 👋 I'm BioTwin's AI Health Assistant. I can help you learn about diseases, explain our AI models, or give health tips. What would you like to know?",
        "Hey there! 🧬 Welcome to BioTwin AI. Ask me about any disease, our prediction models, or health tips!",
        "Hi! 👨‍⚕️ I'm your BioTwin health companion. I know about heart disease, pneumonia, COVID-19, TB, diabetes, and more. How can I help?",
      ];
      return { message: greetings[Math.floor(Math.random() * greetings.length)], suggestions: ['What diseases can you detect?', 'How does the lab model work?', 'Give me a health tip'] };
    }

    case 'farewell':
      return { message: "Take care! 💙 Remember, your health is your greatest wealth. Come back anytime you have health questions!", suggestions: ['Tell me about heart disease', 'Health tips', 'How does BioTwin work?'] };

    case 'capabilities':
      return {
        message: `🧬 **BioTwin AI** is a multi-modal early disease detection platform. Here's what I can do:\n\n🧪 **Lab Risk Prediction** — Analyze blood test results to assess heart disease risk (91% AUC-ROC)\n\n⌚ **Wearable Monitoring** — Process 24-hour smartwatch data to track health risk trends\n\n🫁 **X-ray Classification** — Detect Normal, Pneumonia, COVID-19, or TB from chest X-rays\n\n📊 **Explainable AI** — SHAP values for lab results, GradCAM heatmaps for X-rays\n\n💬 **Health Chat** — Ask me about any disease, symptoms, prevention, or health tips!\n\nWhat would you like to explore?`,
        suggestions: ['Tell me about heart disease', 'How does X-ray detection work?', 'What are the symptoms of COVID-19?'],
      };

    case 'health_tip': {
      const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
      return { message: `Here's a health tip for you:\n\n${tip}`, suggestions: ['Another tip!', 'How to prevent heart disease?', 'Tell me about diabetes'] };
    }

    case 'feature': {
      const f = FEATURES[intent.feature];
      if (!f) return { message: "I don't have info on that feature yet." };
      let msg = `${f.emoji} **${f.name}**\n\n${f.description}`;
      if (f.howToUse) msg += `\n\n**How to use:** ${f.howToUse}`;
      if (f.accuracy) msg += `\n\n**Accuracy:** ${f.accuracy}`;
      if (f.explanation) msg += `\n\n**Explainability:** ${f.explanation}`;
      return { message: msg, suggestions: ['Tell me about another model', 'What diseases can you detect?', 'Give me a health tip'] };
    }

    case 'disease': {
      const d = DISEASES[intent.disease];
      if (!d) return { message: "I don't have information on that disease." };

      let msg = `${d.emoji} **${d.name}**\n\n`;

      switch (intent.subIntent) {
        case 'symptoms':
          msg += `**Common Symptoms:**\n${d.symptoms.map(s => `• ${s}`).join('\n')}`;
          break;
        case 'causes':
          msg += `**Causes:**\n${d.causes.map(s => `• ${s}`).join('\n')}`;
          break;
        case 'prevention':
          msg += `**Prevention:**\n${d.prevention.map(s => `• ${s}`).join('\n')}`;
          break;
        case 'riskFactors':
          msg += `**Risk Factors:**\n${d.riskFactors.map(s => `• ${s}`).join('\n')}`;
          break;
        case 'stats':
          msg += `**Statistics:** ${d.stats}`;
          break;
        default:
          msg += `${d.description}\n\n**Key Symptoms:** ${d.symptoms.slice(0, 4).join(', ')}\n\n**Prevention:** ${d.prevention.slice(0, 3).join(', ')}\n\n📊 ${d.stats}\n\n🤖 **BioTwin AI:** ${d.relatedModel}`;
      }

      const suggestions = [`Symptoms of ${d.name}`, `How to prevent ${d.name}`, `Risk factors for ${d.name}`];
      return { message: msg, suggestions };
    }

    case 'list_diseases': {
      const list = Object.values(DISEASES).map(d => `${d.emoji} **${d.name}**`).join('\n');
      return {
        message: `BioTwin AI can help you learn about these diseases:\n\n${list}\n\nOur AI models can detect **heart disease** from lab tests and **pneumonia, COVID-19, and tuberculosis** from chest X-rays.\n\nWhich disease would you like to know more about?`,
        suggestions: ['Heart disease', 'COVID-19', 'Pneumonia'],
      };
    }

    case 'emergency':
      return {
        message: `🚨 **EMERGENCY — If you're experiencing a medical emergency, call your local emergency number immediately!**\n\n🇺🇸 USA: **911**\n🇮🇳 India: **112** or **108**\n🇬🇧 UK: **999**\n🇪🇺 EU: **112**\n\n⚠️ BioTwin AI is an informational tool and **NOT** a substitute for professional medical care. If you or someone near you is in danger, seek help right away.\n\nWhile waiting for help:\n• Stay calm and sit down\n• Loosen tight clothing\n• If possible, chew an aspirin (for suspected heart attack)\n• Note the time symptoms started`,
        suggestions: ['What are heart attack symptoms?', 'Signs of stroke (FAST)', 'Tell me about heart disease'],
      };

    default:
      return {
        message: "I'm not sure I understand that. I can help you with:\n\n🔬 **Disease info** — Ask about heart disease, pneumonia, COVID-19, TB, diabetes, hypertension, or stroke\n\n🤖 **AI models** — Learn how our lab, wearable, and X-ray predictions work\n\n💡 **Health tips** — Get personalized wellness advice\n\nTry asking something like \"What are the symptoms of heart disease?\" or \"How does the X-ray model work?\"",
        suggestions: ['What diseases can you detect?', 'How does BioTwin work?', 'Give me a health tip'],
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
    const response = generateResponse(intent);

    res.json({
      success: true,
      data: {
        reply: response.message,
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
    causes: d.causes,
    prevention: d.prevention,
    riskFactors: d.riskFactors,
    stats: d.stats,
  }));
  res.json({ success: true, data: list });
});

// ── GET /api/chatbot/tips ──
router.get('/tips', (_req, res) => {
  const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
  res.json({ success: true, data: { tip } });
});

module.exports = router;
