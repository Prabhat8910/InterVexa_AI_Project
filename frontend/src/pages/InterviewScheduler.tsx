import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Calendar, 
  Clock, 
  Mail, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Eye, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Video, 
  Sparkles
} from 'lucide-react';

interface InterviewItem {
  _id: string;
  title: string;
  description?: string;
  candidateEmail: string;
  interviewerEmail: string;
  roomId: string;
  roomName: string;
  candidateToken: string;
  interviewerToken: string;
  liveInterviewLink: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: string;
}

interface StatsData {
  totalMeetings: number;
  todayMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
}

export const InterviewScheduler: React.FC = () => {
  // State variables
  const [meetings, setMeetings] = useState<InterviewItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalMeetings: 0,
    todayMeetings: 0,
    upcomingMeetings: 0,
    completedMeetings: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);

  // Modals / Details states
  const [selectedMeeting, setSelectedMeeting] = useState<InterviewItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for creating meeting
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCandidateEmail, setFormCandidateEmail] = useState('');
  const [formInterviewerEmail, setFormInterviewerEmail] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('30');

  // Form states for editing meeting
  const [editId, setEditId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCandidateEmail, setEditCandidateEmail] = useState('');
  const [editInterviewerEmail, setEditInterviewerEmail] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('30');
  const [editStatus, setEditStatus] = useState<'scheduled' | 'cancelled' | 'completed'>('scheduled');

  // Toast notifier helper
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const listResponse = await api.get('/scheduler/interviews');
      setMeetings(listResponse.data.meetings || []);
      if (listResponse.data.stats) {
        setStats(listResponse.data.stats);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast('Failed to load scheduled interviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create meeting handler
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formCandidateEmail || !formInterviewerEmail || !formDate || !formTime) {
      triggerToast('Please fill out all required fields.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/scheduler/schedule', {
        title: formTitle,
        description: formDesc,
        candidateEmail: formCandidateEmail,
        interviewerEmail: formInterviewerEmail,
        date: formDate,
        time: formTime,
        duration: Number(formDuration)
      });

      if (res.data.warning || res.data.emailError) {
        triggerToast(
          `⚠ Interview scheduled successfully.\n\nHowever invitation emails could not be sent.\n\nReason:\n${res.data.emailError || 'Unknown error'}`,
          'error'
        );
      } else {
        triggerToast(
          `✅ Live Interview Scheduled Successfully\n\nInvitation emails have been sent to:\n\nCandidate:\n${formCandidateEmail}\n\nInterviewer:\n${formInterviewerEmail}`,
          'success'
        );
      }
      
      // Reset form fields
      setFormTitle('');
      setFormDesc('');
      setFormCandidateEmail('');
      setFormInterviewerEmail('');
      setFormDate('');
      setFormTime('');
      setFormDuration('30');
      
      // Refresh listings
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to schedule live interview.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal with selected meeting details
  const openEditModal = (meeting: InterviewItem) => {
    setEditId(meeting._id);
    setEditTitle(meeting.title);
    setEditDesc(meeting.description || '');
    setEditCandidateEmail(meeting.candidateEmail);
    setEditInterviewerEmail(meeting.interviewerEmail);
    setEditDate(meeting.date);
    setEditTime(meeting.time);
    setEditDuration(meeting.duration.toString());
    setEditStatus(meeting.status);
    setIsEditModalOpen(true);
  };

  // Update meeting handler
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTitle || !editCandidateEmail || !editInterviewerEmail || !editDate || !editTime) {
      triggerToast('Please fill out all required fields for editing.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/scheduler/interviews/${editId}`, {
        title: editTitle,
        description: editDesc,
        candidateEmail: editCandidateEmail,
        interviewerEmail: editInterviewerEmail,
        date: editDate,
        time: editTime,
        duration: Number(editDuration),
        status: editStatus
      });

      triggerToast('Scheduled interview updated successfully.');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to update scheduled interview.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete meeting handler
  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel and delete this scheduled interview?')) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/scheduler/interviews/${meetingId}`);
      triggerToast('Scheduled interview cancelled and deleted.');
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to delete scheduled interview.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Portal */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl border shadow-lg backdrop-blur flex items-center space-x-3 animate-slide-in ${
              t.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-950/80 border-red-500/30 text-red-300'
            }`}
          >
            {t.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span className="text-xs font-semibold whitespace-pre-line">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Title Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">🎥 Live Interview Scheduling</h1>
            <p className="text-xs text-textMuted mt-0.5">Schedule AI-powered live interviews and automatically invite candidates.</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Scheduled', value: stats.totalMeetings, color: 'from-blue-500/10 to-indigo-500/5', border: 'border-blue-500/20' },
          { label: 'Today\'s Sessions', value: stats.todayMeetings, color: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/20' },
          { label: 'Upcoming Sessions', value: stats.upcomingMeetings, color: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20' },
          { label: 'Completed Sessions', value: stats.completedMeetings, color: 'from-purple-500/10 to-pink-500/5', border: 'border-purple-500/20' }
        ].map((stat, idx) => (
          <div key={idx} className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.color} p-5 backdrop-blur transition-all duration-300 hover:scale-[1.02]`}>
            <p className="text-xs font-medium text-textMuted uppercase tracking-wider">{stat.label}</p>
            <h3 className="mt-2 text-3xl font-extrabold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Core Layout: Create Form + Scheduled Listings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* CREATE MEETING FORM CARD */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur lg:col-span-4 self-start">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3 mb-5">
            <Plus className="h-4 w-4 text-brandPrimary" />
            <h3 className="font-bold text-white text-sm">Create Interview</h3>
          </div>

          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Interview Title *</label>
              <input 
                type="text" 
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer Mock Interview"
                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brandPrimary transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Description</label>
              <textarea 
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Brief guidelines, technical stack focus, or interviewer notes..."
                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brandPrimary transition h-16 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Candidate Email *</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formCandidateEmail}
                  onChange={e => setFormCandidateEmail(e.target.value)}
                  placeholder="candidate@email.com"
                  className="w-full bg-[#0a0c10] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brandPrimary transition"
                  required
                />
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Interviewer Email *</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formInterviewerEmail}
                  onChange={e => setFormInterviewerEmail(e.target.value)}
                  placeholder="interviewer@email.com"
                  className="w-full bg-[#0a0c10] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brandPrimary transition"
                  required
                />
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Date *</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Time *</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                  <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Duration *</label>
              <select 
                value={formDuration}
                onChange={e => setFormDuration(e.target.value)}
                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="90">90 Minutes</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={actionLoading}
              className="w-full rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary hover:from-indigo-600 hover:to-pink-600 text-white font-bold py-2.5 text-xs transition duration-200 flex items-center justify-center space-x-1.5 shadow-lg shadow-brandPrimary/15"
            >
              <span>Schedule Live Interview</span>
            </button>
          </form>
        </div>

        {/* LISTINGS CARD */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur lg:col-span-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-brandSecondary" />
              <h3 className="font-bold text-white text-sm">Scheduled Interviews</h3>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brandPrimary border-t-transparent" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <Video className="h-10 w-10 text-gray-700 mb-3" />
              <h4 className="text-sm font-semibold text-white">No interviews scheduled yet</h4>
              <p className="text-xs text-textMuted mt-1 max-w-xs">Fill out the scheduling form to create dynamic LiveKit interview rooms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-textMuted tracking-wider">
                    <th className="pb-3 pl-2">Title</th>
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Interviewer</th>
                    <th className="pb-3">Date / Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-textNormal">
                  {meetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="py-4 pl-2 font-semibold text-white max-w-[150px] truncate" title={meeting.title}>
                        {meeting.title}
                      </td>
                      <td className="py-4 font-mono text-[11px] text-brandSecondary truncate max-w-[120px]" title={meeting.candidateEmail}>
                        {meeting.candidateEmail}
                      </td>
                      <td className="py-4 font-mono text-[11px] text-brandPrimary truncate max-w-[120px]" title={meeting.interviewerEmail}>
                        {meeting.interviewerEmail}
                      </td>
                      <td className="py-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3 w-3 text-textMuted" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-textMuted">
                          <Clock className="h-3 w-3" />
                          <span>{meeting.time} ({meeting.duration}m)</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          meeting.status === 'scheduled' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : meeting.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="py-4 pr-2">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsViewModalOpen(true);
                            }}
                            title="View Details"
                            className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-white flex items-center justify-center transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => openEditModal(meeting)}
                            title="Edit Meeting"
                            className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-white flex items-center justify-center transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMeeting(meeting._id)}
                            title="Delete Meeting"
                            className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => window.open(meeting.liveInterviewLink, '_blank', 'noopener,noreferrer')}
                            title="Join Live Interview"
                            className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-brandPrimary to-brandSecondary hover:from-indigo-600 hover:to-pink-600 text-white font-bold flex items-center space-x-1 transition text-[10px]"
                          >
                            <Video className="h-3 w-3" />
                            <span>Join</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/10 bg-[#0e1017] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-base">Interview Scheduled Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-textMuted hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Title</h4>
                <p className="text-sm font-semibold text-white">{selectedMeeting.title}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Description</h4>
                <p className="text-xs text-textNormal bg-[#050608] rounded-lg p-2.5 border border-white/5 leading-relaxed">
                  {selectedMeeting.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Candidate Email</h4>
                  <p className="text-xs font-mono text-brandSecondary truncate">{selectedMeeting.candidateEmail}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Interviewer Email</h4>
                  <p className="text-xs font-mono text-brandPrimary truncate">{selectedMeeting.interviewerEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Date</h4>
                  <p className="text-xs font-semibold text-white">{selectedMeeting.date}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Time</h4>
                  <p className="text-xs font-semibold text-white">{selectedMeeting.time}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Duration</h4>
                  <p className="text-xs font-semibold text-white">{selectedMeeting.duration} mins</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">LiveKit Room ID</h4>
                <p className="text-[10px] font-mono text-textMuted select-all bg-white/5 rounded px-2 py-1">{selectedMeeting.roomId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t border-white/5 pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-1/3 text-xs font-bold text-textNormal border border-white/10 rounded-xl py-2.5 hover:bg-white/5 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedMeeting);
                }}
                className="w-1/3 text-xs font-bold text-white border border-white/10 bg-white/5 rounded-xl py-2.5 hover:bg-white/10 transition"
              >
                Edit Details
              </button>
              <button
                onClick={() => window.open(selectedMeeting.liveInterviewLink, '_blank', 'noopener,noreferrer')}
                className="w-1/3 text-xs font-bold text-white bg-gradient-to-r from-brandPrimary to-brandSecondary rounded-xl py-2.5 flex items-center justify-center space-x-1.5 shadow-lg shadow-brandPrimary/20 transition hover:from-indigo-600 hover:to-pink-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Join Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEETING DETAILS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/10 bg-[#0e1017] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-base">Edit Interview Details</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-textMuted hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMeeting} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Interview Title *</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Candidate Email *</label>
                  <input 
                    type="email" 
                    value={editCandidateEmail}
                    onChange={e => setEditCandidateEmail(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Interviewer Email *</label>
                  <input 
                    type="email" 
                    value={editInterviewerEmail}
                    onChange={e => setEditInterviewerEmail(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Date *</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Time *</label>
                  <input 
                    type="time" 
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Duration *</label>
                  <select 
                    value={editDuration}
                    onChange={e => setEditDuration(e.target.value)}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                  >
                    <option value="15">15 Min</option>
                    <option value="30">30 Min</option>
                    <option value="45">45 Min</option>
                    <option value="60">60 Min</option>
                    <option value="90">90 Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-textMuted tracking-wider mb-1">Status</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandPrimary transition"
                >
                  <option value="scheduled">scheduled</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2.5 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-white/10 text-textNormal px-4 py-2 text-xs hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary text-white px-5 py-2 text-xs font-bold hover:from-indigo-600 hover:to-pink-600 transition shadow-md shadow-brandPrimary/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScheduler;
