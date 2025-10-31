const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const ImportLog = require('./models/ImportLog');
const Job = require('./models/Job');
const importLogsRouter = require('./routes/importLogs');
const startCronJobs  = require('./utils/scheduler');
dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/import-logs', importLogsRouter);

app.get('/', (req, res) => {
  res.send('API is running');
});


const PORT = process.env.PORT || 5050;

startCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});