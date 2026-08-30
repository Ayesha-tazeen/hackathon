const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');
const Application = require('../models/Application');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockAIResponse = (type, input) => {
    if (type === 'detect-role') {
        const keywords = ['developer', 'engineer', 'designer', 'manager', 'analyst', 'scientist', 'architect'];
        const found = keywords.find(k => input.toLowerCase().includes(k)) || 'Software Engineer';
        return { role: found.charAt(0).toUpperCase() + found.slice(1), confidence: 0.85 };
    }
    if (type === 'form-fill') return { mock: true, message: 'OpenAI key required for real form-fill AI' };
};

function buildMockCoverLetter(profile, job) {
    const firstName = profile?.personal?.firstName || 'Applicant';
    const lastName = profile?.personal?.lastName || '';
    const skills = (profile?.skills || []).slice(0, 5).join(', ') || 'various technologies';
    const experience = profile?.experience?.[0];
    const expText = experience
        ? `As a ${experience.title} at ${experience.company}, I gained deep expertise in building production-ready solutions.`
        : 'I have strong hands-on experience building production-ready applications.';

    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${skills}, I am confident I would be a valuable addition to your team.

${expText}

I am particularly excited about this opportunity because ${job.company}'s mission aligns with my passion for building impactful technology. I am eager to bring my skills in ${skills} to help your team achieve its goals.

I would welcome the opportunity to discuss how my experience can contribute to ${job.company}'s success.

Best regards,
${firstName} ${lastName}`.trim();
}

// ─── POST /api/ai/detect-role ────────────────────────────────────────────────
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

// ─── POST /api/ai/form-fill ──────────────────────────────────────────────────
router.post('/form-fill', protect, async (req, res) => {
    try {
        const { profile, fields } = req.body;
        if (!profile || !fields) {
            return res.status(400).json({ success: false, message: 'Profile and fields are required' });
        }

        if (!openai) {
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
                    content: 'You are an expert job application form filler. Given a user profile and a list of form field labels, return JSON mapping each field label to the appropriate value from the profile. Be concise. Do not fabricate information not in the profile.'
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

// ─── POST /api/ai/generate-cover-letter ─────────────────────────────────────
router.post('/generate-cover-letter', protect, async (req, res) => {
    try {
        const { profile, job } = req.body;
        if (!profile || !job) {
            return res.status(400).json({ success: false, message: 'Profile and job are required' });
        }

        if (!openai) {
            return res.json({
                success: true,
                coverLetter: buildMockCoverLetter(profile, job),
                mock: true
            });
        }

        const profileSummary = JSON.stringify({
            name: `${profile.personal?.firstName || ''} ${profile.personal?.lastName || ''}`.trim(),
            summary: profile.personal?.summary || '',
            skills: profile.skills || [],
            experience: (profile.experience || []).slice(0, 3).map(e => ({
                title: e.title, company: e.company, description: e.description
            })),
            education: (profile.education || []).slice(0, 2).map(e => ({
                institution: e.institution, degree: e.degree, field: e.field
            }))
        });

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert career coach who writes compelling, personalized cover letters. 
Write a professional cover letter (3-4 paragraphs, ~250 words) that:
- Opens with enthusiasm for the specific role and company
- Highlights the most relevant experience and skills from the profile
- Connects the candidate's background to the job requirements
- Closes with a call to action
Return JSON: { "coverLetter": "full cover letter text" }`
                },
                {
                    role: 'user',
                    content: `Write a cover letter for this candidate applying to this job.\n\nCandidate Profile:\n${profileSummary}\n\nJob:\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nDescription: ${(job.description || '').slice(0, 1000)}`
                }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);
        res.json({ success: true, coverLetter: result.coverLetter });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/ai/auto-apply ─────────────────────────────────────────────────
// Full AI pipeline: generate cover letter + save application in one call
router.post('/auto-apply', protect, async (req, res) => {
    try {
        const { profile, job } = req.body;
        if (!profile || !job || !job.title || !job.company) {
            return res.status(400).json({ success: false, message: 'Profile and job (with title & company) are required' });
        }

        // Step 1: Generate cover letter
        let coverLetter = '';
        let mock = false;

        if (!openai) {
            coverLetter = buildMockCoverLetter(profile, job);
            mock = true;
        } else {
            const profileSummary = JSON.stringify({
                name: `${profile.personal?.firstName || ''} ${profile.personal?.lastName || ''}`.trim(),
                summary: profile.personal?.summary || '',
                skills: profile.skills || [],
                experience: (profile.experience || []).slice(0, 3).map(e => ({
                    title: e.title, company: e.company, description: e.description
                })),
                education: (profile.education || []).slice(0, 2).map(e => ({
                    institution: e.institution, degree: e.degree, field: e.field
                }))
            });

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert career coach who writes compelling, personalized cover letters.
Write a professional cover letter (3-4 paragraphs, ~250 words) that:
- Opens with enthusiasm for the specific role and company
- Highlights the most relevant experience and skills from the profile
- Connects the candidate's background to the job requirements
- Closes with a call to action
Return JSON: { "coverLetter": "full cover letter text" }`
                    },
                    {
                        role: 'user',
                        content: `Write a cover letter for this candidate applying to this job.\n\nCandidate Profile:\n${profileSummary}\n\nJob:\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location || ''}\nDescription: ${(job.description || '').slice(0, 1000)}`
                    }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(response.choices[0].message.content);
            coverLetter = result.coverLetter || buildMockCoverLetter(profile, job);
        }

        // Step 2: Save application to DB
        const application = await Application.create({
            userId: req.user._id,
            job: {
                title: job.title,
                company: job.company,
                location: job.location || '',
                applyUrl: job.applyUrl || '',
                source: job.source || '',
                salary: job.salary?.min ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}` : ''
            },
            coverLetter,
            aiGenerated: true,
            timeline: [{ status: 'applied', date: new Date(), note: 'AI Auto-Applied via AutoApply' }]
        });

        res.status(201).json({
            success: true,
            application,
            coverLetter,
            mock
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
