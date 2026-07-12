import LiveInterviewSession from '../models/LiveInterviewSession';
import StudentProfile from '../models/StudentProfile';
import User from '../models/User';
import Report from '../models/Report';
import Meeting from '../models/Meeting';
import { groq } from '../config/groq';
import { isSkipOrMeaninglessAnswer } from '../agent/handler';

export const generateLiveReport = async (sessionId: string): Promise<void> => {
  try {
    console.log(`[Live Report Service] Generating report for session: ${sessionId}`);

    const session = await LiveInterviewSession.findById(sessionId);
    if (!session) {
      throw new Error(`Live session not found: ${sessionId}`);
    }

    // Resolve candidate details
    const candidateId = session.candidateId || session.interviewerId; // fallback to interviewer if no candidate joined
    const user = await User.findById(candidateId);
    const profile = await StudentProfile.findOne({ userId: candidateId });

    const QAs = session.questions;

    // 1. Calculate average speech metrics (communication & confidence) from candidate audio
    let totalComm = 0;
    let totalConf = 0;
    let totalGrammar = 0;
    let validTurns = 0;

    QAs.forEach(q => {
      if (q.answerTranscript) {
        totalComm += q.scores?.communication || 7.0;
        totalConf += q.scores?.confidence || 7.0;
        totalGrammar += q.voiceMetrics?.stabilityScore || 8.0;
        validTurns++;
      }
    });

    const avgComm = validTurns > 0 ? (totalComm / validTurns) * 10 : 70;
    const avgConf = validTurns > 0 ? (totalConf / validTurns) * 10 : 70;
    const avgGrammar = validTurns > 0 ? (totalGrammar / validTurns) * 10 : 80;

    // Format QA transcripts for LLM evaluation
    const QAFormatted = QAs.map((q, idx) => `Q${idx + 1}: ${q.questionText}\nA${idx + 1}: ${q.answerTranscript || '(No candidate answer recorded)'}`).join('\n\n');

    const prompt = `
      You are a principal engineer and lead career readiness evaluator at Google, Amazon, Microsoft, and Flipkart.
      Generate a detailed, objective, and constructive feedback report based on the candidate's live technical interview performance:
      
      Candidate Name: ${user ? user.name : 'Student Candidate'}
      Target Position: ${profile?.targetRole || 'Software Development Engineer'}
      
      Transcripts of Q&As:
      ${QAFormatted || 'No conversation transcript recorded.'}
      
      CRITICAL INSTRUCTIONS:
      1. You MUST ONLY evaluate the questions and answers listed in the "Transcripts of Q&As" section above.
      2. DO NOT invent, hallucinate, add, or substitute any questions or answers that are not explicitly present in the transcript list.
      3. If a question is a casual greeting or generic conversation (e.g. "What's up", "Hello", "How are you", "Do you want to talk about the weather"), set the question's score to 100, "expectedBetterAnswer" to "N/A" and "evaluationFeedback" to "Casual conversation/greeting."
      4. Apply a strict scoring standard based on the following exact weights for technical questions:
         - Technical Accuracy (40%)
         - Concept Coverage (20%)
         - Problem Solving (15%)
         - Communication (10%)
         - Confidence (5%)
         - Grammar (5%)
         - Examples (5%)
         Total = 100%
      5. If a candidate's answer is wrong or incorrect:
         - Technical Accuracy = 0
         - Concept Coverage = 0
         - Examples = 0
         - The overall score for that question MUST NOT exceed 25%.
      6. If the candidate says "I don't know", "Next question", "No idea", "Skip", "I forgot", or gives meaningless/empty/skipped text:
         - The overall score for that question MUST NOT exceed 25%.
         - The technical score for that question must be rated between 0 and 10 out of 100.
      7. Calculate overall average scores for the whole interview (0-100 scale) for:
         - Overall Score (weighted average based on the rubric across all questions)
         - Technical Score (weighted average of Technical Accuracy + Concept Coverage + Examples, or simple technical average)
         - Communication Score (use candidate communication quality average: ${avgComm.toFixed(1)}/100 as base, adjusted strictly by actual answer clarity)
         - Confidence Score (use candidate confidence average: ${avgConf.toFixed(1)}/100 as base)
         - Grammar Score (use candidate grammar/stability average: ${avgGrammar.toFixed(1)}/100 as base)
         - Problem Solving Score (average of Problem Solving across all questions)
      
      Also identify:
      - Strong Topics & Weak Topics (do not inflate or hallucinate strengths; only list genuine strengths demonstrated)
      - Topic-wise Scores (evaluate performance in Core CS, Projects, Programming, DBMS, OS, HR if asked)
      - Difficulty-wise Performance (average score for Easy, Medium, and Hard questions)
      - Hiring Recommendation (Strong Hire, Hire, Leaning Hire, No Hire) with objective justification
      - Interview Summary
      - Detailed Improvement Plan
      - Learning Roadmap

      You MUST respond ONLY with a JSON object in this exact schema:
      {
        "overallScore": 65,
        "technicalScore": 60,
        "communicationScore": 75,
        "confidenceScore": 80,
        "grammarScore": 70,
        "problemSolvingScore": 65,
        "hiringRecommendation": "Hiring Recommendation text...",
        "interviewSummary": "Interview summary text...",
        "strongTopics": ["Topic 1", "Topic 2"],
        "weakTopics": ["Topic 3", "Topic 4"],
        "topicWiseScores": {
          "Core CS": 80,
          "Projects": 75,
          "Programming": 50,
          "DBMS": 40,
          "OS": 60,
          "HR": 85
        },
        "difficultyWisePerformance": {
          "Easy": 85,
          "Medium": 70,
          "Hard": 45
        },
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "detailedImprovementPlan": "Detailed step-by-step improvement plan referencing specific mistakes made...",
        "learningRoadmap": "Structured learning roadmap timeline...",
        "expectedAnswers": [
          {
            "question": "exact text of question Q1",
            "givenAnswer": "exact text of answer A1",
            "expectedBetterAnswer": "comprehensive optimal expected answer text or N/A",
            "score": 60,
            "difficulty": "Medium",
            "timeTaken": 45,
            "strengths": "strengths in this answer",
            "weaknesses": "weaknesses in this answer",
            "missingConcepts": ["concept A", "concept B"],
            "improvementSuggestions": "improvement suggestions...",
            "evaluationFeedback": "detailed review commentary..."
          }
        ],
        "resources": [
          { "title": "Resource title", "type": "course|video|article", "url": "URL" }
        ]
      }
    `;

    console.log(`[Live Report Service] Requesting Groq LLM evaluation...`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const rawJson = chatCompletion.choices[0]?.message?.content || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error('[Live Report Service] JSON parse error:', parseErr);
      parsedData = {
        overallScore: Math.round((avgComm + avgConf + avgGrammar) / 3),
        technicalScore: 70,
        communicationScore: Math.round(avgComm),
        confidenceScore: Math.round(avgConf),
        grammarScore: Math.round(avgGrammar),
        problemSolvingScore: 70,
        hiringRecommendation: "Leaning No Hire due to evaluation compile failure.",
        interviewSummary: "Parsing failure during evaluation generation.",
        strongTopics: [],
        weakTopics: [],
        topicWiseScores: {},
        difficultyWisePerformance: {},
        strengths: ["Communication pacing"],
        weaknesses: ["Missing concepts"],
        detailedImprovementPlan: "Practice structuring technical answers.",
        learningRoadmap: "N/A",
        expectedAnswers: [],
        resources: []
      };
    }

    // Construct strengths list containing structured sections
    const structuredStrengths: string[] = [
      `Interview Summary: ${parsedData.interviewSummary || 'No summary generated.'}`,
      `Hiring Recommendation: ${parsedData.hiringRecommendation || 'No recommendation generated.'}`,
      `Problem Solving Score: ${parsedData.problemSolvingScore || parsedData.technicalScore || 0}%`,
      `Topic-wise Scores: ${Object.entries(parsedData.topicWiseScores || {}).map(([topic, score]) => `${topic}: ${score}%`).join(' | ')}`,
      `Difficulty-wise Performance: Easy: ${parsedData.difficultyWisePerformance?.Easy || 0}%, Medium: ${parsedData.difficultyWisePerformance?.Medium || 0}%, Hard: ${parsedData.difficultyWisePerformance?.Hard || 0}%`,
      `Strong Topics: ${(parsedData.strongTopics || []).join(', ') || 'None identified'}`
    ];
    
    if (parsedData.strengths && Array.isArray(parsedData.strengths)) {
      structuredStrengths.push(...parsedData.strengths);
    }

    // Construct weaknesses list containing structured sections
    const structuredWeaknesses: string[] = [
      `Weak Topics: ${(parsedData.weakTopics || []).join(', ') || 'None identified'}`,
      `Detailed Improvement Plan: ${parsedData.detailedImprovementPlan || 'N/A'}`,
      `Learning Roadmap: ${parsedData.learningRoadmap || 'N/A'}`
    ];
    
    if (parsedData.weaknesses && Array.isArray(parsedData.weaknesses)) {
      structuredWeaknesses.push(...parsedData.weaknesses);
    }

    // Construct expectedAnswersComparison with detailed evaluation feedback block
    const expectedAnswersComparison = (parsedData.expectedAnswers || []).map((ea: any) => {
      // Local check if candidate answer was skipped or empty
      const isSkipped = isSkipOrMeaninglessAnswer(ea.givenAnswer || '');
      const finalScore = isSkipped ? Math.min(25, ea.score || 0) : (ea.score || 0);

      const feedbackBlock = `Score: ${finalScore}/100 | Difficulty: ${ea.difficulty || 'Medium'} | Time Taken: ${ea.timeTaken || 0}s
Strengths: ${ea.strengths || 'None'}
Weaknesses: ${ea.weaknesses || 'None'}
Missing Concepts: ${Array.isArray(ea.missingConcepts) ? ea.missingConcepts.join(', ') : (ea.missingConcepts || 'None')}
Improvement Suggestions: ${ea.improvementSuggestions || 'None'}

Detailed Review: ${ea.evaluationFeedback || 'N/A'}`;

      return {
        question: ea.question || 'N/A',
        givenAnswer: ea.givenAnswer || 'No response recorded',
        expectedBetterAnswer: ea.expectedBetterAnswer || 'N/A',
        evaluationFeedback: feedbackBlock
      };
    });

    // Fallback if empty
    if (expectedAnswersComparison.length === 0) {
      QAs.forEach(qa => {
        expectedAnswersComparison.push({
          question: qa.questionText,
          givenAnswer: qa.answerTranscript || 'No response recorded',
          expectedBetterAnswer: 'N/A',
          evaluationFeedback: `Score: ${isSkipOrMeaninglessAnswer(qa.answerTranscript || '') ? 0 : 70}/100 | Commentary: Satisfactory response.`
        });
      });
    }

    // 3. Save report to Mongoose Report collection (making it compatible with existing pages)
    const report = new Report({
      interviewId: session._id,
      studentId: candidateId,
      overallScore: Math.round(parsedData.overallScore || (parsedData.technicalScore + avgComm + avgConf + avgGrammar) / 4),
      technicalScore: Math.round(parsedData.technicalScore || 70),
      communicationScore: Math.round(parsedData.communicationScore || avgComm),
      confidenceScore: Math.round(parsedData.confidenceScore || avgConf),
      grammarScore: Math.round(parsedData.grammarScore || avgGrammar),
      strengths: structuredStrengths,
      weaknesses: structuredWeaknesses,
      expectedAnswersComparison: expectedAnswersComparison,
      voiceAnalysisSummary: {
        overallFluency: avgComm >= 75 ? 'Excellent' : 'Moderate',
        avgSpeechRate: Math.round(QAs.reduce((acc, curr) => acc + (curr.voiceMetrics?.speedWordsPerMin || 0), 0) / (validTurns || 1)),
        totalFillersDetected: QAs.reduce((acc, curr) => acc + (curr.voiceMetrics?.fillersCount || 0), 0),
        voiceToneRating: 'Professional'
      },
      emotionTimeline: QAs.map((q, idx) => ({
        timestamp: `Q${idx + 1}`,
        stress: q.emotionalFeedback?.stress || 3,
        calmness: q.emotionalFeedback?.calmness || 7,
        confidence: q.emotionalFeedback?.confidence || 7
      })),
      recommendedResources: parsedData.resources || []
    });

    const savedReport = await report.save();

    // 4. Update live interview session record with report ID
    session.reportId = savedReport._id as any;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Update associated Meeting status to completed
    await Meeting.findOneAndUpdate({ roomId: session.roomId }, { status: 'completed' });

    // 5. Update Candidate profile metrics for placement readiness
    if (profile && session.candidateId) {
      const compositeScore = Math.round((profile.atsScore + savedReport.overallScore) / 2);
      profile.placementReadinessScore = compositeScore;
      profile.strengths = savedReport.strengths;
      profile.weaknesses = savedReport.weaknesses;
      await profile.save();
    }

    console.log(`[Live Report Service] Live Interview Report saved: ${savedReport._id}`);

  } catch (error) {
    console.error('[Live Report Service] Report compiler error:', error);
  }
};
