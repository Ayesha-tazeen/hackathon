const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const Profile = require('../models/Profile');
const resumeParser = require('../services/resumeParser');

// Multer setup - store in memory for AI parsing
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and DOCX files are allowed'));
    }
});

// @route GET /api/profile
router.get('/', protect, async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) {
            profile = await Profile.create({ userId: req.user._id });
        }
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/profile
router.put('/', protect, async (req, res) => {
    try {
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { ...req.body, userId: req.user._id },
            { new: true, upsert: true, runValidators: false }
        );
        await profile.save();
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/profile/parse-resume
router.post('/parse-resume', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const parsed = await resumeParser.parse(req.file);

        res.json({
            success: true,
            data: parsed,
            filename: req.file.originalname
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
