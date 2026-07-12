import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import StudentProfile from '../models/StudentProfile';
import InterviewSession from '../models/InterviewSession';
import User from '../models/User';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new StudentProfile({
        userId: req.user.id,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        strengths: [],
        weaknesses: []
      });
      await profile.save();
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { targetRole, targetCompany, skills, experience, education, projects } = req.body;

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        targetRole,
        targetCompany,
        skills,
        experience,
        education,
        projects
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const userId = req.user.id;

    // Fetch user info
    const user = await User.findById(userId).select('name email role avatarUrl');
    
    // Fetch profile
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId, skills: [], experience: [], education: [], projects: [], strengths: [], weaknesses: [] });
      await profile.save();
    }

    // Fetch previous interviews
    const previousInterviews = await InterviewSession.find({ 
      studentId: userId, 
      status: 'completed' 
    })
    .sort({ createdAt: -1 })
    .select('roomId status createdAt reportId')
    .populate({
      path: 'reportId',
      select: 'overallScore technicalScore communicationScore confidenceScore'
    });

    // Calculate Average Interview Score
    let avgInterviewScore = 0;
    const completedSessions = previousInterviews.filter(i => i.reportId);
    if (completedSessions.length > 0) {
      const sum = completedSessions.reduce((acc, curr: any) => acc + (curr.reportId?.overallScore || 0), 0);
      avgInterviewScore = Math.round(sum / completedSessions.length);
    }

    // Upcoming mock interviews (scheduled ones)
    const upcomingInterviews = await InterviewSession.find({
      studentId: userId,
      status: 'scheduled'
    }).sort({ createdAt: 1 }).limit(3);

    // AI Suggestions based on weaknesses
    let aiSuggestions = [
      "Upload your resume to calculate your initial ATS Score.",
      "Start a live Voice Mock Interview to evaluate your technical & speaking skills.",
      "Complete your profile settings to receive customized career roadmap tracks."
    ];

    if (profile.atsScore > 0) {
      aiSuggestions = [];
      if (profile.atsScore < 70) {
        aiSuggestions.push("Optimize resume syntax to boost your ATS formatting score.");
      }
      if (profile.weaknesses && profile.weaknesses.length > 0) {
        profile.weaknesses.slice(0, 2).forEach(w => {
          aiSuggestions.push(`Practice coding problems and structure concepts around ${w}.`);
        });
      }
      if (avgInterviewScore > 0 && avgInterviewScore < 75) {
        aiSuggestions.push("Work on pace control and minimize filler words in speech to improve communication.");
      }
      if (aiSuggestions.length === 0) {
        aiSuggestions.push("Keep practicing mock interviews to maintain your placement readiness levels!");
      }
    }

    res.status(200).json({
      user,
      metrics: {
        resumeScore: profile.atsScore,
        interviewScore: avgInterviewScore,
        placementReadiness: profile.placementReadinessScore,
        targetRole: profile.targetRole || 'Not Set',
        targetCompany: profile.targetCompany || 'Not Set'
      },
      upcomingInterviews,
      previousInterviews,
      aiSuggestions,
      recommendedSkills: profile.weaknesses && profile.weaknesses.length > 0 ? profile.weaknesses : ["Data Structures", "System Design", "Behavioral Speech"]
    });
  } catch (error) {
    next(error);
  }
};
