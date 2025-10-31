const axios = require('axios');
const xml2js = require('xml2js');
const feedList = require('./feedList');
const jobQueue = require('../jobs/queue');


async function fetchAndEnqueueAllFeeds() {
  for (const url of feedList) {
    try{
        const res = await axios.get(url);
        const json = await xml2js.parseStringPromise(res.data, { explicitArray: false, mergeAttrs: true });
        const jobs = (json.rss && json.rss.channel && json.rss.channel.item) ? json.rss.channel.item : [];
        const jobsArray = Array.isArray(jobs) ? jobs : [jobs];
        for (const job of jobsArray) {
        const jobUrl = job.url || job.link || job.guid || "";
        await jobQueue.add('import-job', { ...job, url: jobUrl, source: url });
      }
 
    } catch (e) {
    }
  }
}

// To run directly:
if (require.main === module) {
  fetchAndEnqueueAllFeeds().then(() => process.exit(0));
}

module.exports = fetchAndEnqueueAllFeeds;