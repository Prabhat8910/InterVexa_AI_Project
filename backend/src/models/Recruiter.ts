import { Schema, model, Document } from 'mongoose';

export interface IScreenedCandidate {
  studentId: Schema.Types.ObjectId;
  atsScore: number;
  interviewScore: number;
  rankingScore: number;
  aiRecommendation: string;
}

export interface IRecruiter extends Document {
  companyName: string;
  screenedCandidates: IScreenedCandidate[];
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterSchema = new Schema<IRecruiter>({
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

export default model<IRecruiter>('Recruiter', RecruiterSchema);
