import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Database, Trash2, AlertCircle } from 'lucide-react';
export const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAdminData = async () => {
        try {
            const [usersRes, logsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/logs')
            ]);
            setUsers(usersRes.data.users);
            setLogs(logsRes.data.logs);
        }
        catch (err) {
            console.error(err);
            setError('Failed to fetch administration datasets.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAdminData();
    }, []);
    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? All profile, transcript, and report logs will be permanently deleted.'))
            return;
        try {
            await api.delete(`/admin/user/${id}`);
            fetchAdminData();
        }
        catch (err) {
            console.error(err);
            alert('Failed to delete user.');
        }
    };
    if (loading) {
        return <div className="animate-pulse space-y-6"><div className="h-64 bg-white/5 border border-white/10 rounded-2xl"></div></div>;
    }
    if (error) {
        return (<div className="rounded-xl bg-red-500/10 border border-red-500/25 p-6 text-red-400">
        <div className="flex items-center space-x-2"><AlertCircle className="h-6 w-6"/><h3 className="font-bold text-lg">Error</h3></div>
        <p className="mt-2 text-sm">{error}</p>
      </div>);
    }
    const studentsCount = users.filter(u => u.role === 'student').length;
    const recruitersCount = users.filter(u => u.role === 'recruiter').length;
    const universitiesCount = users.filter(u => u.role === 'university').length;
    return (<div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">System Admin Portal</h2>
        <p className="mt-2 text-sm text-textMuted max-w-xl">
          Global moderation panel. Moderate registered user profiles and audit background LiveKit agent connection logs.
        </p>
      </div>

      {/* Cohort counters */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Total Users</span>
          <h4 className="text-3xl font-extrabold text-white mt-2">{users.length}</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Students</span>
          <h4 className="text-3xl font-extrabold text-brandPrimary mt-2">{studentsCount}</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Recruiters</span>
          <h4 className="text-3xl font-extrabold text-brandSecondary mt-2">{recruitersCount}</h4>
        </div>
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <span className="text-xs text-textMuted uppercase tracking-wider block">Universities</span>
          <h4 className="text-3xl font-extrabold text-brandAccent mt-2">{universitiesCount}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User list block */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="text-lg font-bold text-white mb-6">User Accounts Administration</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-textMuted font-bold">
                  <th className="pb-3">Name / Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-right">Operation</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {users.map((u) => (<tr key={u._id} className="hover:bg-white/1">
                    <td className="py-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-xs text-textMuted">{u.email}</div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-semibold capitalize text-brandPrimary bg-brandPrimary/10 border border-brandPrimary/20 rounded-full px-2 py-0.5">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {u.role !== 'admin' && (<button onClick={() => handleDeleteUser(u._id)} className="text-red-400 hover:text-red-500 transition">
                          <Trash2 className="h-4 w-4 inline-block"/>
                        </button>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Logs panel */}
        <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <Database className="h-5 w-5 text-brandPrimary"/>
            <span>Audit System Logs</span>
          </h3>

          <div className="space-y-4 overflow-y-auto max-h-[360px] pr-2">
            {logs.map((log, idx) => (<div key={idx} className="rounded-xl bg-white/2 border border-white/5 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${log.level === 'WARN' ? 'text-yellow-400' : 'text-brandAccent'}`}>
                    [{log.level}] {log.service}
                  </span>
                  <span className="text-[10px] text-textMuted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{log.message}</p>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
};
export default AdminDashboard;
