import { Schema, model } from 'mongoose';
const InterviewSessionSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'failed'],
        default: 'scheduled'
    },
    questions: [{
            questionText: { type: String, required: true },
            answerTranscript: { type: String },
            audioDuration: { type: Number },
            scores: {
                technical: { type: Number, default: 0 },
                communication: { type: Number, default: 0 },
                confidence: { type: Number, default: 0 }
            },
            emotionalFeedback: {
                confidence: { type: Number, default: 0 },
                stress: { type: Number, default: 0 },
                calmness: { type: Number, default: 0 },
                excitement: { type: Number, default: 0 },
                nervousness: { type: Number, default: 0 }
            },
            voiceMetrics: {
                speedWordsPerMin: { type: Number, default: 0 },
                pausesCount: { type: Number, default: 0 },
                fillersCount: { type: Number, default: 0 },
                stabilityScore: { type: Number, default: 0 }
            }
        }],
    reportId: { type: Schema.Types.ObjectId, ref: 'Report' }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
export default model('InterviewSession', InterviewSessionSchema);
