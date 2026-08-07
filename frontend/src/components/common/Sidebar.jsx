import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Mic, FileText, Map, TrendingUp, Users, GraduationCap, Database, LogOut, Brain, Video } from 'lucide-react';

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    // Custom menu configurations based on Role
    const studentMenu = [
        { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5"/> },
        { name: 'Mock Interview', path: '/interview', icon: <Mic className="h-5 w-5"/> },
        { name: 'Resume scanner', path: '/resume', icon: <FileText className="h-5 w-5"/> },
        { name: 'Career Advisor', path: '/career', icon: <Map className="h-5 w-5"/> },
        { name: 'Placement Analytics', path: '/analytics', icon: <TrendingUp className="h-5 w-5"/> },
        { name: 'Live Interview Room', path: '/live-interview', icon: <Video className="h-5 w-5"/>, badge: 'NEW' },
    ];
    const recruiterMenu = [
        { name: 'Candidate Screening', path: '/recruiter', icon: <Users className="h-5 w-5"/> },
    ];
    const universityMenu = [
        { name: 'Cohort Analytics', path: '/university', icon: <GraduationCap className="h-5 w-5"/> },
    ];
    const adminMenu = [
        { name: 'Users Moderation', path: '/admin', icon: <Users className="h-5 w-5"/> },
        { name: 'System Logs', path: '/admin/logs', icon: <Database className="h-5 w-5"/> },
    ];

    let menuItems = studentMenu;
    if (user.role === 'recruiter') menuItems = recruiterMenu;
    if (user.role === 'university') menuItems = universityMenu;
    if (user.role === 'admin') menuItems = adminMenu;

    return (
        <aside className="fixed bottom-0 top-0 left-0 z-30 hidden w-64 border-r dark:border-white/10 border-indigo-100 dark:bg-darkBg/60 bg-white/90 backdrop-blur-md px-6 py-8 md:flex md:flex-col justify-between transition-colors duration-300">
            <div>
                {/* Logo */}
                <div className="flex items-center space-x-2 px-2 pb-8 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
                        <Brain className="h-5 w-5"/>
                    </div>
                    <span className="text-lg font-bold dark:text-white text-lightText tracking-tight">InterVexa</span>
                </div>

                {/* Nav links */}
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.path === '/dashboard' || item.path === '/recruiter' || item.path === '/university' || item.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-gradient-to-r from-brandPrimary/20 to-brandSecondary/10 dark:text-white text-brandPrimary border border-brandPrimary/30 shadow-lg shadow-brandPrimary/10'
                                        : 'dark:text-gray-400 text-lightMuted border border-transparent dark:hover:text-white hover:text-lightText dark:hover:bg-white/5 hover:bg-indigo-50'
                                }`
                            }
                        >
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <span>{item.name}</span>
                            </div>
                            {('badge' in item) && item.badge && (
                                <span className="rounded bg-brandSecondary/25 border border-brandSecondary/40 px-1.5 py-0.5 text-[9px] font-bold text-brandSecondary uppercase tracking-wider animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User profile + logout */}
            <div className="border-t dark:border-white/10 border-indigo-100 pt-6 transition-colors duration-300">
                <div className="flex items-center space-x-3 px-2 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brandPrimary to-brandSecondary flex items-center justify-center font-bold text-white uppercase shadow-lg shadow-brandPrimary/15">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium dark:text-white text-lightText truncate max-w-[140px]">{user.name}</h4>
                        <span className="text-xs dark:text-textMuted text-lightMuted capitalize">{user.role}</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex w-full items-center space-x-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:border-red-500/20"
                >
                    <LogOut className="h-5 w-5"/>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};
export default Sidebar;
