import { Schema, model, Document } from 'mongoose';

export interface IExpectedAnswerComparison {
  question: string;
  givenAnswer: string;
  expectedBetterAnswer: string;
  evaluationFeedback: string;
}

export interface IEmotionTimelinePoint {
  timestamp: string;
  stress: number;
  calmness: number;
  confidence: number;
}

export interface IRecommendedResource {
  title: string;
  type: string;
  url: string;
}

export interface IReport extends Document {
  interviewId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammarScore: number;
  strengths: string[];
  weaknesses: string[];
  expectedAnswersComparison: IExpectedAnswerComparison[];
  voiceAnalysisSummary: {
    overallFluency: string;
    avgSpeechRate: number;
    totalFillersDetected: number;
    voiceToneRating: string;
  };
  emotionTimeline: IEmotionTimelinePoint[];
  recommendedResources: IRecommendedResource[];
  pdfReportUrl?: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
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

export default model<IReport>('Report', ReportSchema);
