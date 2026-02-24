const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['lab', 'wearable', 'xray'],
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed, // flexible for different model inputs
      required: true,
    },
    prediction: {
      riskScore: { type: Number, min: 0, max: 1 },
      riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
      confidence: { type: Number, min: 0, max: 1 },
      classification: String, // for X-ray: "Normal", "Pneumonia", etc.
    },
    explanation: {
      type: mongoose.Schema.Types.Mixed, // SHAP values, GradCAM URL, etc.
    },
    imageUrl: String, // S3 URL for X-ray or GradCAM heatmap
  },
  {
    timestamps: true,
  }
);

// Compound index for dashboard queries
predictionSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
