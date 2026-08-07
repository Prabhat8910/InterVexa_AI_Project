import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Brain, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [animating, setAnimating] = useState(false);

    const handleDashboardRedirect = () => {
        if (!user) return;
        if (user.role === 'student') navigate('/dashboard');
        else if (user.role === 'recruiter') navigate('/recruiter');
        else if (user.role === 'university') navigate('/university');
        else if (user.role === 'admin') navigate('/admin');
    };

    const handleToggle = () => {
        setAnimating(true);
        toggleTheme();
        setTimeout(() => setAnimating(false), 400);
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b dark:border-white/10 border-indigo-100 dark:bg-darkBg/60 bg-white/80 backdrop-blur-md transition-colors duration-300">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight dark:text-white text-lightText">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
                        <Brain className="h-5 w-5"/>
                    </div>
                    <span>
                        InterVexa <span className="bg-gradient-to-r from-brandPrimary to-brandSecondary bg-clip-text text-transparent">AI</span>
                    </span>
                </Link>

                {/* Nav links */}
                <div className="hidden items-center space-x-8 text-sm font-medium dark:text-gray-300 text-lightMuted md:flex">
                    <a href="#features" className="transition dark:hover:text-white hover:text-lightText">Features</a>
                    <a href="#ecosystem" className="transition dark:hover:text-white hover:text-lightText">Ecosystem</a>
                    <a href="#stats" className="transition dark:hover:text-white hover:text-lightText">Statistics</a>
                    <a href="#faq" className="transition dark:hover:text-white hover:text-lightText">FAQ</a>
                </div>

                {/* Right side actions */}
                <div className="flex items-center space-x-3">
                    {/* Theme Toggle */}
                    <button
                        id="navbar-theme-toggle"
                        onClick={handleToggle}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className={`
                            flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300
                            ${theme === 'dark'
                                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50'
                                : 'border-amber-400/30 bg-amber-400/10 text-amber-500 hover:bg-amber-400/20 hover:border-amber-400/50'
                            }
                        `}
                    >
                        {theme === 'dark' ? (
                            <Sun className={`h-4 w-4 ${animating ? 'theme-icon-animate' : ''}`} />
                        ) : (
                            <Moon className={`h-4 w-4 ${animating ? 'theme-icon-animate' : ''}`} />
                        )}
                    </button>

                    {user ? (
                        <>
                            <button
                                onClick={handleDashboardRedirect}
                                className="flex items-center space-x-2 rounded-xl dark:bg-white/5 bg-indigo-50 dark:border-white/10 border-indigo-200 border px-4 py-2 text-sm font-medium dark:text-white text-lightText transition dark:hover:bg-white/10 hover:bg-indigo-100"
                            >
                                <LayoutDashboard className="h-4 w-4"/>
                                <span>Dashboard</span>
                            </button>
                            <button
                                onClick={logout}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border dark:border-white/10 border-indigo-200 dark:bg-white/5 bg-indigo-50 dark:text-gray-300 text-lightMuted transition hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                            >
                                <LogOut className="h-4 w-4"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium dark:text-gray-300 text-lightMuted transition dark:hover:text-white hover:text-lightText"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-brandPrimary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brandPrimary/20 transition hover:bg-brandPrimary/80"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
export default Navbar;
