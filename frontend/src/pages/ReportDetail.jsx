import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { FileDown, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
export const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get(`/interview/report/${id}`);
                setReport(response.data.report);
            }
            catch (err) {
                console.error(err);
                setError('Failed to load the interview report details.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);
    const handleDownloadPDF = () => {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const token = localStorage.getItem('token') || '';
        // Open in new tab or trigger direct download with token parameter
        window.open(`${backendUrl}/interview/report/${id}/pdf?token=${encodeURIComponent(token)}`, '_blank');
    };
    if (loading) {
        return (<div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-white/5 border border-white/10"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10"></div>
        </div>
        <div className="h-64 rounded-2xl bg-white/5 border border-white/10"></div>
      </div>);
    }
    if (error || !report) {
        return (<div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6"/>
          <h3 className="font-bold text-lg">Error Loading Report</h3>
        </div>
        <p className="mt-2 text-sm">{error || 'Report is currently generating, please wait a moment...'}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm font-semibold text-brandPrimary hover:underline">
          Back to Dashboard
        </button>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header card with action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 transition hover:bg-white/10">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Evaluation Feedback Report</h2>
            <span className="text-xs text-textMuted mt-0.5 block font-mono">ID: {report._id}</span>
          </div>
        </div>

        <button onClick={handleDownloadPDF} className="flex items-center justify-center space-x-2 rounded-xl bg-brandPrimary px-5 py-3 text-sm font-semibold text-white shadow shadow-brandPrimary/20 transition hover:bg-brandPrimary/80">
          <FileDown className="h-4 w-4"/>
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
        <div className="rounded-2xl border border-white/10 bg-[#4F46E5]/15 p-5">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Overall</span>
          <h4 className="text-3xl font-extrabold text-white mt-2">{report.overallScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-5">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Technical</span>
          <h4 className="text-3xl font-extrabold text-brandPrimary mt-2">{report.technicalScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-5">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Communication</span>
          <h4 className="text-3xl font-extrabold text-brandSecondary mt-2">{report.communicationScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-5">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Confidence</span>
          <h4 className="text-3xl font-extrabold text-brandAccent mt-2">{report.confidenceScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-5">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Grammar</span>
          <h4 className="text-3xl font-extrabold text-white mt-2">{report.grammarScore}%</h4>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="font-bold text-white text-md mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-brandAccent"/>
            <span>Key Strengths Identified</span>
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            {report.strengths?.map((s) => (<li key={s} className="flex items-start space-x-2">
                <span>•</span>
                <span>{s}</span>
              </li>))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="font-bold text-white text-md mb-4 flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-400"/>
            <span>Improvement Gap Areas</span>
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            {report.weaknesses?.map((w) => (<li key={w} className="flex items-start space-x-2">
                <span>•</span>
                <span>{w}</span>
              </li>))}
          </ul>
        </div>
      </div>

      {/* Voice Expression Summary details */}
      {report.voiceAnalysisSummary && (<div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted mb-4">Speech Analytics Audit</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
            <div className="bg-white/2 rounded-xl border border-white/5 p-4 text-xs">
              <span className="text-textMuted block">Speaking Speed (Avg)</span>
              <h5 className="text-lg font-bold text-white mt-1">{report.voiceAnalysisSummary.avgSpeechRate} Words/Min</h5>
            </div>
            <div className="bg-white/2 rounded-xl border border-white/5 p-4 text-xs">
              <span className="text-textMuted block">Filler Words Spoken</span>
              <h5 className="text-lg font-bold text-brandSecondary mt-1">{report.voiceAnalysisSummary.totalFillersDetected} Count</h5>
            </div>
            <div className="bg-white/2 rounded-xl border border-white/5 p-4 text-xs">
              <span className="text-textMuted block">Fluency Category</span>
              <h5 className="text-lg font-bold text-brandAccent mt-1">{report.voiceAnalysisSummary.overallFluency}</h5>
            </div>
          </div>
        </div>)}

      {/* Q&A Detailed transcript review */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-6">Detailed Response Evaluation</h3>
        <div className="space-y-6 divide-y divide-white/5">
          {report.expectedAnswersComparison?.map((qa, idx) => (<div key={idx} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
              <h4 className="font-semibold text-brandPrimary text-md flex items-start space-x-2">
                <span className="font-mono text-xs bg-brandPrimary/10 text-brandPrimary px-2 py-0.5 rounded mt-0.5">Q{idx + 1}</span>
                <span>{qa.question}</span>
              </h4>
              
              <div className="pl-4 border-l border-white/5 space-y-2 text-sm leading-relaxed">
                <div>
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wider block">Your Answer</span>
                  <p className="text-gray-300 italic">"{qa.givenAnswer || 'No response recorded.'}"</p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-brandAccent uppercase tracking-wider block">Expected Optimal Answer Spec</span>
                  <p className="text-brandAccent">{qa.expectedBetterAnswer}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-brandSecondary uppercase tracking-wider block">Evaluation Commentary</span>
                  <p className="text-gray-300">{qa.evaluationFeedback}</p>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
};
export default ReportDetail;
