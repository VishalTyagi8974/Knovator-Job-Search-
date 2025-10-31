const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');

dotenv.config();

// ✅ Secure Redis connection (Upstash-compatible)
const connection = new IORedis({
  host: process.env.REDIS_HOST,         // e.g. actual-turkey-16095.upstash.io
  port: process.env.REDIS_PORT || 6379, // Upstash still uses 6379
  password: process.env.REDIS_PASSWORD, // your Upstash token
  tls: {},                              // 👈 required for Upstash (SSL)
  maxRetriesPerRequest: null,
  db: 0,
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

let sessionSummary = {};

const QUEUE_NAME = process.env.QUEUE_NAME || 'job-import-queue';

console.log("🚀 Worker started");
console.log("QUEUE_NAME:", QUEUE_NAME);
console.log("REDIS HOST:", process.env.REDIS_HOST);
console.log("REDIS PORT:", process.env.REDIS_PORT);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const data = job.data;
    const query = data.jobId
      ? { jobId: data.jobId, source: data.source }
      : { title: data.title, source: data.source };

    try {
      const existing = await Job.findOne(query);

      if (existing) {
        await Job.updateOne(
          { _id: existing._id },
          { ...data, updatedAt: new Date() }
        );
        sessionSummary.updatedJobs = (sessionSummary.updatedJobs || 0) + 1;
      } else {
        await Job.create({ ...data, updatedAt: new Date() });
        sessionSummary.newJobs = (sessionSummary.newJobs || 0) + 1;
      }
      sessionSummary.totalFetched = (sessionSummary.totalFetched || 0) + 1;
    } catch (err) {
      sessionSummary.failedJobs = (sessionSummary.failedJobs || 0) + 1;
      sessionSummary.failureReasons = sessionSummary.failureReasons || [];
      sessionSummary.failureReasons.push(err.message);
      console.error('❌ Error processing job:', err.message);
    }

    sessionSummary.fileName = data.source;
    sessionSummary.timestamp = new Date();

    // Update or insert log for this source
    await ImportLog.findOneAndUpdate(
      {
        fileName: data.source,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      {
        fileName: data.source,
        timestamp: sessionSummary.timestamp,
        totalFetched: sessionSummary.totalFetched,
        newJobs: sessionSummary.newJobs,
        updatedJobs: sessionSummary.updatedJobs,
        failedJobs: sessionSummary.failedJobs,
        failureReasons: sessionSummary.failureReasons,
      },
      { upsert: true }
    );
  },
  { connection }
);

worker.on('completed', (job) => console.log(`✅ Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));

console.log('👷 Worker is running and listening for jobs...');
