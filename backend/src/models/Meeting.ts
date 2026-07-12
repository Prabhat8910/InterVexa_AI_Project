import { Schema, model, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  candidateEmail: string;
  interviewerEmail: string;
  roomId: string;
  roomName: string;
  candidateToken?: string;
  interviewerToken?: string;
  liveInterviewLink: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'cancelled' | 'completed';
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
  title: { type: String, required: true },
  description: { type: String },
  candidateEmail: { type: String, required: true },
  interviewerEmail: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  roomName: { type: String, required: true },
  candidateToken: { type: String, required: false },
  interviewerToken: { type: String, required: false },
  liveInterviewLink: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'cancelled', 'completed'], 
    default: 'scheduled' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default model<IMeeting>('Meeting', MeetingSchema);
