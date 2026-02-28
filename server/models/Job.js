const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    externalId: { type: String, default: '' },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    description: { type: String, default: '' },
    descriptionHtml: { type: String, default: '' },
    applyUrl: { type: String, default: '' },
    salary: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
        default: 'full-time'
    },
    tags: [{ type: String }],
    source: { type: String, default: 'adzuna' },
    postedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

JobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', JobSchema);
