import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (!user) return;
    if (user.role === 'student') navigate('/dashboard');
    else if (user.role === 'recruiter') navigate('/recruiter');
    else if (user.role === 'university') navigate('/university');
    else if (user.role === 'admin') navigate('/admin');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-darkBg/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
            <Brain className="h-5 w-5" />
          </div>
          <span>
            InterVexa <span className="bg-gradient-to-r from-brandPrimary to-brandSecondary bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        <div className="hidden items-center space-x-8 text-sm font-medium text-gray-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#ecosystem" className="transition hover:text-white">Ecosystem</a>
          <a href="#stats" className="transition hover:text-white">Statistics</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button 
                onClick={handleDashboardRedirect}
                className="flex items-center space-x-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 transition hover:text-white">
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
