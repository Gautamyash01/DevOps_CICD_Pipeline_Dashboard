const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  buildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Build',
    required: true
  },
  environment: {
    type: String,
    enum: ['dev', 'staging', 'production'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  deployedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deployment', deploymentSchema);
