import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'university', 'admin'],
        default: 'student'
    },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    notifications: {
        interviewReminders: { type: Boolean, default: true },
        reportReady:        { type: Boolean, default: true },
        weeklyDigest:       { type: Boolean, default: false },
        placementUpdates:   { type: Boolean, default: true }
    }
}, {
    timestamps: true
});
UserSchema.methods.comparePassword = async function (password) {
    if (!this.password)
        return false;
    return bcrypt.compare(password, this.password);
};
export default model('User', UserSchema);
