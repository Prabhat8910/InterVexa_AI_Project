import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { generateParticipantToken } from '../config/livekit';
import LiveInterviewSession from '../models/LiveInterviewSession';
import User from '../models/User';
import { LiveInterviewAgent } from '../agent/liveHandler';
import { generateLiveReport } from '../services/liveReport.service';

// Global registry to track active live agents so we can clean them up programmatically
export const activeLiveAgents = new Map<string, LiveInterviewAgent>();

export const createLiveRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const userId = req.user.id;
    const user = await User.findById(userId);
    const userName = user ? user.name : 'Interviewer';
    const role = req.body.role || 'interviewer';

    // 1. Generate unique room ID
    const roomId = `live-interview-${uuidv4()}`;
    console.log(`[Live API] Allocating live room: ${roomId}`);

    // 2. Generate participant token for creator
    const creatorToken = await generateParticipantToken(
      roomId,
      userId.toString(),
      userName,
      JSON.stringify({ role, userId: userId.toString() })
    );

    // 3. Generate token for the silent AI Agent
    const agentToken = await generateParticipantToken(
      roomId,
      'ai-evaluation-agent',
      'InterVexa AI Observer',
      JSON.stringify({ role: 'agent' })
    );

    // 4. Save live session model to database
    const session = new LiveInterviewSession({
      interviewerId: role === 'interviewer' ? userId : null,
      candidateId: role === 'candidate' ? userId : null,
      roomId,
      status: 'created',
      questions: [],
      transcripts: []
    });
    
    if (role === 'interviewer') {
      session.interviewerId = userId as any;
    } else {
      session.candidateId = userId as any;
    }
    
    await session.save();

    // 5. Spin up the silent programmatic evaluation agent in the background
    const agent = new LiveInterviewAgent(roomId, agentToken);
    activeLiveAgents.set(roomId, agent);

    agent.start().then(() => {
      console.log(`[Live API] AI Agent background session launched for room: ${roomId}`);
    }).catch(err => {
      console.error(`[Live API] Failed to start AI Agent for room ${roomId}:`, err);
    });

    res.status(200).json({
      message: 'Live interview room initialized.',
      roomId,
      token: creatorToken,
      sessionId: session._id
    });

  } catch (error: any) {
    console.error('[Live API] Room creation error:', error.message);
    next(error);
  }
};

export const joinLiveRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { roomId, role } = req.body;
    if (!roomId || !role) {
      return res.status(400).json({ message: 'roomId and role are required fields.' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    const userName = user ? user.name : 'Participant';

    // Verify session exists
    const session = await LiveInterviewSession.findOne({ roomId });
    if (!session) {
      return res.status(404).json({ message: 'Live interview room not found.' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ message: 'This interview session has already ended.' });
    }

    // Generate LiveKit token with role metadata
    const token = await generateParticipantToken(
      roomId,
      userId.toString(),
      userName,
      JSON.stringify({ role, userId: userId.toString() })
    );

    // Update session model properties
    if (role === 'candidate') {
      session.candidateId = userId as any;
      session.status = 'active';
    } else if (role === 'interviewer') {
      session.interviewerId = userId as any;
      session.status = 'active';
    }

    await session.save();

    res.status(200).json({
      message: 'Joined live room successfully.',
      token,
      sessionId: session._id,
      status: session.status
    });

  } catch (error: any) {
    console.error('[Live API] Join room error:', error.message);
    next(error);
  }
};

export const endLiveRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const session = await LiveInterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Live session not found.' });
    }

    if (session.status === 'completed') {
      return res.status(200).json({ 
        message: 'Interview session ended. Evaluation report generation started.',
        sessionId: session._id 
      });
    }

    console.log(`[Live API] Ending live session: ${sessionId} for room: ${session.roomId}`);

    // Update database status immediately
    if (session.candidateId) {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      // Trigger report compilation via LLM in the background
      generateLiveReport(session._id.toString()).catch(err => {
        console.error('[Live API] Background live report generation error:', err);
      });
    } else {
      console.log(`[Live API] Candidate never joined session ${sessionId}. Skipping report generation.`);
      session.status = 'failed';
      session.completedAt = new Date();
      await session.save();
    }

    // Cleanup/Disconnect background LiveKit Agent participant
    const agent = activeLiveAgents.get(session.roomId);
    if (agent) {
      try {
        agent.broadcastState('finished');
      } catch (err: any) {
        console.error('[Live API] Failed to broadcast finished state from agent:', err.message);
      }
      setTimeout(() => {
        agent.cleanup();
      }, 1000);
      activeLiveAgents.delete(session.roomId);
    }

    res.status(200).json({
      message: session.status === 'completed' 
        ? 'Interview session ended. Evaluation report generation started.' 
        : 'Interview session ended. No evaluation report was generated because the candidate did not join.',
      sessionId: session._id
    });

  } catch (error) {
    next(error);
  }
};

export const getLiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const session = await LiveInterviewSession.findById(id).populate('reportId');
    if (!session) {
      return res.status(404).json({ message: 'Live session not found.' });
    }
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
};
