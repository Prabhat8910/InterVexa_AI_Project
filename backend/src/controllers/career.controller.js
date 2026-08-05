import StudentProfile from '../models/StudentProfile.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import { groq } from '../config/groq.js';
export const getRoadmap = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const roadmap = await CareerRoadmap.findOne({ studentId: req.user.id });
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not generated yet. Submit target settings to generate one.' });
        }
        res.status(200).json({ roadmap });
    }
    catch (error) {
        next(error);
    }
};
export const generateRoadmap = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const { targetRole } = req.body;
        if (!targetRole) {
            return res.status(400).json({ message: 'Target role is required to generate a roadmap.' });
        }
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        const skillsList = profile ? profile.skills.join(', ') : 'None';
        const projectsList = profile ? JSON.stringify(profile.projects.map(p => ({ title: p.title }))) : 'None';
        console.log(`[Career Controller] Generating custom roadmap for role: ${targetRole}...`);
        const systemPrompt = `
      You are a lead academic counselor and placement strategist.
      Analyze the candidate's skills and projects relative to their target role, and compile a structured phase-by-phase learning timeline.
      Ensure the courses and projects recommended are highly specific and valuable.
      
      You MUST respond ONLY with a JSON object in this exact schema:
      {
        "roadmapSteps": [
          {
            "phase": "Phase 1: Foundation Building",
            "duration": "1-4 Weeks",
            "objective": "Establish fundamental concepts",
            "recommendedSkills": ["Skill 1", "Skill 2"],
            "courses": [
              { "title": "Course Name", "provider": "Coursera/Udemy/Pluralsight", "link": "https://example.com" }
            ],
            "suggestedProjects": [
              { "title": "Project Title", "spec": "Functional details of what they should build" }
            ],
            "certifications": ["Cert Name 1"]
          }
        ],
        "placementPrepPlan": {
          "timeline": "60 Days preparation checklist",
          "mockSchedule": "Weekly voice mock interview focus schedules",
          "focusAreas": ["Data Structures", "System Design core patterns"]
        }
      }
    `;
        const userPrompt = `
      Target Role: ${targetRole}
      Candidate Current Skills: ${skillsList}
      Candidate Projects: ${projectsList}
    `;
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });
        const rawJson = chatCompletion.choices[0]?.message?.content || '{}';
        let parsedData = {};
        try {
            parsedData = JSON.parse(rawJson);
        }
        catch (parseErr) {
            console.error('[Career Controller] JSON parse error:', parseErr);
            return res.status(500).json({ message: 'Failed to parse career roadmap response from AI. Please try again.' });
        }
        // Save or update CareerRoadmap
        const roadmap = await CareerRoadmap.findOneAndUpdate({ studentId: req.user.id }, {
            targetRole,
            roadmapSteps: parsedData.roadmapSteps || [],
            placementPrepPlan: parsedData.placementPrepPlan || { timeline: '', mockSchedule: '', focusAreas: [] }
        }, { upsert: true, new: true });
        // Sync targetRole to StudentProfile as well
        await StudentProfile.findOneAndUpdate({ userId: req.user.id }, { targetRole }, { upsert: true });
        res.status(200).json({
            message: 'Roadmap generated successfully.',
            roadmap
        });
    }
    catch (error) {
        console.error('[Career Controller] Roadmap Generation Failure:', error);
        next(error);
    }
};
