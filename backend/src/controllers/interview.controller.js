import { v4 as uuidv4 } from 'uuid';
import { generateParticipantToken } from '../config/livekit.js';
import InterviewSession from '../models/InterviewSession.js';
import LiveInterviewSession from '../models/LiveInterviewSession.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { InterviewAgent } from '../agent/handler.js';
import { generatePDFReport } from '../services/pdf.service.js';
export const startInterview = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const studentId = req.user.id;
        const user = await User.findById(studentId);
        const studentName = user ? user.name : 'Student';
        // Verify if student has uploaded their resume first
        const profile = await StudentProfile.findOne({ userId: studentId });
        if (!profile || !profile.resumeUrl) {
            return res.status(400).json({
                message: 'Please upload your resume in the Resume Scanner section before starting your mock interview. We require a resume to structure relevant technical questions.'
            });
        }
        // 1. Generate unique room name
        const roomId = `interview-session-${uuidv4()}`;
        console.log(`[Interview API] Allocating room: ${roomId}`);
        // 2. Generate participant token for student
        const studentToken = await generateParticipantToken(roomId, studentId.toString(), studentName, JSON.stringify({ role: 'student' }));
        // 3. Generate token for the AI voice agent participant
        const agentToken = await generateParticipantToken(roomId, 'ai-evaluator', 'InterVexa AI Evaluator', JSON.stringify({ role: 'agent' }));
        // 4. Save session model to Database
        const session = new InterviewSession({
            studentId,
            roomId,
            status: 'scheduled',
            questions: []
        });
        await session.save();
        // 5. Spin up the voice agent worker asynchronously
        const agent = new InterviewAgent(roomId, agentToken);
        agent.start().then(() => {
            console.log(`[Interview API] AI Agent background session launched for room: ${roomId}`);
        }).catch(err => {
            console.error(`[Interview API] Failed to start AI Agent worker:`, err);
        });
        res.status(200).json({
            message: 'Interview session initialized.',
            roomId,
            token: studentToken,
            sessionId: session._id
        });
    }
    catch (error) {
        console.error('[Interview API] Initialization error:', error.message);
        next(error);
    }
};
export const getSession = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const session = await InterviewSession.findById(id).populate('reportId');
        if (!session) {
            return res.status(404).json({ message: 'Interview session not found.' });
        }
        // Gating check
        if (req.user.role === 'student' && session.studentId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to view this session.' });
        }
        res.status(200).json({ session });
    }
    catch (error) {
        next(error);
    }
};
export const getReport = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        // Query either by interview ID, report ID directly, or student User ID fallback
        let report = await Report.findOne({ interviewId: id });
        if (!report) {
            report = await Report.findById(id);
        }
        if (!report) {
            report = await Report.findOne({ studentId: id }).sort({ createdAt: -1 });
        }
        if (!report) {
            return res.status(404).json({ message: 'Interview evaluation report not found. Verify session state is completed.' });
        }
        // Gating check
        let isAllowed = false;
        if (req.user.role !== 'student') {
            isAllowed = true;
        }
        else if (report.studentId.toString() === req.user.id) {
            isAllowed = true;
        }
        else {
            const liveSession = await LiveInterviewSession.findById(report.interviewId);
            if (liveSession && liveSession.interviewerId && liveSession.interviewerId.toString() === req.user.id) {
                isAllowed = true;
            }
        }
        if (!isAllowed) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to view this report.' });
        }
        res.status(200).json({ report });
    }
    catch (error) {
        next(error);
    }
};
export const downloadReportPDF = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        let report = await Report.findOne({ interviewId: id });
        if (!report) {
            report = await Report.findById(id);
        }
        if (!report) {
            report = await Report.findOne({ studentId: id }).sort({ createdAt: -1 });
        }
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        // Gating check
        let isAllowedPDF = false;
        if (req.user.role !== 'student') {
            isAllowedPDF = true;
        }
        else if (report.studentId.toString() === req.user.id) {
            isAllowedPDF = true;
        }
        else {
            const liveSession = await LiveInterviewSession.findById(report.interviewId);
            if (liveSession && liveSession.interviewerId && liveSession.interviewerId.toString() === req.user.id) {
                isAllowedPDF = true;
            }
        }
        if (!isAllowedPDF) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to download this report.' });
        }
        const student = await User.findById(report.studentId);
        const studentName = student ? student.name : 'Student';
        console.log(`[PDF Download] Generating document buffer for candidate: ${studentName}`);
        const pdfBuffer = await generatePDFReport(report, studentName);
        // Stream PDF directly to client response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="InterVexa_AI_Report_${report._id}.pdf"`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('[PDF Download] Compiler error:', error);
        next(error);
    }
};
