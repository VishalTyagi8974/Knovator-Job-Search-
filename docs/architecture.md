# 🏗️ System Architecture – Scalable Job Importer

---

## 🎯 Overview
The **Job Importer System** is a scalable, modular, and fault-tolerant background processing application.  
It fetches job listings from external **XML-based APIs**, converts them into JSON, queues them using **Redis + BullMQ**, processes them with **worker processes**, and stores them in **MongoDB**.  
A **Next.js Admin Dashboard** displays Import History and performance insights.

This architecture supports horizontal scalability, async processing, and clear separation of concerns between fetchers, processors, and UI.

---

## 🧩 High-Level Architecture Diagram

         +---------------------------+
         |       node-cron (1h)      |
         |  Scheduler (auto trigger) |
         +-------------+-------------+
                       |
                       v
            +---------------------+
            |  Fetch Service      |  (Express API)
            |  - Fetch XML feeds  |
            |  - Convert to JSON  |
            |  - Normalize fields |
            +----------+----------+
                       |
                       v
            +---------------------+
            |   Redis Queue       |
            |  (BullMQ + Redis)   |
            +----------+----------+
                       |
                       v
            +---------------------+
            |   Worker Service    |
            |  - Insert/Update DB |
            |  - Handle failures  |
            |  - Update logs      |
            +----------+----------+
                       |
                       v
            +---------------------+
            |   MongoDB Database  |
            |  - Jobs collection  |
            |  - Import logs      |
            +----------+----------+
                       |
                       v
            +---------------------+
            | Next.js Admin Panel |
            |  - View Logs        |
            |  - Manual Import    |
            +---------------------+


---

## ⚙️ Core Components

### 1️⃣ **Fetch Service**
**Location:** `/server/utils/fetchJobFeeds.js`  
**Role:** Fetches XML feeds, converts them to JSON, and normalizes job data.

- Uses `axios` to fetch XML feeds.
- Converts XML → JSON using `xml2js`.
- Normalizes data into a consistent schema.
- Adds each job to the **Redis queue** using BullMQ.

**Example normalized job:**
```js
{
  jobId: "abc123",
  title: "Frontend Developer",
  company: "Jobicy",
  location: "Remote",
  url: "https://jobicy.com/jobs/frontend-dev",
  description: "We’re hiring frontend engineers...",
  source: "https://jobicy.com/?feed=job_feed",
  updatedAt: "2025-10-30T17:45:00Z"
}

## Queue System (Redis + BullMQ)

Path: /server/jobs/queue.js, /server/utils/fetchJobFeeds.js
Redis acts as an in-memory message broker.
BullMQ manages job queues and background processing.
Each fetched job is added to the queue for async processing.
Built-in retries and concurrency handling ensure reliability.

Advantages:
Decouples data ingestion from database writes
Allows parallel job processing
Prevents server blocking


## Worker Service
Path: /server/jobs/worker.js

The worker:
Consumes jobs from the Redis queue
Checks if the job already exists in MongoDB
Inserts new jobs or updates existing ones
Tracks stats (newJobs, updatedJobs, failedJobs)
Logs results to the ImportLog collection

Pseudo-code Flow:

const existing = await Job.findOne({ url: job.url });
if (existing) {
  await Job.updateOne({ url: job.url }, job);
  updatedJobs++;
} else {
  await Job.create(job);
  newJobs++;
}


## MongoDB Models
Job Model
Path: /server/models/Job.js

const mongoose = require('mongoose');
const JobSchema = new mongoose.Schema({
  jobId: { type: String },
  title: { type: String, required: true },
  company: { type: String },
  location: { type: String },
  url: { type: String, required: true },
  description: { type: String },
  source: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);

🧠 Purpose:
Stores normalized job data.
Uses url as a unique identifier to prevent duplicates.
updatedAt auto-refreshes with each import.

🗂️ ImportLog Model
Path: /server/models/ImportLog.js
const mongoose = require('mongoose');
const ImportLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  totalFetched: Number,
  newJobs: Number,
  updatedJobs: Number,
  failedJobs: Number,
  failureReasons: [String]
});

module.exports = mongoose.model('ImportLog', ImportLogSchema);


🧠 Purpose:
Logs every import process.
Tracks job stats (inserted, updated, failed).
Stores failure messages for debugging.
Serves as the data source for the admin UI table.

##Cron Scheduler

Path: /server/utils/scheduler.js
Uses node-cron to automate hourly imports.
Calls the fetch service every hour:
cron.schedule("0 * * * *", async () => {
  await runImportForAllFeeds();
});
Can be adjusted to "* * * * *" (for every minute) during testing.
Keeps the system fully automated.


## Admin UI (Next.js)
Path: /client
Displays Import History using /api/import-logs endpoint.
Each record shows:
Feed URL (fileName)
Total jobs fetched
New, updated, failed counts, failure reasons.
Timestamp

## Data Flow Summary
Step	Component	Description
1️⃣	node-cron	Triggers import every hour
2️⃣	Fetch Service	Fetches and queues job data
3️⃣	Redis Queue	Stores async job tasks
4️⃣	Worker	Processes queue, updates DB
5️⃣	MongoDB	Persists jobs and import logs
6️⃣	Next.js UI	Displays import results
🧠 Design Decisions
Decision	Reason
Redis + BullMQ	Enables concurrent, retryable background jobs
MongoDB	Schema flexibility for multiple APIs
node-cron	Simplifies scheduling without external services
Separate Worker Process	Keeps main API responsive
ImportLog Tracking	Allows performance analytics & debugging
📊 Example Log Document
{
  "fileName": "https://jobicy.com/?feed=job_feed",
  "timestamp": "2025-10-30T17:45:00Z",
  "totalFetched": 120,
  "newJobs": 85,
  "updatedJobs": 30,
  "failedJobs": 5,
  "failureReasons": [
    "Duplicate key error",
    "Missing title field"
  ]
}


## Scalability & Reliability
Horizontal Scaling: Multiple workers can consume the same queue.
Fault Tolerance: BullMQ retries failed jobs automatically.
Separation of Concerns: Scheduler, Worker, and UI are isolated.
Resilient Imports: Partial failures don’t stop the entire pipeline.
Monitoring: Import logs provide visibility into every cron cycle.

##Future Enhancements

Add failureDetails array ({ jobId, reason }) for better traceability.
Integrate Docker Compose to run Redis + Mongo + Node easily.
Add WebSocket updates in the UI for live import progress.
Implement pagination & filters in the Import Logs table.
Add auth layer (JWT/NextAuth) for secured dashboard access.

## Summary
Component	Role
Fetch Service	Gets data and pushes to queue
Redis Queue (BullMQ)	Manages background job tasks
Worker Service	Inserts/updates jobs & logs results
MongoDB	Stores jobs and import logs
Cron Scheduler	Automates periodic imports
Next.js Admin UI	Displays logs & analytics

This architecture ensures:
⚡ Scalable async job processing
🧠 Transparent import tracking
🧩 Modular, maintainable design
💪 Ready for production deployment