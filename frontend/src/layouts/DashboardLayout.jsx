import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/common/Sidebar';
import { Brain, Sun, Moon } from 'lucide-react';

export const DashboardLayout = () => {
    const { user, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [animating, setAnimating] = useState(false);

    const handleToggle = () => {
        setAnimating(true);
        toggleTheme();
        setTimeout(() => setAnimating(false), 400);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-darkBg dark:bg-darkBg bg-lightBg text-white dark:text-white text-lightText">
                <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-brandPrimary"></div>
                    <Brain className="absolute h-6 w-6 text-brandSecondary animate-pulse"/>
                </div>
                <p className="mt-4 text-sm text-textMuted tracking-wide">Initializing session data...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    return (
        <div className="min-h-screen transition-colors duration-300 dark:bg-[#060913] bg-lightBg dark:text-white text-lightText">
            {/* Sidebar Panel */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-col md:pl-64">
                {/* Top Navbar */}
                <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b dark:border-white/5 border-indigo-100 dark:bg-[#060913]/80 bg-white/80 px-6 backdrop-blur-md transition-colors duration-300">
                    <div className="flex items-center space-x-2 md:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
                            <Brain className="h-4 w-4"/>
                        </div>
                        <span className="font-bold dark:text-white text-lightText text-sm">InterVexa</span>
                    </div>

                    <div className="hidden text-sm font-medium text-textMuted md:block dark:text-textMuted text-lightMuted">
                        Welcome back, <span className="dark:text-white text-lightText font-semibold">{user.name}</span>! Ready for preparation?
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Role badge */}
                        <span className="text-xs font-semibold capitalize text-brandSecondary bg-brandSecondary/10 border border-brandSecondary/20 rounded-full px-3 py-1">
                            {user.role} Portal
                        </span>

                        {/* Dark / Light Mode Toggle */}
                        <button
                            id="theme-toggle-btn"
                            onClick={handleToggle}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className={`
                                relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300
                                ${theme === 'dark'
                                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50 shadow-sm shadow-indigo-500/10'
                                    : 'border-amber-400/30 bg-amber-400/10 text-amber-500 hover:bg-amber-400/20 hover:border-amber-400/50 shadow-sm shadow-amber-400/10'
                                }
                            `}
                        >
                            {theme === 'dark' ? (
                                <Sun className={`h-4 w-4 ${animating ? 'theme-icon-animate' : ''}`} />
                            ) : (
                                <Moon className={`h-4 w-4 ${animating ? 'theme-icon-animate' : ''}`} />
                            )}
                        </button>
                    </div>
                </header>

                {/* Dynamic Paged Content Container */}
                <main className="flex-grow p-6">
                    <div className="mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
export default DashboardLayout;
