import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Report from '../models/Report.js';
import University from '../models/University.js';

export const getUniversityAnalytics = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.universityId) {
            return res.status(404).json({ message: 'University details not associated with this administrator.' });
        }
        const university = await University.findById(admin.universityId);
        if (!university) {
            return res.status(404).json({ message: 'University record not found.' });
        }

        // Fetch all students associated with this university
        const students = await User.find({ universityId: admin.universityId, role: 'student' });
        const studentIds = students.map(s => s._id);

        // Fetch profiles and compute average ATS Score
        const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
        const atsScores = profiles.map(p => p.atsScore).filter(s => s > 0);
        const avgAtsScore = atsScores.length > 0 ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0;

        // Fetch completed interview reports and compute average interview score
        const reports = await Report.find({ studentId: { $in: studentIds } });
        const interviewScores = reports.map(r => r.overallScore);
        const avgInterviewScore = interviewScores.length > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) : 0;

        // Estimate placement rate based on readiness score (>= 70 = ready)
        const placedStudents = profiles.filter(p => p.placementReadinessScore >= 70).length;
        const placementRate = profiles.length > 0 ? Math.round((placedStudents / profiles.length) * 100) : 0;

        // Sync database cache analytics
        university.analytics = {
            totalStudents: students.length,
            averageInterviewScore: avgInterviewScore,
            averageAtsScore: avgAtsScore,
            placementRate
        };
        await university.save();

        // ── REAL department-wise grouping from actual student data ──
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        // Group profiles by their actual department field
        const deptMap = {};
        for (const profile of profiles) {
            const deptName = profile.department?.trim() || 'Not Specified';
            if (!deptMap[deptName]) {
                deptMap[deptName] = { scores: [], count: 0 };
            }
            deptMap[deptName].count += 1;
            if (profile.atsScore > 0) deptMap[deptName].scores.push(profile.atsScore);
        }

        // Mix in interview scores per student into their department bucket
        for (const report of reports) {
            const profile = profileMap.get(report.studentId?.toString());
            if (!profile) continue;
            const deptName = profile.department?.trim() || 'Not Specified';
            if (deptMap[deptName]) {
                deptMap[deptName].scores.push(report.overallScore);
            }
        }

        const departments = Object.entries(deptMap).map(([name, { scores, count }]) => ({
            name,
            studentCount: count,
            averageScore: scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0
        }));

        res.status(200).json({
            universityName: university.name,
            analytics: university.analytics,
            departments
        });
    }
    catch (error) {
        next(error);
    }
};

export const getUniversityStudents = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.universityId) {
            return res.status(404).json({ message: 'University details not associated with this administrator.' });
        }
        const students = await User.find({ universityId: admin.universityId, role: 'student' }).select('name email');
        const studentList = await Promise.all(students.map(async (student) => {
            const profile = await StudentProfile.findOne({ userId: student._id });
            const reports = await Report.find({ studentId: student._id });
            let avgScore = 0;
            if (reports.length > 0) {
                avgScore = Math.round(reports.reduce((acc, curr) => acc + curr.overallScore, 0) / reports.length);
            }
            return {
                id: student._id,
                name: student.name,
                email: student.email,
                department: profile?.department || 'Not Specified',
                targetRole: profile ? profile.targetRole : 'Not Set',
                atsScore: profile ? profile.atsScore : 0,
                interviewScore: avgScore,
                placementReadiness: profile ? profile.placementReadinessScore : 0
            };
        }));
        res.status(200).json({ students: studentList });
    }
    catch (error) {
        next(error);
    }
};
