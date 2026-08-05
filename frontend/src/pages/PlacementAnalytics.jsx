import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
export const PlacementAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/analytics/dashboard');
                setData(response.data);
            }
            catch (err) {
                console.error(err);
                setError('Failed to fetch analytics datasets. Complete some mock sessions first.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);
    if (loading) {
        return (<div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="h-80 rounded-2xl bg-white/5 border border-white/10"></div>
          <div className="h-80 rounded-2xl bg-white/5 border border-white/10"></div>
        </div>
        <div className="h-80 rounded-2xl bg-white/5 border border-white/10"></div>
      </div>);
    }
    if (error) {
        return (<div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6"/>
          <h3 className="font-bold text-lg">Error Loading Analytics</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">Placement Analytics</h2>
        <p className="mt-2 text-sm text-textMuted max-w-xl">
          Deep-dive analysis of your cumulative mock evaluations, voice properties metrics, and emotional patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Skill Dimensions Radar */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Technical & Soft Skills Radar</h3>
            <p className="text-xs text-textMuted mb-6">Comparison across core evaluation metrics relative to the placement standards.</p>
          </div>
          
          <div className="h-64 w-full flex items-center justify-center">
            {data?.skillRadar?.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={10}/>
                  <Radar name="Candidate" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25}/>
                </RadarChart>
              </ResponsiveContainer>) : (<span className="text-textMuted text-sm">Not enough data to populate radar dimension maps.</span>)}
          </div>
        </div>

        {/* Score Progress Trends */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Interview Overall & Tech Trends</h3>
            <p className="text-xs text-textMuted mb-6">Historical record showing progression path across completed mocks.</p>
          </div>

          <div className="h-64 w-full">
            {data?.interviewTrend?.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.interviewTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10}/>
                  <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 100]}/>
                  <Tooltip contentStyle={{
                backgroundColor: '#0b0f19',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
            }}/>
                  <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}/>
                  <Line type="monotone" dataKey="overall" name="Overall" stroke="#EC4899" strokeWidth={2} activeDot={{ r: 6 }}/>
                  <Line type="monotone" dataKey="technical" name="Technical" stroke="#6366F1" strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>) : (<div className="flex h-full items-center justify-center text-textMuted text-sm">
                <TrendingUp className="h-8 w-8 mb-2 opacity-50"/>
                <span>Complete mock interviews to track trends.</span>
              </div>)}
          </div>
        </div>
      </div>

      {/* Voice Emotion Timeline */}
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white mb-2">Voice Emotion Timeline Trends</h3>
        <p className="text-xs text-textMuted mb-6">Aggregated analysis tracking calm, stress, and confidence vocal energy fluctuations.</p>
        
        <div className="h-72 w-full">
          {data?.emotionTrend?.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.emotionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10}/>
                <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 100]}/>
                <Tooltip contentStyle={{
                backgroundColor: '#0b0f19',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
            }}/>
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}/>
                <Bar dataKey="calmness" name="Calmness" fill="#10B981" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="confidence" name="Confidence" fill="#4F46E5" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="stress" name="Stress Level" fill="#EF4444" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>) : (<div className="flex h-full items-center justify-center text-textMuted text-sm">
              <Sparkles className="h-8 w-8 mb-2 opacity-50"/>
              <span>Complete sessions to see vocal emotion timelines.</span>
            </div>)}
        </div>
      </div>
    </div>);
};
export default PlacementAnalytics;
