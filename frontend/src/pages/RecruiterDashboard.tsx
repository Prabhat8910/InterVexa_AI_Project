import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Users, Search, AlertCircle, ArrowRight } from 'lucide-react';

export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await api.get('/recruiter/candidates');
        setCandidates(response.data.candidates);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch candidate screened list.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-64 bg-white/5 border border-white/10 rounded-2xl"></div></div>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2"><AlertCircle className="h-6 w-6" /><h3 className="font-bold text-lg">Error</h3></div>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white font-sans">Recruiter Screening Dashboard</h2>
        <p className="mt-2 text-sm text-textMuted max-w-xl">
          Search candidate listings, review overall mock scores and ATS ratings, and view full detailed AI evaluations.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, role, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brandPrimary focus:bg-white/10"
        />
      </div>

      {/* Candidates list table */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        {filteredCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-textMuted font-bold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Target Role</th>
                  <th className="pb-3">ATS Score</th>
                  <th className="pb-3">Mock Score</th>
                  <th className="pb-3">AI Recommendation</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-white/1">
                    <td className="py-4">
                      <div className="font-semibold text-white">{candidate.name}</div>
                      <div className="text-xs text-textMuted">{candidate.email}</div>
                    </td>
                    <td className="py-4 text-gray-300">{candidate.targetRole}</td>
                    <td className="py-4 font-mono text-white">{candidate.atsScore}%</td>
                    <td className="py-4 font-semibold text-white">{candidate.interviewScore}%</td>
                    <td className="py-4">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${
                        candidate.aiRecommendation === 'Highly Recommended'
                          ? 'bg-brandAccent/10 border-brandAccent/20 text-brandAccent'
                          : 'bg-brandPrimary/10 border-brandPrimary/20 text-brandPrimary'
                      }`}>
                        {candidate.aiRecommendation}
                      </span>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => {
                          if (candidate.latestReportId) {
                            navigate(`/report/${candidate.latestReportId}`);
                          }
                        }}
                        disabled={!candidate.latestReportId}
                        className={`flex items-center space-x-1 text-xs font-semibold ${
                          candidate.latestReportId 
                            ? 'text-brandPrimary hover:underline cursor-pointer' 
                            : 'text-gray-500 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <span>Analyze Reports</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-textMuted text-sm">
            <Users className="h-8 w-8 mb-2 opacity-50 text-brandPrimary" />
            <span>No candidates found matching your criteria.</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default RecruiterDashboard;
