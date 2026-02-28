const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
    institution: String,
    degree: String,
    field: String,
    startYear: String,
    endYear: String,
    gpa: String,
    description: String
});

const ExperienceSchema = new mongoose.Schema({
    company: String,
    title: String,
    location: String,
    startDate: String,
    endDate: String,
    current: { type: Boolean, default: false },
    description: String
});

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personal: {
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        summary: { type: String, default: '' }
    },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    skills: [{ type: String }],
    certifications: [{
        name: String,
        issuer: String,
        year: String,
        url: String
    }],
    languages: [{ type: String }],
    resumeText: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    preferences: {
        desiredRoles: [{ type: String }],
        desiredLocations: [{ type: String }],
        minSalary: { type: Number, default: 0 },
        maxSalary: { type: Number, default: 0 },
        remote: { type: Boolean, default: false },
        fullTime: { type: Boolean, default: true },
        partTime: { type: Boolean, default: false },
        contract: { type: Boolean, default: false }
    },
    completeness: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

ProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    // Calculate completeness %
    let score = 0;
    if (this.personal.firstName) score += 10;
    if (this.personal.lastName) score += 10;
    if (this.personal.phone) score += 5;
    if (this.personal.summary) score += 10;
    if (this.education.length > 0) score += 15;
    if (this.experience.length > 0) score += 20;
    if (this.skills.length > 0) score += 15;
    if (this.resumeText) score += 15;
    this.completeness = Math.min(score, 100);
    next();
});

module.exports = mongoose.model('Profile', ProfileSchema);
