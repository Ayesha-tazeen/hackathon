const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Helper: mock AI response when no API key set
const mockAIResponse = (type, input) => {
    if (type === 'detect-role') {
        const keywords = ['developer', 'engineer', 'designer', 'manager', 'analyst', 'scientist', 'architect'];
        const found = keywords.find(k => input.toLowerCase().includes(k)) || 'Software Engineer';
        return { role: found.charAt(0).toUpperCase() + found.slice(1), confidence: 0.85 };
    }
    if (type === 'form-fill') return { mock: true, message: 'OpenAI key required for real form-fill AI' };
};

// @route POST /api/ai/detect-role
router.post('/detect-role', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

        if (!openai) {
            return res.json({ success: true, ...mockAIResponse('detect-role', text), mock: true });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a job role detector. Extract the most specific job title/role from the given text. Return JSON: { "role": "string", "confidence": 0.0-1.0, "alternatives": [] }'
                },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/ai/form-fill
router.post('/form-fill', protect, async (req, res) => {
    try {
        const { profile, fields } = req.body;
        if (!profile || !fields) {
            return res.status(400).json({ success: false, message: 'Profile and fields are required' });
        }

        if (!openai) {
            // Return best-effort mapping without AI
            const filled = {};
            fields.forEach(f => {
                const label = f.toLowerCase();
                if (label.includes('name')) filled[f] = `${profile.personal?.firstName} ${profile.personal?.lastName}`.trim();
                else if (label.includes('email')) filled[f] = profile.email || '';
                else if (label.includes('phone')) filled[f] = profile.personal?.phone || '';
                else if (label.includes('linkedin')) filled[f] = profile.personal?.linkedin || '';
                else if (label.includes('github')) filled[f] = profile.personal?.github || '';
                else if (label.includes('summary') || label.includes('cover')) filled[f] = profile.personal?.summary || '';
                else filled[f] = '';
            });
            return res.json({ success: true, filled, mock: true });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert job application form filler. Given a user profile and a list of form field labels, return JSON mapping each field label to the appropriate value from the profile. Be concise. Don't fabricate information not in the profile.`
                },
                {
                    role: 'user',
                    content: `Profile: ${JSON.stringify(profile)}\n\nForm fields to fill: ${JSON.stringify(fields)}\n\nReturn JSON: { "filled": { "fieldLabel": "value", ... } }`
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
