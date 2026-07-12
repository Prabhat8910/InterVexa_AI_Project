import { Schema, model, Document } from 'mongoose';

export interface IRoleMatch {
  roleName: string;
  matchScore: number;
  gapAnalysis: string;
}

export interface IGrammarSuggestion {
  issue: string;
  context: string;
  correction: string;
}

export interface IResumeAnalysis extends Document {
  studentId: Schema.Types.ObjectId;
  resumeUrl: string;
  atsScore: number;
  breakdown: {
    formattingScore: number;
    grammarScore: number;
    keywordOptimization: number;
    structureScore: number;
  };
  skillsExtract: {
    identified: string[];
    missing: string[];
  };
  roleMatches: IRoleMatch[];
  grammarSuggestions: IGrammarSuggestion[];
  keywordSuggestions: string[];
  improvementTips: string[];
  createdAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resumeUrl: { type: String, required: true },
  atsScore: { type: Number, required: true, default: 0 },
  breakdown: {
    formattingScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    keywordOptimization: { type: Number, default: 0 },
    structureScore: { type: Number, default: 0 }
  },
  skillsExtract: {
    identified: [{ type: String }],
    missing: [{ type: String }]
  },
  roleMatches: [{
    roleName: { type: String },
    matchScore: { type: Number },
    gapAnalysis: { type: String }
  }],
  grammarSuggestions: [{
    issue: { type: String },
    context: { type: String },
    correction: { type: String }
  }],
  keywordSuggestions: [{ type: String }],
  improvementTips: [{ type: String }]
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default model<IResumeAnalysis>('ResumeAnalysis', ResumeAnalysisSchema);
