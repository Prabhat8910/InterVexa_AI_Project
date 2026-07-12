import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Report from '../models/Report';
import StudentProfile from '../models/StudentProfile';

export const getStudentAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const studentId = req.user.id;

    // Fetch student profile
    const profile = await StudentProfile.findOne({ userId: studentId });
    const placementReadiness = profile ? profile.placementReadinessScore : 0;

    // Fetch all completed reports for the student
    const reports = await Report.find({ studentId }).sort({ createdAt: 1 });

    // Format trends data
    const interviewTrend = reports.map((r, idx) => ({
      name: `Mock #${idx + 1}`,
      overall: r.overallScore,
      technical: r.technicalScore,
      communication: r.communicationScore,
      date: new Date(r.createdAt).toLocaleDateString()
    }));

    const confidenceTrend = reports.map((r, idx) => ({
      name: `Mock #${idx + 1}`,
      confidence: r.confidenceScore
    }));

    const communicationTrend = reports.map((r, idx) => ({
      name: `Mock #${idx + 1}`,
      communication: r.communicationScore
    }));

    // Emotion Trends
    const emotionTrend = reports.map((r, idx) => ({
      name: `Mock #${idx + 1}`,
      stress: Math.round(r.emotionTimeline.reduce((acc, curr) => acc + (curr.stress || 0), 0) / (r.emotionTimeline.length || 1) * 10),
      calmness: Math.round(r.emotionTimeline.reduce((acc, curr) => acc + (curr.calmness || 0), 0) / (r.emotionTimeline.length || 1) * 10),
      confidence: Math.round(r.emotionTimeline.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / (r.emotionTimeline.length || 1) * 10)
    }));

    // Skill Radar average dimensions
    let avgTech = 0, avgComm = 0, avgConf = 0, avgGram = 0;
    if (reports.length > 0) {
      avgTech = Math.round(reports.reduce((acc, curr) => acc + curr.technicalScore, 0) / reports.length);
      avgComm = Math.round(reports.reduce((acc, curr) => acc + curr.communicationScore, 0) / reports.length);
      avgConf = Math.round(reports.reduce((acc, curr) => acc + curr.confidenceScore, 0) / reports.length);
      avgGram = Math.round(reports.reduce((acc, curr) => acc + curr.grammarScore, 0) / reports.length);
    }

    const skillRadar = [
      { subject: 'Technical Depth', A: avgTech, fullMark: 100 },
      { subject: 'Communication Pace', A: avgComm, fullMark: 100 },
      { subject: 'Auditory Confidence', A: avgConf, fullMark: 100 },
      { subject: 'Grammar Fluency', A: avgGram, fullMark: 100 },
      { subject: 'Resume ATS Rank', A: profile ? profile.atsScore : 0, fullMark: 100 }
    ];

    res.status(200).json({
      placementReadiness,
      interviewTrend,
      confidenceTrend,
      communicationTrend,
      emotionTrend,
      skillRadar
    });

  } catch (error) {
    next(error);
  }
};
export default getStudentAnalytics;
