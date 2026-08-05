import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';
export const UniversityDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchUniversityData = async () => {
            try {
                const [analyticsRes, studentsRes] = await Promise.all([
                    api.get('/university/analytics'),
                    api.get('/university/students')
                ]);
                setData(analyticsRes.data);
                setStudents(studentsRes.data.students);
            }
            catch (err) {
                console.error(err);
                setError('Failed to fetch university details.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchUniversityData();
    }, []);
    if (loading) {
        return <div className="animate-pulse space-y-6"><div className="h-64 bg-white/5 border border-white/10 rounded-2xl"></div></div>;
    }
    if (error) {
        return (<div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2"><AlertCircle className="h-6 w-6"/><h3 className="font-bold text-lg">Error</h3></div>
        <p className="mt-2 text-sm">{error}</p>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-brandPrimary/20 to-brandSecondary/10 p-6 md:p-8">
        <h2 className="text-2xl font-bold md:text-3xl text-white font-sans">
          {data?.universityName} Portal
        </h2>
        <p className="mt-2 text-sm text-gray-300 md:text-base max-w-xl">
          Track campus-wide mock interview scores, ATS metrics, and individual placement readiness ratios.
        </p>
      </div>

      {/* Cohort Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Total Cohort</span>
          <h4 className="text-3xl font-extrabold text-white mt-2">{data?.analytics?.totalStudents}</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Mock Avg Score</span>
          <h4 className="text-3xl font-extrabold text-brandPrimary mt-2">{data?.analytics?.averageInterviewScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">ATS Avg Score</span>
          <h4 className="text-3xl font-extrabold text-brandSecondary mt-2">{data?.analytics?.averageAtsScore}%</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Campus Ready Rate</span>
          <h4 className="text-3xl font-extrabold text-brandAccent mt-2">{data?.analytics?.placementRate}%</h4>
        </div>
      </div>

      {/* Department Summary */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-6">Departmental Performance Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data?.departments?.map((dept) => (<div key={dept.name} className="bg-white/2 border border-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-white text-sm truncate">{dept.name}</h4>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-brandPrimary">{dept.averageScore}%</span>
                <span className="text-xs text-textMuted">{dept.studentCount} Students</span>
              </div>
            </div>))}
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-6">Student Roster & Evaluations</h3>
        {students.length > 0 ? (<div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-textMuted font-bold">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Target Role</th>
                  <th className="pb-3">ATS Score</th>
                  <th className="pb-3">Mock Avg</th>
                  <th className="pb-3">Placement Readiness</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {students.map((student) => (<tr key={student.id} className="hover:bg-white/1">
                    <td className="py-4">
                      <div className="font-semibold text-white">{student.name}</div>
                      <div className="text-xs text-textMuted">{student.email}</div>
                    </td>
                    <td className="py-4 text-gray-300">{student.targetRole || 'Not Set'}</td>
                    <td className="py-4 font-mono text-white">{student.atsScore}%</td>
                    <td className="py-4 font-semibold text-white">{student.interviewScore}%</td>
                    <td className="py-4 font-mono text-brandAccent">{student.placementReadiness}%</td>
                    <td className="py-4">
                      <button onClick={() => navigate(`/report/${student.id}`)} className="flex items-center space-x-1 text-xs font-semibold text-brandPrimary hover:underline">
                        <span>Analyze Logs</span>
                        <ArrowRight className="h-3.5 w-3.5"/>
                      </button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>) : (<div className="flex flex-col items-center justify-center py-8 text-textMuted text-sm">
            <GraduationCap className="h-8 w-8 mb-2 opacity-50 text-brandPrimary"/>
            <span>No students registered under your university code.</span>
          </div>)}
      </div>
    </div>);
};
export default UniversityDashboard;
