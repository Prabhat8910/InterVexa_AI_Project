import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
    User, Lock, Bell, Trash2, Camera, CheckCircle, AlertCircle,
    Eye, EyeOff, Loader2, Save, ShieldAlert, Upload
} from 'lucide-react';

// ─── Small reusable helpers ───────────────────────────────────────────────────

const Toast = ({ toast }) => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4 ${
            isSuccess
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
            {isSuccess ? <CheckCircle className="h-5 w-5 flex-shrink-0"/> : <AlertCircle className="h-5 w-5 flex-shrink-0"/>}
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
    );
};

const SectionCard = ({ children, className = '' }) => (
    <div className={`rounded-2xl border dark:border-white/10 border-indigo-100 dark:bg-white/5 bg-white p-6 backdrop-blur shadow-sm transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, disabled, hint, rightSlot }) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium dark:text-gray-300 text-lightMuted">{label}</label>
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-xl border dark:border-white/10 border-indigo-200 dark:bg-white/5 bg-indigo-50/50 px-4 py-2.5 text-sm dark:text-white text-lightText placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
            {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
        </div>
        {hint && <p className="text-xs dark:text-textMuted text-lightMuted">{hint}</p>}
    </div>
);

const Toggle = ({ id, checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
            <p className="text-sm font-medium dark:text-white text-lightText">{label}</p>
            {description && <p className="text-xs dark:text-textMuted text-lightMuted mt-0.5">{description}</p>}
        </div>
        <button
            id={id}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:ring-offset-2 dark:focus:ring-offset-[#0b0f19] ${
                checked ? 'bg-brandPrimary' : 'dark:bg-white/10 bg-gray-300'
            }`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}/>
        </button>
    </div>
);

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'security',      label: 'Security',      icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger',        label: 'Danger Zone',   icon: Trash2 },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const Settings = () => {
    const { user, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Profile tab state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    // Avatar state
    const fileRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarSaving, setAvatarSaving] = useState(false);

    // Security tab state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent]         = useState(false);
    const [showNew, setShowNew]                 = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [passwordSaving, setPasswordSaving]   = useState(false);

    // Notification tab state
    const [notifs, setNotifs] = useState({
        interviewReminders: true,
        reportReady: true,
        weeklyDigest: false,
        placementUpdates: true,
    });
    const [notifSaving, setNotifSaving] = useState(false);

    // Danger zone state
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch settings on mount ──
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                const u = data.user;
                setName(u.name || '');
                setEmail(u.email || '');
                setAvatarPreview(u.avatarUrl || null);
                if (u.notifications) {
                    setNotifs({
                        interviewReminders: u.notifications.interviewReminders ?? true,
                        reportReady:        u.notifications.reportReady        ?? true,
                        weeklyDigest:       u.notifications.weeklyDigest       ?? false,
                        placementUpdates:   u.notifications.placementUpdates   ?? true,
                    });
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // ── Toast helper ──
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Avatar handling ──
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5 MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleAvatarUpload = async () => {
        if (!avatarPreview || avatarPreview === user?.avatarUrl) {
            showToast('Please select a new image first.', 'error');
            return;
        }
        setAvatarSaving(true);
        try {
            const { data } = await api.post('/settings/avatar', { imageData: avatarPreview });
            updateUser({ avatarUrl: data.avatarUrl });
            setAvatarPreview(data.avatarUrl);
            showToast(data.message);
        } catch (err) {
            showToast(err?.response?.data?.message || 'Avatar upload failed.', 'error');
        } finally {
            setAvatarSaving(false);
        }
    };

    // ── Profile save ──
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const { data } = await api.patch('/settings/profile', { name, email });
            updateUser({ name: data.user.name, email: data.user.email });
            showToast('Profile updated successfully!');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setProfileSaving(false);
        }
    };

    // ── Password save ──
    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        setPasswordSaving(true);
        try {
            await api.patch('/settings/password', { currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast('Password changed successfully!');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to change password.', 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    // ── Notification save ──
    const handleNotifSave = async () => {
        setNotifSaving(true);
        try {
            await api.patch('/settings/notifications', notifs);
            showToast('Notification preferences saved!');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save preferences.', 'error');
        } finally {
            setNotifSaving(false);
        }
    };

    // ── Delete account ──
    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await api.delete('/settings/account', { data: { password: deletePassword } });
            showToast('Account deleted. Goodbye!');
            setTimeout(() => logout(), 1500);
        } catch (err) {
            showToast(err?.response?.data?.message || 'Deletion failed. Check your password.', 'error');
            setDeleting(false);
        }
    };

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-48 rounded-xl dark:bg-white/5 bg-indigo-100"/>
                <div className="h-[400px] rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-indigo-100"/>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold dark:text-white text-lightText">Account Settings</h1>
                <p className="mt-1 text-sm dark:text-textMuted text-lightMuted">Manage your profile, security, and preferences.</p>
            </div>

            {/* Tab bar */}
            <div className="flex space-x-1 rounded-2xl border dark:border-white/10 border-indigo-100 dark:bg-white/5 bg-white p-1.5 shadow-sm">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        id={`settings-tab-${id}`}
                        onClick={() => setActiveTab(id)}
                        className={`flex flex-1 items-center justify-center space-x-2 rounded-xl py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                            activeTab === id
                                ? id === 'danger'
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm'
                                    : 'bg-gradient-to-r from-brandPrimary/20 to-brandSecondary/10 dark:text-white text-brandPrimary border border-brandPrimary/30 shadow-sm'
                                : 'dark:text-gray-400 text-lightMuted hover:dark:text-white hover:text-lightText'
                        }`}
                    >
                        <Icon className="h-4 w-4 flex-shrink-0"/>
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {/* Avatar card */}
                    <SectionCard>
                        <h2 className="text-lg font-bold dark:text-white text-lightText mb-5">Profile Picture</h2>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar preview */}
                            <div className="relative flex-shrink-0">
                                <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-brandPrimary/20 shadow-xl">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover"/>
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-brandPrimary to-brandSecondary flex items-center justify-center text-3xl font-bold text-white uppercase">
                                            {name.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    id="avatar-pick-btn"
                                    onClick={() => fileRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 rounded-full bg-brandPrimary p-2 text-white shadow-lg hover:bg-brandPrimary/80 transition"
                                    title="Choose image"
                                >
                                    <Camera className="h-3.5 w-3.5"/>
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="avatar-file-input"
                                />
                            </div>

                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                <div>
                                    <p className="text-sm font-medium dark:text-white text-lightText">Upload a new avatar</p>
                                    <p className="text-xs dark:text-textMuted text-lightMuted mt-1">JPG, PNG or WebP — max 5 MB. Square images work best.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        id="avatar-upload-btn"
                                        onClick={handleAvatarUpload}
                                        disabled={avatarSaving}
                                        className="flex items-center justify-center space-x-2 rounded-xl bg-brandPrimary px-4 py-2 text-sm font-semibold text-white shadow shadow-brandPrimary/25 hover:bg-brandPrimary/80 disabled:opacity-60 transition"
                                    >
                                        {avatarSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                                        <span>{avatarSaving ? 'Uploading…' : 'Save Photo'}</span>
                                    </button>
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        className="rounded-xl border dark:border-white/10 border-indigo-200 px-4 py-2 text-sm font-medium dark:text-gray-300 text-lightMuted dark:hover:bg-white/5 hover:bg-indigo-50 transition"
                                    >
                                        Choose File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Profile info card */}
                    <SectionCard>
                        <h2 className="text-lg font-bold dark:text-white text-lightText mb-5">Personal Information</h2>
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <InputField
                                label="Full Name"
                                id="settings-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your full name"
                            />
                            <InputField
                                label="Email Address"
                                id="settings-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                hint="Changing your email will require re-login on next session."
                            />
                            <div className="pt-2 flex justify-end">
                                <button
                                    id="profile-save-btn"
                                    type="submit"
                                    disabled={profileSaving}
                                    className="flex items-center space-x-2 rounded-xl bg-brandPrimary px-5 py-2.5 text-sm font-semibold text-white shadow shadow-brandPrimary/25 hover:bg-brandPrimary/80 disabled:opacity-60 transition"
                                >
                                    {profileSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                    <span>{profileSaving ? 'Saving…' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </SectionCard>
                </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
                <SectionCard>
                    <h2 className="text-lg font-bold dark:text-white text-lightText mb-1">Change Password</h2>
                    <p className="text-sm dark:text-textMuted text-lightMuted mb-5">Use a strong password with at least 6 characters.</p>
                    <form onSubmit={handlePasswordSave} className="space-y-4">
                        <InputField
                            label="Current Password"
                            id="settings-current-pw"
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Your current password"
                            rightSlot={
                                <button type="button" onClick={() => setShowCurrent(v => !v)} className="dark:text-textMuted text-lightMuted hover:text-brandPrimary transition">
                                    {showCurrent ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            }
                        />
                        <InputField
                            label="New Password"
                            id="settings-new-pw"
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            rightSlot={
                                <button type="button" onClick={() => setShowNew(v => !v)} className="dark:text-textMuted text-lightMuted hover:text-brandPrimary transition">
                                    {showNew ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            }
                        />
                        <InputField
                            label="Confirm New Password"
                            id="settings-confirm-pw"
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            rightSlot={
                                <button type="button" onClick={() => setShowConfirm(v => !v)} className="dark:text-textMuted text-lightMuted hover:text-brandPrimary transition">
                                    {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            }
                        />

                        {/* Strength indicator */}
                        {newPassword && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(lvl => {
                                        const strength = Math.min(4, Math.floor(newPassword.length / 3));
                                        return (
                                            <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                lvl <= strength
                                                    ? strength <= 1 ? 'bg-red-400'
                                                    : strength <= 2 ? 'bg-amber-400'
                                                    : strength <= 3 ? 'bg-yellow-400'
                                                    : 'bg-emerald-400'
                                                    : 'dark:bg-white/10 bg-gray-200'
                                            }`}/>
                                        );
                                    })}
                                </div>
                                <p className="text-xs dark:text-textMuted text-lightMuted">
                                    {newPassword.length < 6 ? 'Too short' : newPassword.length < 9 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
                                </p>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <button
                                id="password-save-btn"
                                type="submit"
                                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                                className="flex items-center space-x-2 rounded-xl bg-brandPrimary px-5 py-2.5 text-sm font-semibold text-white shadow shadow-brandPrimary/25 hover:bg-brandPrimary/80 disabled:opacity-60 transition"
                            >
                                {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Lock className="h-4 w-4"/>}
                                <span>{passwordSaving ? 'Updating…' : 'Update Password'}</span>
                            </button>
                        </div>
                    </form>
                </SectionCard>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
                <SectionCard>
                    <h2 className="text-lg font-bold dark:text-white text-lightText mb-1">Notification Preferences</h2>
                    <p className="text-sm dark:text-textMuted text-lightMuted mb-5">Choose which alerts you want to receive from InterVexa.</p>

                    <div className="divide-y dark:divide-white/5 divide-indigo-100">
                        <Toggle
                            id="notif-interview-reminders"
                            checked={notifs.interviewReminders}
                            onChange={v => setNotifs(p => ({ ...p, interviewReminders: v }))}
                            label="Interview Reminders"
                            description="Get reminded before your scheduled mock sessions."
                        />
                        <Toggle
                            id="notif-report-ready"
                            checked={notifs.reportReady}
                            onChange={v => setNotifs(p => ({ ...p, reportReady: v }))}
                            label="Report Ready"
                            description="Be notified when your AI evaluation report is available."
                        />
                        <Toggle
                            id="notif-placement-updates"
                            checked={notifs.placementUpdates}
                            onChange={v => setNotifs(p => ({ ...p, placementUpdates: v }))}
                            label="Placement Updates"
                            description="Receive updates on placement drives and opportunities."
                        />
                        <Toggle
                            id="notif-weekly-digest"
                            checked={notifs.weeklyDigest}
                            onChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))}
                            label="Weekly Progress Digest"
                            description="A weekly summary of your preparation progress and goals."
                        />
                    </div>

                    <div className="pt-5 flex justify-end">
                        <button
                            id="notif-save-btn"
                            onClick={handleNotifSave}
                            disabled={notifSaving}
                            className="flex items-center space-x-2 rounded-xl bg-brandPrimary px-5 py-2.5 text-sm font-semibold text-white shadow shadow-brandPrimary/25 hover:bg-brandPrimary/80 disabled:opacity-60 transition"
                        >
                            {notifSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                            <span>{notifSaving ? 'Saving…' : 'Save Preferences'}</span>
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ── DANGER ZONE TAB ── */}
            {activeTab === 'danger' && (
                <SectionCard className="border-red-500/20 dark:bg-red-500/5">
                    <div className="flex items-start space-x-4 mb-6">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                            <ShieldAlert className="h-6 w-6 text-red-400"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
                            <p className="text-sm dark:text-textMuted text-lightMuted mt-1">
                                These actions are permanent and <strong className="text-red-400">cannot be undone</strong>. Please proceed with extreme caution.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-500/20 dark:bg-red-500/5 bg-red-50 p-5">
                        <h3 className="text-sm font-semibold text-red-400 mb-1">Delete Account</h3>
                        <p className="text-xs dark:text-gray-400 text-gray-500 mb-4">
                            Permanently deletes your account, all interview sessions, resume analysis data, and career roadmaps. This action is irreversible.
                        </p>
                        <button
                            id="delete-account-open-btn"
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center space-x-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
                        >
                            <Trash2 className="h-4 w-4"/>
                            <span>Delete My Account</span>
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ── DELETE CONFIRMATION MODAL ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 dark:bg-black/70 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}/>

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/30 dark:bg-[#0d0f1d] bg-white p-6 shadow-2xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                                <ShieldAlert className="h-5 w-5 text-red-400"/>
                            </div>
                            <div>
                                <h3 className="font-bold dark:text-white text-lightText">Confirm Account Deletion</h3>
                                <p className="text-xs text-red-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-sm dark:text-gray-300 text-lightMuted mb-5">
                            Enter your password to permanently delete your account and all associated data.
                        </p>

                        <InputField
                            label="Your Password"
                            id="delete-confirm-password"
                            type="password"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            placeholder="Confirm with your password"
                        />

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                                className="flex-1 rounded-xl border dark:border-white/10 border-indigo-200 py-2.5 text-sm font-medium dark:text-gray-300 text-lightMuted dark:hover:bg-white/5 hover:bg-indigo-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                id="delete-account-confirm-btn"
                                onClick={handleDeleteAccount}
                                disabled={deleting || !deletePassword}
                                className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                <span>{deleting ? 'Deleting…' : 'Delete Forever'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            <Toast toast={toast}/>
        </div>
    );
};

export default Settings;
