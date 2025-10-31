const cron = require("node-cron");
const fetchAndEnqueueAllFeeds = require("../utils/fetchJobFeeds.js");

module.exports = function startCronJobs() {
  console.log("[CRON] Scheduler initialized — will run every 13 minutes.");

  cron.schedule(
    "*/13 * * * *",
    async () => {
      console.log("[CRON] Running job import...");
      try {
        await fetchAndEnqueueAllFeeds(); // pushes jobs to Redis queue
        console.log("[CRON] ✅ Jobs successfully queued for processing.");
      } catch (err) {
        console.error("[CRON] ❌ Import failed:", err.message);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};
