import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  FileText, 
  Mic, 
  Map, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStartMockClick = () => {
    if (!data?.metrics?.resumeScore || data.metrics.resumeScore === 0) {
      alert('Please upload your resume in the Resume Scanner section before starting your mock interview. We require your resume to customize target questions.');
      navigate('/resume');
    } else {
      navigate('/interview');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/student/dashboard');
        setData(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard data. Ensure server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-white/5 border border-white/10"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-28 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-28 rounded-2xl bg-white/5 border border-white/10"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-80 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-80 rounded-2xl bg-white/5 border border-white/10"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6" />
          <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  // Preformat chart data from history
  const chartData = data?.previousInterviews?.map((i: any, idx: number) => ({
    name: `Mock #${idx + 1}`,
    score: i.reportId?.overallScore || 0
  })).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-brandPrimary/20 to-brandSecondary/10 p-6 md:p-8">
        <h2 className="text-2xl font-bold md:text-3xl text-white">
          Welcome back, {data?.user?.name}!
        </h2>
        <p className="mt-2 text-sm text-gray-300 md:text-base max-w-xl">
          Your target setup is currently targeted at the <span className="text-white font-semibold">{data?.metrics?.targetRole}</span> position at <span className="text-white font-semibold">{data?.metrics?.targetCompany}</span>.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-textMuted">ATS Score</span>
            <FileText className="h-5 w-5 text-brandPrimary" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{data?.metrics?.resumeScore}%</span>
            <span className="ml-2 text-xs text-textMuted">Resume Audit</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-textMuted">Interview Score</span>
            <Mic className="h-5 w-5 text-brandSecondary" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{data?.metrics?.interviewScore}%</span>
            <span className="ml-2 text-xs text-textMuted">Avg Speech Score</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-textMuted">Placement Readiness</span>
            <Award className="h-5 w-5 text-brandAccent" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{data?.metrics?.placementReadiness}%</span>
            <span className="ml-2 text-xs text-textMuted">Score Rating</span>
          </div>
        </div>
      </div>

      {/* Dynamic Graph and Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Trend Graph */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="text-lg font-bold text-white mb-6">Preparation Progress Trend</h3>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0b0f19', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-textMuted text-sm">
                <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                <span>Complete mock interviews to track progress trends.</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations list */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">InterVexa AI Advisor</h3>
            <div className="space-y-4">
              {data?.aiSuggestions?.map((sug: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-gray-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brandPrimary/10 border border-brandPrimary/20 text-xs font-semibold text-brandPrimary">
                    {idx + 1}
                  </div>
                  <p>{sug}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6">
            <button 
              onClick={handleStartMockClick}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-brandPrimary py-2.5 text-xs font-semibold text-white shadow shadow-brandPrimary/25 transition hover:bg-brandPrimary/80"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>Launch Mock Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-6">Quick Operations Panel</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button 
            onClick={handleStartMockClick}
            className="flex items-center space-x-4 rounded-xl border border-white/5 bg-white/2 px-5 py-4 text-left transition hover:bg-white/5 hover:border-brandPrimary/30"
          >
            <div className="rounded-lg bg-brandPrimary/10 p-3 text-brandPrimary">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Mock Interview</h4>
              <p className="text-xs text-textMuted mt-1">Start LiveKit voice room session</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/resume')}
            className="flex items-center space-x-4 rounded-xl border border-white/5 bg-white/2 px-5 py-4 text-left transition hover:bg-white/5 hover:border-brandSecondary/30"
          >
            <div className="rounded-lg bg-brandSecondary/10 p-3 text-brandSecondary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Resume Scanner</h4>
              <p className="text-xs text-textMuted mt-1">Upload CV for ATS analysis</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/career')}
            className="flex items-center space-x-4 rounded-xl border border-white/5 bg-white/2 px-5 py-4 text-left transition hover:bg-white/5 hover:border-brandAccent/30"
          >
            <div className="rounded-lg bg-brandAccent/10 p-3 text-brandAccent">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Career Roadmap</h4>
              <p className="text-xs text-textMuted mt-1">Generate learning targets</p>
            </div>
          </button>
        </div>
      </div>

      {/* History table */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-6">Historical Evaluations Logs</h3>
        
        {data?.previousInterviews?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-textMuted font-bold">
                  <th className="pb-3">Interview ID</th>
                  <th className="pb-3">Date Completed</th>
                  <th className="pb-3">Overall Performance</th>
                  <th className="pb-3">Communication Rating</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {data.previousInterviews.map((session: any) => (
                  <tr key={session._id} className="hover:bg-white/1">
                    <td className="py-4 font-mono text-xs text-textMuted">{session._id.substring(0, 12)}...</td>
                    <td className="py-4 text-gray-300">{new Date(session.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-semibold text-white">{session.reportId?.overallScore || 0}%</td>
                    <td className="py-4 text-gray-300">{session.reportId?.communicationScore || 0}%</td>
                    <td className="py-4">
                      <button 
                        onClick={() => navigate(`/report/${session.reportId?._id || session._id}`)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-brandPrimary hover:underline"
                      >
                        <span>View Report</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-textMuted py-8 text-sm">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <span>No interview sessions recorded. Start your first Mock Interview!</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentDashboard;
