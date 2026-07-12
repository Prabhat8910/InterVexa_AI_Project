import { Schema, model, Document } from 'mongoose';

export interface IQuestionResponse {
  questionText: string;
  answerTranscript?: string;
  audioDuration?: number;
  scores?: {
    technical: number;
    communication: number;
    confidence: number;
  };
  emotionalFeedback?: {
    confidence: number;
    stress: number;
    calmness: number;
    excitement: number;
    nervousness: number;
  };
  voiceMetrics?: {
    speedWordsPerMin: number;
    pausesCount: number;
    fillersCount: number;
    stabilityScore: number;
  };
}

export interface IInterviewSession extends Document {
  studentId: Schema.Types.ObjectId;
  roomId: string;
  status: 'scheduled' | 'active' | 'completed' | 'failed';
  questions: IQuestionResponse[];
  reportId?: Schema.Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>({
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

export default model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
