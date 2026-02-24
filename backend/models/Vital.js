const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    heartRate: { type: Number, min: 20, max: 300 },
    systolicBP: { type: Number, min: 50, max: 300 },
    diastolicBP: { type: Number, min: 30, max: 200 },
    spo2: { type: Number, min: 50, max: 100 },
    temperature: { type: Number, min: 85, max: 115 },       // °F
    respiratoryRate: { type: Number, min: 4, max: 60 },
    steps: { type: Number, min: 0 },
    calories: { type: Number, min: 0 },
    bloodGlucose: { type: Number, min: 20, max: 600 },      // mg/dL
    stressLevel: { type: Number, min: 0, max: 100 },        // 0-100
    sleepMinutes: { type: Number, min: 0 },
    source: {
      type: String,
      enum: ['watch', 'phone', 'manual', 'simulator'],
      default: 'watch',
    },
    deviceInfo: {
      type: String,  // e.g. "Galaxy Watch 5", "Apple Watch Ultra"
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for live feed + history
vitalSchema.index({ userId: 1, createdAt: -1 });
vitalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);
