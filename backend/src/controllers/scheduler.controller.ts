import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as schedulerService from '../services/scheduler.service';
import Meeting from '../models/Meeting';

export const scheduleInterview = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { title, description, candidateEmail, interviewerEmail, date, time, duration } = req.body;

    if (!title || !candidateEmail || !interviewerEmail || !date || !time || !duration) {
      return res.status(400).json({ message: 'Missing required interview details fields.' });
    }

    const userId = req.user.id;
    const { meeting, emailError } = await schedulerService.createScheduledInterview(userId, {
      title,
      description,
      candidateEmail,
      interviewerEmail,
      date,
      time,
      duration: Number(duration)
    });

    if (emailError) {
      return res.status(201).json({ 
        message: 'Interview scheduled successfully, but invitation emails could not be sent.', 
        meeting,
        emailError,
        warning: true
      });
    }

    res.status(201).json({ message: 'Live interview created and scheduled.', meeting });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInterviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userId = req.user.id;

    // Fetch meetings created by the authenticated user
    const meetings = await Meeting.find({ createdBy: userId }).sort({ date: 1, time: 1 });

    // Compute scheduling statistics
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let total = meetings.length;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    meetings.forEach(m => {
      if (m.status === 'completed') {
        completed++;
      } else if (m.status === 'cancelled') {
        // don't count cancelled as completed or upcoming
      } else {
        if (m.date === todayStr) {
          today++;
          upcoming++; // today's pending meetings are also upcoming
        } else if (m.date > todayStr) {
          upcoming++;
        } else {
          completed++; // past dates are counted as completed
        }
      }
    });

    res.status(200).json({
      meetings,
      stats: {
        totalMeetings: total,
        todayMeetings: today,
        upcomingMeetings: upcoming,
        completedMeetings: completed
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ _id: id, createdBy: userId });
    if (!meeting) {
      return res.status(404).json({ message: 'Interview not found or unauthorized.' });
    }

    res.status(200).json({ meeting });
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, candidateEmail, interviewerEmail, date, time, duration, status } = req.body;

    const meeting = await Meeting.findOne({ _id: id, createdBy: userId });
    if (!meeting) {
      return res.status(404).json({ message: 'Interview not found or unauthorized.' });
    }

    // Apply updates
    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (candidateEmail) meeting.candidateEmail = candidateEmail;
    if (interviewerEmail) meeting.interviewerEmail = interviewerEmail;
    if (date) meeting.date = date;
    if (time) meeting.time = time;
    if (duration) meeting.duration = Number(duration);
    if (status) meeting.status = status;

    await meeting.save();

    res.status(200).json({ message: 'Interview updated successfully.', meeting });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteInterview = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const userId = req.user.id;

    const result = await schedulerService.deleteScheduledInterview(id, userId);
    res.status(200).json({ message: 'Interview deleted successfully.', ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
