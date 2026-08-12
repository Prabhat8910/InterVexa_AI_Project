import { Schema, model } from 'mongoose';
const StudentProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
    department: { type: String, default: '' },
    resumeUrl: { type: String },
    resumeRawText: { type: String },
    atsScore: { type: Number, default: 0 },
    skills: [{ type: String }],
    experience: [{
            company: { type: String },
            role: { type: String },
            duration: { type: String },
            description: { type: String }
        }],
    education: [{
            institution: { type: String },
            degree: { type: String },
            year: { type: String },
            grade: { type: String }
        }],
    projects: [{
            title: { type: String },
            description: { type: String },
            technologies: [{ type: String }]
        }],
    targetRole: { type: String },
    targetCompany: { type: String },
    placementReadinessScore: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }]
}, {
    timestamps: true
});
export default model('StudentProfile', StudentProfileSchema);
