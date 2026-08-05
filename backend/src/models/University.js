import { Schema, model } from 'mongoose';
const UniversitySchema = new Schema({
    name: { type: String, required: true, trim: true },
    domainCode: { type: String, required: true, unique: true, index: true },
    analytics: {
        totalStudents: { type: Number, default: 0 },
        averageInterviewScore: { type: Number, default: 0 },
        averageAtsScore: { type: Number, default: 0 },
        placementRate: { type: Number, default: 0 }
    },
    departments: [{
            name: { type: String, required: true },
            averageScore: { type: Number, default: 0 },
            studentCount: { type: Number, default: 0 }
        }]
}, {
    timestamps: true
});
export default model('University', UniversitySchema);
