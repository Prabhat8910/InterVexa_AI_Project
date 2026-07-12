import { v4 as uuidv4 } from 'uuid';
import Meeting from '../models/Meeting';
import User from '../models/User';
import LiveInterviewSession from '../models/LiveInterviewSession';
import { generateParticipantToken } from '../config/livekit';
import { LiveInterviewAgent } from '../agent/liveHandler';
import { activeLiveAgents } from '../controllers/liveInterview.controller';
import nodemailer from 'nodemailer';

// Helper to send professional invitation email via SMTP (or log in dev)
export const sendInterviewInvitationEmail = async (
  recipientEmail: string,
  recipientName: string,
  role: 'candidate' | 'interviewer',
  meetingDetails: {
    title: string;
    description?: string;
    candidateName: string;
    interviewerName: string;
    date: string;
    time: string;
    duration: number;
    joinLink: string;
  }
) => {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  const emailSubject = `InterVexa AI - Mock Interview Invitation (${meetingDetails.title})`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; color: #333333; line-height: 1.6;">
      <h2 style="color: #6366f1; margin-top: 0;">🎥 InterVexa AI - Live Interview Invitation</h2>
      <p>Hello ${recipientName},</p>
      <p>You have been scheduled for an AI-powered live interview session on InterVexa. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="margin-top: 0; margin-bottom: 12px; color: #6366f1; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px;">Interview Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px; color: #666666;">Title:</td>
            <td style="padding: 6px 0; font-weight: bold;">${meetingDetails.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666; vertical-align: top;">Description:</td>
            <td style="padding: 6px 0;">${meetingDetails.description || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Candidate Name:</td>
            <td style="padding: 6px 0;">${meetingDetails.candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Interviewer Name:</td>
            <td style="padding: 6px 0;">${meetingDetails.interviewerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Date:</td>
            <td style="padding: 6px 0;">${meetingDetails.date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Time:</td>
            <td style="padding: 6px 0;">${meetingDetails.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Duration:</td>
            <td style="padding: 6px 0;">${meetingDetails.duration} Minutes</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666666;">Your Role:</td>
            <td style="padding: 6px 0; font-weight: bold; text-transform: capitalize; color: #6366f1;">${role}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${meetingDetails.joinLink}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2); transition: background-color 0.2s;">
          Join Live Interview
        </a>
      </div>
      
      <p style="font-size: 11px; color: #999999; margin-top: 20px;">
        Direct Room URL: <br/>
        <a href="${meetingDetails.joinLink}" style="color: #6366f1; word-break: break-all;">${meetingDetails.joinLink}</a>
      </p>
      
      <p style="font-size: 12px; color: #666666; font-style: italic; margin-top: 20px; border-top: 1px solid #eeeeee; padding-top: 10px;">
        Please make sure to join the link 5 minutes before the scheduled time. Ensure your camera and microphone are working.
      </p>
      
      <p style="margin-bottom: 0; margin-top: 20px;">Best Regards,</p>
      <p style="margin-top: 4px; font-weight: bold; color: #6366f1;">InterVexa AI</p>
      <p style="font-size: 11px; color: #999999; margin-top: 0;">AI Powered Placement Preparation Platform</p>
    </div>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    // ── SMTP Diagnostic (printed every send attempt) ──────────────────────────
    console.log('[SMTP Mailer] Attempting send to:', recipientEmail);
    console.log('[SMTP Mailer] SMTP_HOST  :', smtpHost);
    console.log('[SMTP Mailer] SMTP_PORT  :', smtpPort);
    console.log('[SMTP Mailer] SMTP_USER  :', smtpUser);
    console.log('[SMTP Mailer] secure flag:', smtpPort === 465, '(true=SSL/465, false=STARTTLS/587)');
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          // Do not fail on invalid certs (helps in dev, safe for production with Gmail)
          rejectUnauthorized: true
        }
      });

      // Verify credentials BEFORE attempting to send.
      // This surfaces 535 auth errors immediately with a descriptive message
      // rather than burying them inside a sendMail rejection.
      await transporter.verify();
      console.log('[SMTP Mailer] Credential verification passed. Sending email...');

      await transporter.sendMail({
        from: `"InterVexa AI" <${smtpUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml
      });
      console.log(`[SMTP Mailer] Email sent successfully to ${recipientEmail}`);
    } catch (err: any) {
      // Provide actionable error messages for the most common Gmail SMTP failures
      let friendlyMessage = err.message;
      if (err.responseCode === 535 || (err.message && err.message.includes('535'))) {
        friendlyMessage =
          `Gmail rejected authentication (535). ` +
          `Check that SMTP_USER and SMTP_PASS in backend/.env are your real Gmail address ` +
          `and a valid 16-character App Password (not your regular Gmail password). ` +
          `Original error: ${err.message}`;
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        friendlyMessage =
          `Cannot reach SMTP server (${err.code}). ` +
          `Check firewall / VPN and that SMTP_HOST=smtp.gmail.com SMTP_PORT=587 are set. ` +
          `Original error: ${err.message}`;
      }
      console.error(`[SMTP Mailer] Failed to send email to ${recipientEmail}:`, friendlyMessage);
      throw new Error(`SMTP dispatch failed: ${friendlyMessage}`);
    }
  } else {
    console.log("=========================================");
    console.log("             SIMULATED EMAIL             ");
    console.log("=========================================");
    console.log(`TO: ${recipientEmail}`);
    console.log(`SUBJECT: ${emailSubject}`);
    console.log(`JOIN LINK: ${meetingDetails.joinLink}`);
    console.log("=========================================");
  }
};

export interface IScheduledInterviewInput {
  title: string;
  description?: string;
  candidateEmail: string;
  interviewerEmail: string;
  date: string;
  time: string;
  duration: number;
}

// Create LiveKit scheduled interview
export const createScheduledInterview = async (
  userId: string,
  details: IScheduledInterviewInput
) => {
  // 1. Get recruiter/interviewer user details
  const recruiter = await User.findById(userId);
  const interviewerName = recruiter ? recruiter.name : 'Interviewer';

  // 2. Generate unique Room ID and Room Name
  const roomId = `live-interview-${uuidv4()}`;
  const roomName = details.title.replace(/[^a-zA-Z0-9-_]/g, '-');

  // 3. Generate token for the AI observer agent only (needed for silent evaluator startup)
  const agentToken = await generateParticipantToken(
    roomId,
    'ai-evaluation-agent',
    'InterVexa AI Observer',
    JSON.stringify({ role: 'agent' })
  );

  // 4. Save live session model to database
  const session = new LiveInterviewSession({
    interviewerId: userId as any,
    roomId,
    status: 'created',
    questions: [],
    transcripts: []
  });
  await session.save();

  // 5. Spin up the background LiveKit observer agent
  try {
    const agent = new LiveInterviewAgent(roomId, agentToken);
    activeLiveAgents.set(roomId, agent);

    agent.start().then(() => {
      console.log(`[Scheduler Service] LiveKit AI Agent observed room: ${roomId}`);
    }).catch(err => {
      console.error(`[Scheduler Service] LiveKit Observer Agent failed:`, err);
    });
  } catch (agentErr) {
    console.error(`[Scheduler Service] LiveKit Observer launch warning:`, agentErr);
  }

  // 6. Generate join URLs
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const candidateJoinLink = `${frontendUrl}/live-interview?roomId=${roomId}&role=candidate`;
  const interviewerJoinLink = `${frontendUrl}/live-interview?roomId=${roomId}&role=interviewer`;

  // 7. Save meeting details to MongoDB (without tokens)
  const newMeeting = new Meeting({
    title: details.title,
    description: details.description || '',
    candidateEmail: details.candidateEmail,
    interviewerEmail: details.interviewerEmail,
    roomId,
    roomName,
    liveInterviewLink: interviewerJoinLink,
    date: details.date,
    time: details.time,
    duration: details.duration,
    status: 'scheduled',
    createdBy: userId as any
  });

  const savedMeeting = await newMeeting.save();

  // 8. Automatically send invitations to Candidate and Interviewer
  let emailError: string | undefined;
  try {
    // Send Candidate invite
    await sendInterviewInvitationEmail(details.candidateEmail, 'Candidate', 'candidate', {
      title: details.title,
      description: details.description,
      candidateName: 'Candidate',
      interviewerName,
      date: details.date,
      time: details.time,
      duration: details.duration,
      joinLink: candidateJoinLink
    });

    // Send Interviewer invite
    await sendInterviewInvitationEmail(details.interviewerEmail, interviewerName, 'interviewer', {
      title: details.title,
      description: details.description,
      candidateName: 'Candidate',
      interviewerName,
      date: details.date,
      time: details.time,
      duration: details.duration,
      joinLink: interviewerJoinLink
    });
  } catch (err: any) {
    console.error('[Scheduler Service] Email invitation failed:', err.message);
    emailError = err.message || 'Email delivery failed';
  }

  return { meeting: savedMeeting, emailError };
};

// Delete scheduled interview helper
export const deleteScheduledInterview = async (meetingId: string, userId: string) => {
  const meeting = await Meeting.findOne({ _id: meetingId, createdBy: userId });
  if (!meeting) {
    throw new Error('Interview not found or you are not authorized to cancel it.');
  }

  // Find associated session and mark completed/cancelled
  const session = await LiveInterviewSession.findOne({ roomId: meeting.roomId });
  if (session) {
    session.status = 'completed'; // forces agent observers to disconnect
    await session.save();

    // Clean up active observer agent
    const agent = activeLiveAgents.get(meeting.roomId);
    if (agent) {
      agent.cleanup();
      activeLiveAgents.delete(meeting.roomId);
    }
  }

  await Meeting.deleteOne({ _id: meetingId });
  return { success: true };
};
