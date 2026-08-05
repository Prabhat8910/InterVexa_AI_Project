import { Schema, model } from 'mongoose';
const LiveInterviewSessionSchema = new Schema({
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    roomId: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['created', 'active', 'completed', 'failed'],
        default: 'created'
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
    transcripts: [{
            sender: { type: String, enum: ['interviewer', 'candidate'], required: true },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }],
    reportId: { type: Schema.Types.ObjectId, ref: 'Report' },
    completedAt: { type: Date }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
export default model('LiveInterviewSession', LiveInterviewSessionSchema);
