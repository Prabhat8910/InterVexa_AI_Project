import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new Schema({
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
UserSchema.methods.comparePassword = async function (password) {
    if (!this.password)
        return false;
    return bcrypt.compare(password, this.password);
};
export default model('User', UserSchema);
