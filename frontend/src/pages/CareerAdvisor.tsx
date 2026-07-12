import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Map, 
  Sparkles, 
  BookOpen, 
  FolderGit2, 
  Bookmark, 
  AlertCircle
} from 'lucide-react';

export const CareerAdvisor: React.FC = () => {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'Product Manager'
  ];

  const fetchRoadmap = async () => {
    try {
      const response = await api.get('/career/roadmap');
      setRoadmap(response.data.roadmap);
      setTargetRole(response.data.roadmap.targetRole);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status !== 404) {
        setError('Failed to fetch career roadmap.');
      }
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post('/career/roadmap', { targetRole });
      setRoadmap(response.data.roadmap);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to compile learning roadmap.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">AI Career Roadmap Advisor</h2>
        <p className="mt-2 text-sm text-textMuted max-w-xl">
          Set your career destination to outline a customized preparation curriculum. We generate timeline phases, course logs, specific projects, and interview checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role Config widget */}
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Target Selection</h3>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b0f19] py-3 px-4 text-sm text-white outline-none transition focus:border-brandPrimary"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start space-x-2 text-xs text-red-400 rounded-xl bg-red-500/10 border border-red-500/25 p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 w-full rounded-xl bg-brandPrimary py-3 font-semibold text-white transition hover:bg-brandPrimary/80 disabled:opacity-50"
          >
            {isGenerating ? 'Compiling Path via Groq...' : 'Generate Roadmap'}
          </button>
        </div>

        {/* Roadmap Display widget */}
        <div className="lg:col-span-2 space-y-6">
          {roadmap ? (
            <div className="space-y-6">
              
              {/* Placement Strategy box */}
              {roadmap.placementPrepPlan && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-brandPrimary/10 to-brandSecondary/5 p-6">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-brandSecondary" />
                    <span>Placement Strategy & Checklists</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs leading-relaxed text-gray-300">
                    <div>
                      <span className="font-semibold text-white block mb-1">60-Day timeline Checklist</span>
                      <p>{roadmap.placementPrepPlan.timeline}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-white block mb-1">Mock Interview Schedule</span>
                      <p>{roadmap.placementPrepPlan.mockSchedule}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Steps list */}
              <h3 className="text-lg font-bold text-white">Milestone Phases</h3>
              <div className="space-y-6">
                {roadmap.roadmapSteps?.map((step: any, idx: number) => (
                  <div key={idx} className="relative pl-8 border-l border-white/10">
                    {/* Circle marker */}
                    <div className="absolute left-[-9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brandPrimary border-2 border-darkBg"></div>
                    
                    <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                        <div>
                          <h4 className="text-md font-bold text-white">{step.phase}</h4>
                          <span className="text-xs text-textMuted mt-0.5 block">{step.objective}</span>
                        </div>
                        <span className="mt-2 sm:mt-0 text-xs font-semibold text-brandSecondary bg-brandSecondary/10 border border-brandSecondary/20 rounded-full px-2.5 py-0.5 self-start">
                          {step.duration}
                        </span>
                      </div>

                      {/* Skills */}
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-textMuted block mb-2">Focus Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {step.recommendedSkills?.map((skill: string) => (
                            <span key={skill} className="rounded bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Courses and Projects Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Courses */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center space-x-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Recommended Courses</span>
                          </span>
                          <div className="space-y-2">
                            {step.courses?.map((course: any, cIdx: number) => (
                              <div key={cIdx} className="bg-white/2 border border-white/5 rounded-xl p-3 text-xs">
                                <h5 className="font-semibold text-white">{course.title}</h5>
                                <span className="text-textMuted mt-0.5 block">Provider: {course.provider}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center space-x-1">
                            <FolderGit2 className="h-3.5 w-3.5" />
                            <span>Recommended Projects</span>
                          </span>
                          <div className="space-y-2">
                            {step.suggestedProjects?.map((proj: any, pIdx: number) => (
                              <div key={pIdx} className="bg-white/2 border border-white/5 rounded-xl p-3 text-xs">
                                <h5 className="font-semibold text-white">{proj.title}</h5>
                                <p className="text-textMuted mt-1 leading-relaxed">{proj.spec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Certifications */}
                      {step.certifications?.length > 0 && (
                        <div className="border-t border-white/5 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-textMuted flex items-center space-x-1 mb-2">
                            <Bookmark className="h-3.5 w-3.5 text-brandSecondary" />
                            <span>Suggested Certifications</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {step.certifications.map((cert: string) => (
                              <span key={cert} className="rounded bg-brandSecondary/10 border border-brandSecondary/20 px-2 py-0.5 text-xs text-brandSecondary">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-cardBg p-12 text-center backdrop-blur text-textMuted text-sm">
              <Map className="h-10 w-10 mb-3 opacity-40 text-brandPrimary mx-auto" />
              <span>Select your targets and click generate to compile roadmap timeline.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CareerAdvisor;
