import { Schema, model, Document } from 'mongoose';

export interface ILiveQuestionResponse {
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

export interface ILiveTranscriptItem {
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
}

export interface ILiveInterviewSession extends Document {
  interviewerId: Schema.Types.ObjectId;
  candidateId?: Schema.Types.ObjectId;
  roomId: string;
  status: 'created' | 'active' | 'completed' | 'failed';
  questions: ILiveQuestionResponse[];
  transcripts: ILiveTranscriptItem[];
  reportId?: Schema.Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
}

const LiveInterviewSessionSchema = new Schema<ILiveInterviewSession>({
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

export default model<ILiveInterviewSession>('LiveInterviewSession', LiveInterviewSessionSchema);
