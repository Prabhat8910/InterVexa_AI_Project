import { Schema, model, Document } from 'mongoose';

export interface IDepartmentSummary {
  name: string;
  averageScore: number;
  studentCount: number;
}

export interface IUniversity extends Document {
  name: string;
  domainCode: string;
  analytics: {
    totalStudents: number;
    averageInterviewScore: number;
    averageAtsScore: number;
    placementRate: number;
  };
  departments: IDepartmentSummary[];
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>({
  name: { type: String, required: true, trim: true },
  domainCode: { type: String, required: true, unique: true, index: true },
  analytics: {
    totalStudents: { type: Number, default: 0 },
    averageInterviewScore: { type: Number, default: 0 },
    averageAtsScore: { type: Number, default: 0 },
    placementRate: { type: Number, default: 0 }
  },
  departments: [{
    name: { type: String, required: true },
    averageScore: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

export default model<IUniversity>('University', UniversitySchema);
