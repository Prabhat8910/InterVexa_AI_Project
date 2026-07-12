import { Schema, model, Document } from 'mongoose';

export interface IExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  year: string;
  grade: string;
}

export interface IProject {
  title: string;
  description: string;
  technologies: string[];
}

export interface IStudentProfile extends Document {
  userId: Schema.Types.ObjectId;
  resumeUrl?: string;
  resumeRawText?: string;
  atsScore: number;
  skills: string[];
  experience: IExperience[];
  education: IEducation[];
  projects: IProject[];
  targetRole?: string;
  targetCompany?: string;
  placementReadinessScore: number;
  strengths: string[];
  weaknesses: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  resumeUrl: { type: String },
  resumeRawText: { type: String },
  atsScore: { type: Number, default: 0 },
  skills: [{ type: String }],
  experience: [{
    company: { type: String },
    role: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  education: [{
    institution: { type: String },
    degree: { type: String },
    year: { type: String },
    grade: { type: String }
  }],
  projects: [{
    title: { type: String },
    description: { type: String },
    technologies: [{ type: String }]
  }],
  targetRole: { type: String },
  targetCompany: { type: String },
  placementReadinessScore: { type: Number, default: 0 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }]
}, {
  timestamps: true
});

export default model<IStudentProfile>('StudentProfile', StudentProfileSchema);
