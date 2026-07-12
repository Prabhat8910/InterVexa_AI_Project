import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import StudentProfile from '../models/StudentProfile';
import Report from '../models/Report';
import User from '../models/User';

export const getCandidates = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Retrieve all student profiles
    const profiles = await StudentProfile.find().populate({
      path: 'userId',
      select: 'name email avatarUrl'
    });

    const candidates = await Promise.all(
      profiles.map(async (profile: any) => {
        if (!profile.userId) return null;

        // Fetch completed reports to compute averages
        const reports = await Report.find({ studentId: profile.userId._id }).sort({ createdAt: -1 });
        let avgInterviewScore = 0;
        if (reports.length > 0) {
          const sum = reports.reduce((acc, curr) => acc + curr.overallScore, 0);
          avgInterviewScore = Math.round(sum / reports.length);
        }

        let recommendation = 'Training Required';
        if (avgInterviewScore >= 80 && profile.atsScore >= 75) {
          recommendation = 'Highly Recommended';
        } else if (avgInterviewScore >= 60 || profile.atsScore >= 60) {
          recommendation = 'Suitable Candidate';
        }

        return {
          id: profile.userId._id,
          latestReportId: reports.length > 0 ? reports[0]._id : null,
          name: profile.userId.name,
          email: profile.userId.email,
          targetRole: profile.targetRole || 'Software Engineer',
          atsScore: profile.atsScore,
          interviewScore: avgInterviewScore,
          placementReadiness: profile.placementReadinessScore,
          skills: profile.skills,
          strengths: profile.strengths,
          weaknesses: profile.weaknesses,
          aiRecommendation: recommendation
        };
      })
    );

    // Filter out null values
    const filteredCandidates = candidates.filter(c => c !== null);

    res.status(200).json({ candidates: filteredCandidates });
  } catch (error) {
    next(error);
  }
};

export const getCandidateReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Fetch user details
    const student = await User.findById(id).select('name email');
    if (!student) {
      return res.status(404).json({ message: 'Candidate user not found' });
    }

    // Fetch reports
    const reports = await Report.find({ studentId: id }).sort({ createdAt: -1 });
    
    // Fetch profile
    const profile = await StudentProfile.findOne({ userId: id });

    res.status(200).json({
      student,
      profile,
      reports
    });
  } catch (error) {
    next(error);
  }
};
export default getCandidateReport;
