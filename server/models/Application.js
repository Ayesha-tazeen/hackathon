const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, default: '' },
        applyUrl: { type: String, default: '' },
        source: { type: String, default: '' },
        salary: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['applied', 'pending', 'interview', 'offer', 'rejected', 'withdrawn'],
        default: 'applied'
    },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    nextStep: { type: String, default: '' },
    timeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String
    }]
});

ApplicationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Application', ApplicationSchema);
