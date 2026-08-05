import { Schema, model } from 'mongoose';
const RecruiterSchema = new Schema({
    companyName: { type: String, required: true, trim: true },
    screenedCandidates: [{
            studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            atsScore: { type: Number, default: 0 },
            interviewScore: { type: Number, default: 0 },
            rankingScore: { type: Number, default: 0 },
            aiRecommendation: { type: String }
        }]
}, {
    timestamps: true
});
export default model('Recruiter', RecruiterSchema);
