import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import University from '../models/University';
import Recruiter from '../models/Recruiter';
import { AuthRequest } from '../middleware/auth.middleware';

const signToken = (id: string, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id, email, role }, jwtSecret, {
    expiresIn: '24h'
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
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
        user.universityId = university._id as any;
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
    } else if (role === 'recruiter') {
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required for recruiter registration.' });
      }
      const recruiter = new Recruiter({
        companyName,
        screenedCandidates: []
      });
      const savedRecruiter = await recruiter.save();
      user.recruiterId = savedRecruiter._id as any;
    } else if (role === 'university') {
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
      user.universityId = university._id as any;
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
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    let devResetLink: string | undefined;
    let devToken: string | undefined;

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

      const smtpHost = process.env.SMTP_HOST?.trim();
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();

      const emailSubject = `InterVexa AI - Password Reset Request`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; color: #333333; line-height: 1.6;">
          <h2 style="color: #6366f1; margin-top: 0;">🔒 InterVexa AI - Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the button below to reset your password. This link is valid for 1 hour.</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); transition: background-color 0.2s;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 11px; color: #999999; margin-top: 20px;">
            If you did not request this, please ignore this email and your password will remain unchanged.<br/><br/>
            Direct Link: <br/>
            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="margin-bottom: 0; margin-top: 20px;">Best Regards,</p>
          <p style="margin-top: 4px; font-weight: bold; color: #4F46E5;">InterVexa AI</p>
          <p style="font-size: 11px; color: #999999; margin-top: 0;">AI Powered Placement Preparation Platform</p>
        </div>
      `;

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            tls: {
              rejectUnauthorized: true
            }
          });

          await transporter.verify();
          await transporter.sendMail({
            from: `"InterVexa AI" <${smtpUser}>`,
            to: user.email,
            subject: emailSubject,
            html: emailHtml
          });
          console.log(`[SMTP Forgot Password] Password reset email sent to ${user.email}`);
        } catch (err: any) {
          console.error(`[SMTP Forgot Password] Failed to send email to ${user.email}:`, err.message);
          devResetLink = resetUrl;
          devToken = resetToken;
        }
      } else {
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
    }

    const responseData: any = {
      message: 'If an account with that email exists, we have sent a password reset email.'
    };
    if (process.env.NODE_ENV !== 'production' && devResetLink) {
      responseData.devResetLink = devResetLink;
      responseData.devToken = devToken;
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};
