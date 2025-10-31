const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  jobId: { type: String },               // external job ID, if available
  title: { type: String, required: true },
  company: { type: String },
  location: { type: String },
  url: { type: String, required: true },
  description: { type: String },
  source: { type: String },              // Which feed/url
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);
