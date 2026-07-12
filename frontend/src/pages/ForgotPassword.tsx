import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../lib/api';
import { KeyRound, Mail, ArrowLeft, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setDevResetLink(null);

    try {
      const response = await api.post('/auth/forgot-password', data);
      setSuccessMessage(response.data.message || 'Reset link sent successfully!');
      
      // If the backend returns a simulated link in response (dev fallback)
      if (response.data.devResetLink) {
        setDevResetLink(response.data.devResetLink);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send password reset request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16 bg-darkBg text-white">
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl pulse-glow">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-sm text-textMuted mt-1 text-center">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start space-x-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Dev Mode Link Simulator Helper */}
        {devResetLink && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 text-sm text-amber-300">
            <div className="flex items-center space-x-2 mb-2 font-bold font-mono text-xs uppercase tracking-wider text-amber-400">
              <Terminal className="h-4 w-4" />
              <span>Dev Testing Simulator</span>
            </div>
            <p className="text-xs mb-3 text-gray-300">
              Since SMTP credentials might be mock or local, the server returned this simulated link directly:
            </p>
            <a
              href={devResetLink.replace('http://localhost:5173', window.location.origin)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 py-2 px-3 text-xs font-semibold text-white transition tracking-wide text-center"
            >
              Follow Simulated Reset Link
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={!!successMessage}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-brandPrimary focus:bg-white/10 disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Sending request...</span>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-textMuted">
          <Link to="/login" className="inline-flex items-center space-x-2 font-semibold text-brandPrimary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
