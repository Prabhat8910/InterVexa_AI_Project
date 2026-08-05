import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { FileText, Upload, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
export const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchLatestAnalysis = async () => {
            try {
                // Fetch dashboard to see if user already uploaded a resume, and if yes query latest report
                const response = await api.get('/student/dashboard');
                const profile = response.data;
                if (profile.metrics?.resumeScore > 0) {
                    // Actually, since resume details are synced into profile, we can fetch from student profile
                    const profileRes = await api.get('/student/profile');
                    if (profileRes.data.profile?.resumeUrl) {
                        setAnalysis({
                            atsScore: profileRes.data.profile.atsScore,
                            skillsExtract: {
                                identified: profileRes.data.profile.skills,
                                missing: ["System Design", "Docker", "CI/CD"] // fallback display
                            },
                            improvementTips: profileRes.data.profile.strengths?.length > 0 ? profileRes.data.profile.strengths : ["Highlight quantifiable impact parameters", "Integrate active links for projects"],
                            roleMatches: [
                                { roleName: profileRes.data.profile.targetRole || 'Software Engineer', matchScore: profileRes.data.profile.atsScore, gapAnalysis: 'Looks solid, target focus areas to boost score.' }
                            ]
                        });
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
        };
        fetchLatestAnalysis();
    }, []);
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
                setError(null);
            }
            else {
                setError('Only PDF files are supported.');
            }
        }
    };
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };
    const handleUpload = async () => {
        if (!file)
            return;
        setIsUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/resume/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAnalysis(response.data.analysis);
            setFile(null);
        }
        catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to upload and parse resume. Check file formatting.');
        }
        finally {
            setIsUploading(false);
        }
    };
    return (<div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">AI Resume Analyzer</h2>
        <p className="mt-2 text-sm text-textMuted max-w-xl">
          Drag and drop your PDF resume to run an automated ATS keyword check, check spelling and phrase structures, and extract target parameters.
        </p>
      </div>

      {/* Uploader drag-drop card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Resume Upload</h3>
            <div onDragOver={handleDragOver} onDrop={handleDrop} className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition hover:border-brandPrimary/40 hover:bg-white/1">
              <Upload className="h-10 w-10 text-brandPrimary mb-4 opacity-80"/>
              <p className="text-sm font-semibold text-white text-center">Drag and drop file here</p>
              <span className="text-xs text-textMuted mt-1">or click to browse files</span>
              <input type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" id="resume-file-picker"/>
              <label htmlFor="resume-file-picker" className="mt-4 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 cursor-pointer">
                Select File
              </label>
            </div>
            {file && (<div className="mt-4 flex items-center space-x-2 text-sm text-brandAccent">
                <CheckCircle className="h-4 w-4 shrink-0"/>
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>)}
            {error && (<div className="mt-4 flex items-start space-x-2 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0"/>
                <span>{error}</span>
              </div>)}
          </div>

          <button onClick={handleUpload} disabled={!file || isUploading} className="mt-6 w-full rounded-xl bg-brandPrimary py-3 font-semibold text-white transition hover:bg-brandPrimary/80 disabled:opacity-50">
            {isUploading ? 'Analyzing Resume via Groq...' : 'Upload & Analyze'}
          </button>
        </div>

        {/* Audit Results panel */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur min-h-[300px]">
          {analysis ? (<div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white">ATS Analysis Results</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-brandPrimary">{analysis.atsScore}%</span>
                  <span className="text-xs text-textMuted">ATS Score</span>
                </div>
              </div>

              {/* Score Breakdown if present */}
              {analysis.breakdown && (<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <span className="text-xs text-textMuted">Formatting</span>
                    <h5 className="text-lg font-bold text-white mt-1">{analysis.breakdown.formattingScore}%</h5>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <span className="text-xs text-textMuted">Keywords</span>
                    <h5 className="text-lg font-bold text-brandSecondary mt-1">{analysis.breakdown.keywordOptimization}%</h5>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <span className="text-xs text-textMuted">Grammar</span>
                    <h5 className="text-lg font-bold text-brandAccent mt-1">{analysis.breakdown.grammarScore}%</h5>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <span className="text-xs text-textMuted">Structure</span>
                    <h5 className="text-lg font-bold text-white mt-1">{analysis.breakdown.structureScore}%</h5>
                  </div>
                </div>)}

              {/* Skills grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl bg-white/2 border border-white/5 p-4">
                  <h4 className="font-semibold text-white text-sm mb-3">Identified Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillsExtract?.identified?.map((s) => (<span key={s} className="rounded bg-brandPrimary/10 border border-brandPrimary/20 px-2 py-1 text-xs font-semibold text-brandPrimary">
                        {s}
                      </span>)) || <span className="text-textMuted text-xs">None identified</span>}
                  </div>
                </div>
                
                <div className="rounded-xl bg-white/2 border border-white/5 p-4">
                  <h4 className="font-semibold text-white text-sm mb-3">Recommended Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillsExtract?.missing?.map((s) => (<span key={s} className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-xs font-semibold text-red-400">
                        {s}
                      </span>)) || <span className="text-textMuted text-xs">None missing</span>}
                  </div>
                </div>
              </div>

              {/* Role matching and gaps */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Role Gaps Matching</h4>
                <div className="space-y-3">
                  {analysis.roleMatches?.map((match) => (<div key={match.roleName} className="rounded-xl bg-white/2 border border-white/5 p-4">
                      <div className="flex items-center justify-between font-semibold text-sm mb-2 text-white">
                        <span>{match.roleName}</span>
                        <span className="text-brandSecondary">{match.matchScore}% Match</span>
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">{match.gapAnalysis}</p>
                    </div>))}
                </div>
              </div>

              {/* Grammar suggestions */}
              {analysis.grammarSuggestions?.length > 0 && (<div>
                  <h4 className="font-semibold text-white text-sm mb-3">Spelling & Structure Corrections</h4>
                  <div className="space-y-3">
                    {analysis.grammarSuggestions.map((g, idx) => (<div key={idx} className="rounded-xl bg-white/2 border border-white/5 p-4 text-xs space-y-1">
                        <p className="text-red-400 font-semibold">Issue: {g.issue}</p>
                        <p className="text-textMuted italic">"Context: ...{g.context}..."</p>
                        <p className="text-brandAccent font-semibold">Correction: {g.correction}</p>
                      </div>))}
                  </div>
                </div>)}

              {/* Improvement Tips */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Actionable Improvement Tips</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  {analysis.improvementTips?.map((tip, idx) => (<li key={idx} className="flex items-start space-x-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-brandAccent"/>
                      <span>{tip}</span>
                    </li>))}
                </ul>
              </div>

            </div>) : (<div className="flex h-full flex-col items-center justify-center text-textMuted text-sm py-12">
              <FileText className="h-10 w-10 mb-3 opacity-40 text-brandPrimary"/>
              <span>Submit your resume to view the ATS scoring dashboard.</span>
            </div>)}
        </div>
      </div>
    </div>);
};
export default ResumeAnalyzer;
