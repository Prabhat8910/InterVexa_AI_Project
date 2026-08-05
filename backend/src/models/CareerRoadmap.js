import { Schema, model } from 'mongoose';
const CareerRoadmapSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    targetRole: { type: String, required: true },
    roadmapSteps: [{
            phase: { type: String, required: true },
            duration: { type: String, required: true },
            objective: { type: String, required: true },
            recommendedSkills: [{ type: String }],
            courses: [{
                    title: { type: String },
                    provider: { type: String },
                    link: { type: String }
                }],
            suggestedProjects: [{
                    title: { type: String },
                    spec: { type: String }
                }],
            certifications: [{ type: String }]
        }],
    placementPrepPlan: {
        timeline: { type: String },
        mockSchedule: { type: String },
        focusAreas: [{ type: String }]
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
export default model('CareerRoadmap', CareerRoadmapSchema);
