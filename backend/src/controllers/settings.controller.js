import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';

// ─── GET /api/v1/settings ────────────────────────────────────────────────────
export const getSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/settings/profile ──────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address.' });
        }

        // Check email uniqueness (allow same email for same user)
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing && existing._id.toString() !== req.user.id) {
            return res.status(400).json({ message: 'That email is already taken by another account.' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name: name.trim(), email: email.toLowerCase().trim() },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        res.status(200).json({ message: 'Profile updated successfully.', user });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/settings/password ─────────────────────────────────────────
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/v1/settings/avatar ────────────────────────────────────────────
export const uploadAvatar = async (req, res, next) => {
    try {
        const { imageData } = req.body; // base64 data URI

        if (!imageData) {
            return res.status(400).json({ message: 'No image data provided.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Check if Cloudinary is properly configured
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const isCloudinaryReady = cloudName && !cloudName.includes('your_cloudinary');

        let avatarUrl, avatarPublicId;

        if (isCloudinaryReady) {
            // Delete old avatar from Cloudinary if exists
            if (user.avatarPublicId) {
                try {
                    await cloudinary.uploader.destroy(user.avatarPublicId);
                } catch (_) {
                    // Non-fatal: continue even if deletion fails
                }
            }

            const result = await cloudinary.uploader.upload(imageData, {
                folder: 'intervexa/avatars',
                transformation: [
                    { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
                public_id: `avatar_${req.user.id}_${Date.now()}`
            });

            avatarUrl = result.secure_url;
            avatarPublicId = result.public_id;
        } else {
            // Mock mode: echo back a deterministic placeholder using ui-avatars
            const encodedName = encodeURIComponent(user.name);
            avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=4f46e5&color=fff&size=200&bold=true`;
            avatarPublicId = null;
            console.warn('[Settings] Cloudinary not configured — returning mock avatar URL.');
        }

        user.avatarUrl = avatarUrl;
        user.avatarPublicId = avatarPublicId;
        await user.save();

        res.status(200).json({
            message: isCloudinaryReady ? 'Avatar uploaded successfully.' : 'Avatar updated (mock mode — configure Cloudinary for real uploads).',
            avatarUrl,
            mockMode: !isCloudinaryReady
        });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/settings/notifications ────────────────────────────────────
export const updateNotifications = async (req, res, next) => {
    try {
        const { interviewReminders, reportReady, weeklyDigest, placementUpdates } = req.body;

        const notifications = {};
        if (typeof interviewReminders === 'boolean') notifications['notifications.interviewReminders'] = interviewReminders;
        if (typeof reportReady === 'boolean')        notifications['notifications.reportReady']        = reportReady;
        if (typeof weeklyDigest === 'boolean')       notifications['notifications.weeklyDigest']       = weeklyDigest;
        if (typeof placementUpdates === 'boolean')   notifications['notifications.placementUpdates']   = placementUpdates;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: notifications },
            { new: true, runValidators: true }
        ).select('notifications');

        res.status(200).json({ message: 'Notification preferences saved.', notifications: user.notifications });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/v1/settings/account ─────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password confirmation is required to delete your account.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password. Account deletion cancelled.' });
        }

        // Delete Cloudinary avatar if exists
        if (user.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(user.avatarPublicId);
            } catch (_) { /* Non-fatal */ }
        }

        // Cascade delete student profile if applicable
        if (user.role === 'student') {
            await StudentProfile.findOneAndDelete({ userId: user._id });
        }

        await User.findByIdAndDelete(req.user.id);

        res.status(200).json({ message: 'Your account has been permanently deleted.' });
    } catch (err) {
        next(err);
    }
};
