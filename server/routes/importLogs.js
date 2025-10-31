const express = require('express');
const ImportLog = require('../models/ImportLog');
const router = express.Router();

// GET /api/import-logs?page={n}
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const total = await ImportLog.countDocuments();
    const logs = await ImportLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    // Deduplicate failure reasons per log entry for cleaner UI consumption
    const sanitizedLogs = logs.map((log) => {
      const obj = log.toObject();
      const reasonsArray = Array.isArray(obj.failureReasons) ? obj.failureReasons : [];
      const uniqueReasons = [...new Set(reasonsArray.map(r => (r || '').trim()))].filter(Boolean);
      return { ...obj, failureReasons: uniqueReasons };
    });

    res.json({
      logs: sanitizedLogs,
      pagination: {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch import logs.' });
  }
});

module.exports = router;
