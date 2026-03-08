const mongoose = require('mongoose');

const buildSchema = new mongoose.Schema({
  pipelineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pipeline',
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'running'],
    required: true
  },
  triggeredBy: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Build', buildSchema);
