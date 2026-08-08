import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Layout wraps
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
// View Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CareerAdvisor from './pages/CareerAdvisor';
import PlacementAnalytics from './pages/PlacementAnalytics';
import ReportDetail from './pages/ReportDetail';
import UniversityDashboard from './pages/UniversityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveInterviewRoom from './pages/LiveInterviewRoom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
const queryClient = new QueryClient();
const App = () => {
    return (<QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Landing Pages */}
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Landing />}/>
            </Route>

            {/* Public Guest Sign-In Page */}
            <Route path="/login" element={<Login />}/>
            <Route path="/register" element={<Register />}/>
            <Route path="/forgot-password" element={<ForgotPassword />}/>
            <Route path="/reset-password/:token" element={<ResetPassword />}/>

            {/* Authenticated Dashboard Pages */}
            <Route element={<DashboardLayout />}>
              {/* Student Role Routes */}
              <Route path="/dashboard" element={<StudentDashboard />}/>
              <Route path="/interview" element={<InterviewRoom />}/>
              <Route path="/resume" element={<ResumeAnalyzer />}/>
              <Route path="/career" element={<CareerAdvisor />}/>
              <Route path="/analytics" element={<PlacementAnalytics />}/>
              <Route path="/live-interview" element={<LiveInterviewRoom />}/>
              
              {/* Evaluation Report Detail (All Roles with Auth) */}
              <Route path="/report/:id" element={<ReportDetail />}/>

              {/* University Role Routes */}
              <Route path="/university" element={<UniversityDashboard />}/>

              {/* System Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />}/>
              <Route path="/admin/logs" element={<AdminDashboard />}/>
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace/>}/>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>);
};
export default App;
