// @ts-ignore
import pdfParse from 'pdf-parse';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { groq } from '../config/groq.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudentProfile from '../models/StudentProfile.js';
export const analyzeResume = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF resume file.' });
        }
        console.log(`[Resume Controller] Uploading resume to Cloudinary...`);
        const resumeUrl = await uploadToCloudinary(req.file.buffer, 'resumes', 'auto');
        console.log(`[Resume Controller] Cloudinary URL: ${resumeUrl}`);
        console.log(`[Resume Controller] Parsing PDF text...`);
        const parsedPdf = await pdfParse(req.file.buffer);
        const resumeRawText = parsedPdf.text;
        console.log(`[Resume Controller] Parsed text length: ${resumeRawText.length} characters.`);
        if (!resumeRawText || resumeRawText.trim().length < 50) {
            return res.status(400).json({ message: 'Failed to extract text from the PDF. Ensure the file contains text layers, not raw images.' });
        }
        console.log(`[Resume Controller] Invoking Groq LLM for ATS audit & parsing...`);
        const systemPrompt = `
      You are an expert ATS (Applicant Tracking System) reviewer and hiring coordinator.
      Analyze the candidate's raw resume text and output a JSON response containing detailed scores, missing parameters, and structured text summaries.
      
      You must also parse details from the text to structure their professional profile (skills, projects, education, experience) so we can populate their profile settings.
      
      Analyze for the following target roles if mentioned: Software Engineer, Frontend Developer, Backend Developer, Data Scientist, Product Manager. If not mentioned, default target role to "Software Engineer".
      
      You MUST respond ONLY with a JSON object in this exact schema:
      {
        "atsScore": 75, // score out of 100
        "breakdown": {
          "formattingScore": 80,
          "grammarScore": 85,
          "keywordOptimization": 70,
          "structureScore": 75
        },
        "skillsExtract": {
          "identified": ["React", "Node.js", "TypeScript"],
          "missing": ["Docker", "Kubernetes", "System Design"]
        },
        "roleMatches": [
          { "roleName": "Software Engineer", "matchScore": 80, "gapAnalysis": "Solid foundational backend skills, needs containerization knowledge" }
        ],
        "grammarSuggestions": [
          { "issue": "Spelling/tense error", "context": "Developed and maintain features...", "correction": "Developed and maintained features..." }
        ],
        "keywordSuggestions": ["Microservices", "RESTful APIs", "CI/CD"],
        "improvementTips": ["Highlight quantifiable metrics in experience bullet points", "Include links to hosted GitHub repositories"],
        
        "parsedProfile": {
          "skills": ["React", "Node.js", "TypeScript", "MongoDB", "Express.js"],
          "education": [
            { "institution": "State University", "degree": "B.Tech in Computer Science", "year": 2025, "grade": "8.5 CGPA" }
          ],
          "experience": [
            { "company": "Tech Labs", "role": "Software Engineering Intern", "duration": "3 Months", "description": "Developed backend API services" }
          ],
          "projects": [
            { "title": "E-commerce platform", "description": "Built full stack cart utilizing React & Express", "technologies": ["React", "Node.js"] }
          ]
        }
      }
    `;
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: resumeRawText }
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
            console.error('[Resume Controller] JSON parse error:', parseErr);
            return res.status(500).json({ message: 'Failed to parse resume analysis response from AI. Please try again.' });
        }
        // Save Resume Analysis to Database
        const analysis = new ResumeAnalysis({
            studentId: req.user.id,
            resumeUrl,
            atsScore: parsedData.atsScore || 65,
            breakdown: parsedData.breakdown || { formattingScore: 60, grammarScore: 60, keywordOptimization: 60, structureScore: 60 },
            skillsExtract: parsedData.skillsExtract || { identified: [], missing: [] },
            roleMatches: parsedData.roleMatches || [],
            grammarSuggestions: parsedData.grammarSuggestions || [],
            keywordSuggestions: parsedData.keywordSuggestions || [],
            improvementTips: parsedData.improvementTips || []
        });
        const savedAnalysis = await analysis.save();
        // Update Student Profile with parsed values to auto-populate profile fields
        const parsedProfile = parsedData.parsedProfile || {};
        const defaultRole = parsedProfile.targetRole || (parsedData.roleMatches?.[0]?.roleName) || 'Software Engineer';
        await StudentProfile.findOneAndUpdate({ userId: req.user.id }, {
            resumeUrl,
            resumeRawText,
            atsScore: parsedData.atsScore || 65,
            skills: parsedProfile.skills || [],
            experience: parsedProfile.experience || [],
            education: parsedProfile.education || [],
            projects: parsedProfile.projects || [],
            targetRole: defaultRole,
            // Set placement readiness starting point (e.g. ATS Score)
            placementReadinessScore: Math.round(parsedData.atsScore || 65)
        }, { upsert: true });
        res.status(200).json({
            message: 'Resume analyzed successfully.',
            analysis: savedAnalysis
        });
    }
    catch (error) {
        console.error('[Resume Controller] Analysis Failure:', error);
        next(error);
    }
};
export default analyzeResume;
