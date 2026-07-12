import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'recruiter' | 'university' | 'admin';
  avatarUrl?: string;
  universityId?: Schema.Types.ObjectId;
  recruiterId?: Schema.Types.ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'recruiter', 'university', 'admin'], 
    default: 'student' 
  },
  avatarUrl: { type: String },
  universityId: { type: Schema.Types.ObjectId, ref: 'University' },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});

UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default model<IUser>('User', UserSchema);
