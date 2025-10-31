const { Queue } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis({
  host: process.env.REDIS_HOST,      // e.g. actual-turkey-16095.upstash.io
  port: process.env.REDIS_PORT,      // 6379
  password: process.env.REDIS_PASSWORD, // your Upstash token
  tls: {},                           // 👈 required for Upstash (uses HTTPS/TLS)
  maxRetriesPerRequest: null,        // 👈 required for BullMQ stability
  db: 0,
});

const jobQueue = new Queue(process.env.QUEUE_NAME || "job-import-queue", { connection });

console.log("✅ BullMQ Queue initialized");

module.exports = jobQueue;
