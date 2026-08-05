import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import University from '../models/University.js';
import Recruiter from '../models/Recruiter.js';
const signToken = (id, email, role) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
    }
    return jwt.sign({ id, email, role }, jwtSecret, {
        expiresIn: '24h'
    });
};
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, companyName, universityCode, universityName } = req.body;
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email address.' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create User object
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });
        // Setup related profiles based on roles
        if (role === 'student') {
            if (universityCode) {
                const code = universityCode.toString().toUpperCase().trim();
                const university = await University.findOne({ domainCode: code });
                if (!university) {
                    return res.status(400).json({ message: `University code "${code}" is invalid. Please double check or leave blank.` });
                }
                user.universityId = university._id;
            }
            const studentProfile = new StudentProfile({
                userId: user._id,
                skills: [],
                experience: [],
                education: [],
                projects: [],
                strengths: [],
                weaknesses: []
            });
            await studentProfile.save();
        }
        else if (role === 'recruiter') {
            if (!companyName) {
                return res.status(400).json({ message: 'Company name is required for recruiter registration.' });
            }
            const recruiter = new Recruiter({
                companyName,
                screenedCandidates: []
            });
            const savedRecruiter = await recruiter.save();
            user.recruiterId = savedRecruiter._id;
        }
        else if (role === 'university') {
            if (!universityCode || !universityName) {
                return res.status(400).json({ message: 'University code and name are required.' });
            }
            // Check if university already exists
            let university = await University.findOne({ domainCode: universityCode });
            if (!university) {
                university = new University({
                    name: universityName,
                    domainCode: universityCode,
                    analytics: { totalStudents: 0, averageInterviewScore: 0, averageAtsScore: 0, placementRate: 0 },
                    departments: []
                });
                await university.save();
            }
            user.universityId = university._id;
        }
        await user.save();
        const token = signToken(user._id.toString(), user.email, user.role);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
};
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const token = signToken(user._id.toString(), user.email, user.role);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
};
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        next(error);
    }
};
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        let devResetLink;
        let devToken;
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
            await user.save();
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
            const emailSubject = `InterVexa AI - Password Reset Request`;
            console.log("=========================================");
            console.log("             SIMULATED RESET EMAIL       ");
            console.log("=========================================");
            console.log(`TO: ${user.email}`);
            console.log(`SUBJECT: ${emailSubject}`);
            console.log(`RESET LINK: ${resetUrl}`);
            console.log("=========================================");
            devResetLink = resetUrl;
            devToken = resetToken;
        }
        const responseData = {
            message: 'If an account with that email exists, we have sent a password reset email.'
        };
        if (process.env.NODE_ENV !== 'production' && devResetLink) {
            responseData.devResetLink = devResetLink;
            responseData.devToken = devToken;
        }
        res.status(200).json(responseData);
    }
    catch (error) {
        next(error);
    }
};
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: 'Password has been successfully updated.' });
    }
    catch (error) {
        next(error);
    }
};
