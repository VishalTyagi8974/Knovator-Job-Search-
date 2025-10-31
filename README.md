# 🚀 Scalable Job Importer System (MERN + Redis + BullMQ)

## 📘 Overview
This project is a **scalable job import system** built with the **MERN stack**, **Redis**, and **BullMQ**.  
It automatically fetches job listings from multiple XML-based APIs, converts them to JSON, queues them using **Redis**, processes them in the background with worker processes, stores them in **MongoDB**, and logs every import.  
An **Admin UI (Next.js)** is provided to view Import History with total, new, updated, and failed job counts.

---

## 🧩 Key Features
- 🛰️ Fetches jobs from multiple XML APIs (e.g., Jobicy, HigherEdJobs)
- 🔄 Converts XML → JSON and normalizes data
- 📦 Queues jobs using **Redis + BullMQ**
- ⚙️ Processes jobs asynchronously using worker threads
- 🧠 Stores and updates jobs in **MongoDB**
- 🧾 Tracks each import (total, new, updated, failed)
- ⏰ Runs automatically every hour using **node-cron**
- 🖥️ Admin UI (Next.js) displays Import History

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 14 |
| **Backend** | Node.js + Express |
| **Database** | MongoDB (Mongoose) |
| **Queue** | BullMQ |
| **Queue Store** | Redis |
| **Scheduler** | node-cron |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📂 Folder Structure

/client → Next.js frontend (Admin UI)
/server
├── /config → Database 
├── /models → Mongoose schemas (Job, ImportLog)
├── /utils → Feed fetching, XML→JSON, normalization, queuing & Cron-configuration
├── /jobs → Worker  & Redis configuration
├── /routes → Express routes (import, jobs, logs)
├── app.js → Main Express entry point

/docs
└── architecture.md → System design documentation
README.md → Setup, usage, testing guide


## Create a .env file inside the /server folder:
MONGO_URI=mongodb://localhost:27017/job_importer_db
PORT=5050
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QUEUE_NAME=job-import-queue


## Install Dependencies
Backend
cd server
npm install

Frontend
cd ../client
npm install

## Running the Project
Step 1: Start Redis
redis-server

Step 2: Run Backend (API + Cron)
cd server
nodemon app.js / npm run dev 

👷 Step 3: Run Worker (Background Processor)

Open another terminal:
node jobs/worker.js / npm run worker 

💻 Step 4: Run Frontend (Next.js UI)
cd ../client
npm run dev


Now open:
➡️ http://localhost:3000
 for frontend
➡️ http://localhost:5050 
 for backend

## How It Works
Cron Job (node-cron) runs every hour/ every minute for testing.
Fetches XML feeds from job APIs.
Converts XML → JSON and normalizes the structure.
Queues each job into Redis using BullMQ.
Worker consumes the queue:
Inserts or updates jobs in MongoDB.
Logs successes and failures.
Import logs are saved and displayed in the Admin UI.



## API Endpoints
Method	Route	Description
GET	/api/import-logs	View import history logs



## Testing (Optional)
You can later add test cases using Jest or Vitest.

npm run test

## Deployment
Service	Platform
Frontend Vercel
Backend	Vercel/Render
MongoDB/MongoDB Atlas
Redis/Redis Cloud
🧭 Example Import Log (MongoDB)
{
  "source": "https://jobicy.com/?feed=job_feed",
  "totalFetched": 120,
  "new": 80,
  "updated": 35,
  "failed": 5,
  "failedJobs": [
    { "jobId": "123", "reason": "Duplicate key error" },
    { "jobId": null, "reason": "Missing title field" }
  ],
  "timestamp": "2025-10-30T15:00:00Z"
}

🔄 Automation with Cron
The cron job runs every hour: "0 * * * *"
You can test it by changing it temporarily to "* * * * *" (every minute)
When it triggers:
Calls fetchAndEnqueueAllFeeds()
Queues jobs into Redis
Worker processes jobs in background

## Summary
✅ Automated, scalable background processing system
✅ Real-world async pipeline using Redis + BullMQ
✅ Modular backend + clean frontend dashboard
✅ Logs every import for transparency and debugging

## Author
Vishal Tyagi
Full Stack Developer (MERN)
🌐 LinkedIn https://www.linkedin.com/in/vishal-tyagi-b62ba3230/
💻 GitHub   https://github.com/VishalTyagi8974


