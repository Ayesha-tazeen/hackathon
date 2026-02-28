const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const jobAggregator = require('../services/jobAggregator');

// @route GET /api/jobs
router.get('/', protect, async (req, res) => {
    try {
        const { q = 'software engineer', location = '', page = 1, limit = 20, type } = req.query;
        const results = await jobAggregator.search({ q, location, page: Number(page), limit: Number(limit), type });
        res.json({ success: true, ...results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/jobs/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const job = await jobAggregator.getById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.json({ success: true, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
