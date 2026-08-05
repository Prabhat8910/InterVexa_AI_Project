import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { Brain } from 'lucide-react';
export const DashboardLayout = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div className="flex min-h-screen flex-col items-center justify-center bg-darkBg text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-brandPrimary"></div>
          <Brain className="absolute h-6 w-6 text-brandSecondary animate-pulse"/>
        </div>
        <p className="mt-4 text-sm text-textMuted tracking-wide">Initializing session data...</p>
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    return (<div className="min-h-screen bg-[#060913] text-white">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#060913]/80 px-6 backdrop-blur-md">
          <div className="flex items-center space-x-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
              <Brain className="h-4 w-4"/>
            </div>
            <span className="font-bold text-white text-sm">InterVexa</span>
          </div>
          <div className="hidden text-sm font-medium text-textMuted md:block">
            Welcome back, <span className="text-white font-semibold">{user.name}</span>! Ready for preparation?
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold capitalize text-brandSecondary bg-brandSecondary/10 border border-brandSecondary/20 rounded-full px-3 py-1">
              {user.role} Portal
            </span>
          </div>
        </header>

        {/* Dynamic Paged Content Container */}
        <main className="flex-grow p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>);
};
export default DashboardLayout;
