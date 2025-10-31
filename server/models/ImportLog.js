const mongoose = require('mongoose');

const ImportLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  totalFetched: Number,
  newJobs: Number,
  updatedJobs: Number,
  failedJobs: Number,
  failureReasons: [String],
});

module.exports = mongoose.model('ImportLog', ImportLogSchema);
