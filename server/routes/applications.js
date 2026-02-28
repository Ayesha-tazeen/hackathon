const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Application = require('../models/Application');

// @route GET /api/applications
router.get('/', protect, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = { userId: req.user._id };
        if (status) filter.status = status;

        const applications = await Application.find(filter)
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Application.countDocuments(filter);

        // Get stats
        const stats = await Application.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusMap = {};
        stats.forEach(s => { statusMap[s._id] = s.count; });

        res.json({
            success: true,
            applications,
            total,
            stats: statusMap,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/applications/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        res.json({ success: true, application: app });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/applications
router.post('/', protect, async (req, res) => {
    try {
        const { job, notes, contactName, contactEmail } = req.body;
        if (!job || !job.title || !job.company) {
            return res.status(400).json({ success: false, message: 'Job title and company are required' });
        }

        const application = await Application.create({
            userId: req.user._id,
            job,
            notes,
            contactName,
            contactEmail,
            timeline: [{ status: 'applied', date: new Date(), note: 'Application submitted' }]
        });

        res.status(201).json({ success: true, application });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/applications/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, userId: req.user._id });
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const { status, notes, contactName, contactEmail, nextStep } = req.body;

        if (status && status !== application.status) {
            application.timeline.push({ status, date: new Date(), note: req.body.timelineNote || '' });
        }

        if (status) application.status = status;
        if (notes !== undefined) application.notes = notes;
        if (contactName !== undefined) application.contactName = contactName;
        if (contactEmail !== undefined) application.contactEmail = contactEmail;
        if (nextStep !== undefined) application.nextStep = nextStep;

        await application.save();
        res.json({ success: true, application });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route DELETE /api/applications/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        res.json({ success: true, message: 'Application removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
