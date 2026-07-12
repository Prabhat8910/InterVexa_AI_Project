import { Schema, model, Document } from 'mongoose';

export interface IRoadmapCourse {
  title: string;
  provider: string;
  link?: string;
}

export interface IRoadmapProject {
  title: string;
  spec: string;
}

export interface IRoadmapStep {
  phase: string;
  duration: string;
  objective: string;
  recommendedSkills: string[];
  courses: IRoadmapCourse[];
  suggestedProjects: IRoadmapProject[];
  certifications: string[];
}

export interface ICareerRoadmap extends Document {
  studentId: Schema.Types.ObjectId;
  targetRole: string;
  roadmapSteps: IRoadmapStep[];
  placementPrepPlan: {
    timeline: string;
    mockSchedule: string;
    focusAreas: string[];
  };
  createdAt: Date;
}

const CareerRoadmapSchema = new Schema<ICareerRoadmap>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  targetRole: { type: String, required: true },
  roadmapSteps: [{
    phase: { type: String, required: true },
    duration: { type: String, required: true },
    objective: { type: String, required: true },
    recommendedSkills: [{ type: String }],
    courses: [{
      title: { type: String },
      provider: { type: String },
      link: { type: String }
    }],
    suggestedProjects: [{
      title: { type: String },
      spec: { type: String }
    }],
    certifications: [{ type: String }]
  }],
  placementPrepPlan: {
    timeline: { type: String },
    mockSchedule: { type: String },
    focusAreas: [{ type: String }]
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default model<ICareerRoadmap>('CareerRoadmap', CareerRoadmapSchema);
