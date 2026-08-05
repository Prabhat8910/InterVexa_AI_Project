import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../lib/api';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
export const ResetPassword = () => {
    const { token } = useParams();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resetPasswordSchema),
    });
    const onSubmit = async (data) => {
        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post(`/auth/reset-password/${token}`, {
                password: data.password,
            });
            setSuccess(true);
        }
        catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="flex min-h-[80vh] items-center justify-center px-4 py-16 bg-darkBg text-white">
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl pulse-glow">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mb-3">
            <Lock className="h-6 w-6"/>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">New Password</h2>
          <p className="text-sm text-textMuted mt-1 text-center">
            Set your new login credentials below.
          </p>
        </div>

        {error && (<div className="mb-6 flex items-start space-x-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0"/>
            <span>{error}</span>
          </div>)}

        {success ? (<div className="space-y-6 text-center">
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-sm text-emerald-400 text-left">
              <CheckCircle2 className="h-5 w-5 shrink-0"/>
              <span>Your password has been successfully reset!</span>
            </div>
            
            <Link to="/login" className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary py-3 text-sm font-semibold text-white transition hover:opacity-90">
              <span>Go to Sign In</span>
              <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>) : (<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
                <input type="password" placeholder="••••••••" {...register('password')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
              </div>
              {errors.password && (<p className="mt-1 text-xs text-red-400">{errors.password.message}</p>)}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
                <input type="password" placeholder="••••••••" {...register('confirmPassword')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
              </div>
              {errors.confirmPassword && (<p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>)}
            </div>

            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {isSubmitting ? (<span>Updating password...</span>) : (<span>Reset Password</span>)}
            </button>
          </form>)}
      </div>
    </div>);
};
export default ResetPassword;
