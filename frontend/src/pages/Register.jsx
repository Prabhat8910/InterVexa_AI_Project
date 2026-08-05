import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, Mail, User, Building, Landmark, ArrowRight, AlertCircle } from 'lucide-react';
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['student', 'recruiter', 'university']),
    companyName: z.string().optional(),
    universityCode: z.string().optional(),
    universityName: z.string().optional(),
}).refine(data => {
    if (data.role === 'recruiter' && !data.companyName)
        return false;
    if (data.role === 'university' && (!data.universityCode || !data.universityName))
        return false;
    return true;
}, {
    message: "Required context fields missing for selected role",
    path: ["role"]
});
export const Register = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState('student');
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'student' }
    });
    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setValue('role', role);
    };
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await registerUser(data);
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.role === 'student')
                    navigate('/dashboard');
                else if (user.role === 'recruiter')
                    navigate('/recruiter');
                else if (user.role === 'university')
                    navigate('/university');
                else if (user.role === 'admin')
                    navigate('/admin');
            }
        }
        catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="flex min-h-[90vh] items-center justify-center px-4 py-16 bg-darkBg text-white">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-8 shadow-2xl pulse-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mb-3">
            <Brain className="h-6 w-6"/>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Your Account</h2>
          <p className="text-sm text-textMuted mt-1">Accelerate placement preparation with Voice AI</p>
        </div>

        {error && (<div className="mb-6 flex items-start space-x-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Select Your Profile Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['student', 'recruiter', 'university'].map(role => (<button key={role} type="button" onClick={() => handleRoleChange(role)} className={`rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wide transition ${selectedRole === role
                ? 'border-brandPrimary bg-brandPrimary/20 text-white shadow-lg'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {role}
                </button>))}
            </div>
            {errors.role && (<p className="mt-1 text-xs text-red-400">{errors.role.message}</p>)}
          </div>

          {/* Standard Fields */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
              <input type="text" placeholder="Prabhat" {...register('name')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
            </div>
            {errors.name && (<p className="mt-1 text-xs text-red-400">{errors.name.message}</p>)}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
              <input type="email" placeholder="you@example.com" {...register('email')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
            </div>
            {errors.email && (<p className="mt-1 text-xs text-red-400">{errors.email.message}</p>)}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
              <input type="password" placeholder="Min 6 characters" {...register('password')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
            </div>
            {errors.password && (<p className="mt-1 text-xs text-red-400">{errors.password.message}</p>)}
          </div>

          {/* Conditional Role-Specific Fields */}
          {selectedRole === 'student' && (<div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                University Code (Optional)
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
                <input type="text" placeholder="e.g. DIT123 (Enter to join college cohort)" {...register('universityCode')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
              </div>
              {errors.universityCode && (<p className="mt-1 text-xs text-red-400">{errors.universityCode.message}</p>)}
            </div>)}

          {selectedRole === 'recruiter' && (<div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
                <input type="text" placeholder="e.g. Google India" {...register('companyName')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
              </div>
              {errors.companyName && (<p className="mt-1 text-xs text-red-400">{errors.companyName.message}</p>)}
            </div>)}

          {selectedRole === 'university' && (<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  University Name
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"/>
                  <input type="text" placeholder="State University" {...register('universityName')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  University Code
                </label>
                <input type="text" placeholder="e.g. STATEU123" {...register('universityCode')} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white outline-none transition focus:border-brandPrimary focus:bg-white/10"/>
              </div>
            </div>)}

          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? (<span>Creating Account...</span>) : (<>
                <span>Sign Up</span>
                <ArrowRight className="h-4 w-4"/>
              </>)}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-textMuted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brandPrimary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>);
};
export default Register;
