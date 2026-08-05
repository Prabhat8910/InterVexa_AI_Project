import { Schema, model } from 'mongoose';
const ReportSchema = new Schema({
    interviewId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    overallScore: { type: Number, required: true },
    technicalScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    grammarScore: { type: Number, required: true },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    expectedAnswersComparison: [{
            question: { type: String, required: true },
            givenAnswer: { type: String },
            expectedBetterAnswer: { type: String, required: true },
            evaluationFeedback: { type: String, required: true }
        }],
    voiceAnalysisSummary: {
        overallFluency: { type: String },
        avgSpeechRate: { type: Number },
        totalFillersDetected: { type: Number },
        voiceToneRating: { type: String }
    },
    emotionTimeline: [{
            timestamp: { type: String },
            stress: { type: Number },
            calmness: { type: Number },
            confidence: { type: Number }
        }],
    recommendedResources: [{
            title: { type: String },
            type: { type: String },
            url: { type: String }
        }],
    pdfReportUrl: { type: String }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
export default model('Report', ReportSchema);
