import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const Login = () => {
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState('student');

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await login(data);
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.role !== 'admin' && user.role !== selectedRole) {
                    setError(`This account is registered as a ${user.role}. Please sign in using the ${user.role} tab.`);
                    logout();
                    setIsSubmitting(false);
                    return;
                }
                if (user.role === 'student') navigate('/dashboard');
                else if (user.role === 'recruiter') navigate('/recruiter');
                else if (user.role === 'university') navigate('/university');
                else if (user.role === 'admin') navigate('/admin');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getHeaderInfo = () => {
        switch (selectedRole) {
            case 'recruiter':
                return { title: 'Recruiter Sign In', subtitle: 'Sign in to screen talent & view AI evaluations' };
            case 'university':
                return { title: 'University Sign In', subtitle: 'Sign in to track cohort placement metrics' };
            default:
                return { title: 'Welcome Back', subtitle: 'Sign in to continue your interview prep' };
        }
    };

    const header = getHeaderInfo();

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-16 dark:bg-darkBg bg-lightBg dark:text-white text-lightText transition-colors duration-300">
            <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl pulse-glow">
                {/* Icon + Title */}
                <div className="flex flex-col items-center mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mb-3">
                        <Brain className="h-6 w-6"/>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight dark:text-white text-lightText">{header.title}</h2>
                    <p className="text-sm dark:text-textMuted text-lightMuted mt-1 text-center">{header.subtitle}</p>
                </div>

                {/* Role selector tabs */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-lightMuted mb-2 text-center">
                        Select Your Profile Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {['student', 'recruiter', 'university'].map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className={`rounded-xl border py-2 text-xs font-semibold uppercase tracking-wide transition ${
                                    selectedRole === role
                                        ? 'border-brandPrimary bg-brandPrimary/20 text-brandPrimary shadow-lg'
                                        : 'dark:border-white/10 border-indigo-200 dark:bg-white/5 bg-indigo-50 dark:text-gray-400 text-lightMuted dark:hover:bg-white/10 hover:bg-indigo-100 dark:hover:text-white hover:text-lightText'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-start space-x-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-lightMuted mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 dark:text-gray-500 text-lightMuted"/>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                {...register('email')}
                                className="w-full rounded-xl border dark:border-white/10 border-indigo-200 dark:bg-white/5 bg-indigo-50 py-3 pl-11 pr-4 text-sm dark:text-white text-lightText placeholder-gray-400 outline-none transition focus:border-brandPrimary dark:focus:bg-white/10 focus:bg-white"
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-lightMuted">
                                Password
                            </label>
                            <Link to="/forgot-password" className="text-xs font-semibold text-brandPrimary hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 dark:text-gray-500 text-lightMuted"/>
                            <input
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                className="w-full rounded-xl border dark:border-white/10 border-indigo-200 dark:bg-white/5 bg-indigo-50 py-3 pl-11 pr-4 text-sm dark:text-white text-lightText placeholder-gray-400 outline-none transition focus:border-brandPrimary dark:focus:bg-white/10 focus:bg-white"
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {isSubmitting ? <span>Signing In...</span> : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="h-4 w-4"/>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm dark:text-textMuted text-lightMuted">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-brandPrimary hover:underline">
                        Create one free
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Login;
