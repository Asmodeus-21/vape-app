import { Eye, EyeOff, Loader2, Lock, Mail, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { loginUser, registerWithOtp, requestLoginOtp, requestOtp, verifyLoginOtp } from '../services/api';

interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (user: AuthUser, token: string) => void;
}

type Tab = 'login' | 'register';
type LoginMode = 'password' | 'otp_verify';
type RegStep = 'form' | 'otp';

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
    const [tab, setTab] = useState<Tab>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Login
    const [loginMode, setLoginMode] = useState<LoginMode>('password');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginOtpCode, setLoginOtpCode] = useState('');

    // Register
    const [regStep, setRegStep] = useState<RegStep>('form');
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regDob, setRegDob] = useState('');
    const [regOtpCode, setRegOtpCode] = useState('');
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    const isTwentyOneOrOlder = (dob: string): boolean => {
        if (!dob) return false;
        const birthDate = new Date(dob);
        if (Number.isNaN(birthDate.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }
        return age >= 21;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, token } = await loginUser(loginEmail, loginPassword);
            localStorage.setItem('vapeshub_token', token);
            if (rememberMe) localStorage.setItem('vapeshub_remember_email', loginEmail);
            toast.success(`Welcome back, ${user.name}! 👋`);
            onAuthSuccess(user, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendLoginOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!loginEmail.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setResendCountdown(30);
        try {
            await requestLoginOtp(loginEmail);
            setLoginMode('otp_verify');
            toast.success('Login code sent to your email.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to send login code. Please try again.');
            setResendCountdown(0);
        } finally {
            setLoading(false);
        }
    };

    const handleResendLoginOtp = async () => {
        setError('');
        setLoading(true);
        setResendCountdown(30);
        try {
            await requestLoginOtp(loginEmail);
            toast.success('Login code resent to your email.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to resend login code. Please try again.');
            setResendCountdown(0);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyLoginOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!loginOtpCode.trim() || loginOtpCode.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            const { user, token } = await verifyLoginOtp(loginEmail, loginOtpCode);
            localStorage.setItem('vapeshub_token', token);
            if (rememberMe) localStorage.setItem('vapeshub_remember_email', loginEmail);
            toast.success(`Welcome back, ${user.name}! 👋`);
            onAuthSuccess(user, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRegOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!regName.trim()) {
            setError('Full name is required.');
            return;
        }
        if (!regEmail.trim()) {
            setError('Email address is required.');
            return;
        }
        if (!regPassword || regPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!regDob) {
            setError('Date of birth is required.');
            return;
        }
        if (!isTwentyOneOrOlder(regDob)) {
            setError('You must be 21 years or older to register.');
            return;
        }
        if (!isAgeVerified) {
            setError('Please confirm your age by checking the box.');
            return;
        }

        setLoading(true);
        setResendCountdown(30);
        try {
            await requestOtp(regEmail);
            setRegStep('otp');
            toast.success('Verification code sent to your email.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code. Please try again.');
            setResendCountdown(0);
        } finally {
            setLoading(false);
        }
    };

    const handleResendRegOtp = async () => {
        setError('');
        setLoading(true);
        setResendCountdown(30);
        try {
            await requestOtp(regEmail);
            toast.success('Verification code resent to your email.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification code. Please try again.');
            setResendCountdown(0);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRegOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!regOtpCode.trim() || regOtpCode.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            const { user, token } = await registerWithOtp(
                regEmail,
                regOtpCode,
                regName,
                regPassword,
                false,
                undefined,
                undefined,
                regDob,
                true
            );
            localStorage.setItem('vapeshub_token', token);
            toast.success(`Welcome to Banana Leaf, ${user.name}! 🎉`);
            onAuthSuccess(user, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Countdown timer
    React.useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    const resetForm = () => {
        setError('');
        setLoginEmail('');
        setLoginPassword('');
        setLoginOtpCode('');
        setLoginMode('password');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegDob('');
        setRegOtpCode('');
        setIsAgeVerified(false);
        setRegStep('form');
        setShowPassword(false);
    };

    const handleTabSwitch = (newTab: Tab) => {
        resetForm();
        setTab(newTab);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-black text-white">Banana Leaf</h1>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-2">
                        {(['login', 'register'] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTabSwitch(t)}
                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${tab === t
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-300 hover:text-white'
                                    }`}
                            >
                                {t === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {tab === 'login' && loginMode === 'password' && (
                            <motion.form
                                key="login-password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 border-slate-300 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 text-xs text-slate-600">
                                        Remember me
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Signing in...' : 'Log In'}
                                </button>

                                <div className="flex items-center gap-2 my-3">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-xs text-slate-500">or</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMode('otp_verify');
                                        setError('');
                                    }}
                                    className="w-full py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Sign in with Email Code
                                </button>

                                <p className="text-center text-xs text-slate-500">
                                    <a href="#forgot" className="text-blue-500 hover:underline font-semibold">
                                        Forgot password?
                                    </a>
                                </p>
                            </motion.form>
                        )}

                        {tab === 'login' && loginMode === 'otp_verify' && (
                            <motion.form
                                key="login-otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyLoginOtp}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={loginOtpCode}
                                        onChange={(e) => setLoginOtpCode(e.target.value.slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm tracking-widest"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Check your email for the 6-digit code
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Verifying...' : 'Verify & Log In'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMode('password');
                                        setError('');
                                    }}
                                    className="w-full py-2.5 text-slate-700 font-semibold text-sm hover:text-slate-900"
                                >
                                    ← Back to password login
                                </button>

                                {resendCountdown > 0 ? (
                                    <p className="text-center text-xs text-slate-500 mt-2">
                                        Resend code in {resendCountdown}s
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendLoginOtp}
                                        disabled={loading}
                                        className="w-full text-center text-xs font-semibold text-blue-500 hover:text-blue-600 mt-2"
                                    >
                                        Resend login code
                                    </button>
                                )}
                            </motion.form>
                        )}

                        {tab === 'register' && regStep === 'form' && (
                            <motion.form
                                key="register-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendRegOtp}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={regDob}
                                        onChange={(e) => setRegDob(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <label className="flex items-start gap-2 p-3 border border-blue-100 bg-blue-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={isAgeVerified}
                                        onChange={(e) => setIsAgeVerified(e.target.checked)}
                                        className="w-4 h-4 mt-0.5"
                                        required
                                    />
                                    <span className="text-xs text-slate-700">
                                        I confirm I am of legal age to purchase in my jurisdiction
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </motion.form>
                        )}

                        {tab === 'register' && regStep === 'otp' && (
                            <motion.form
                                key="register-otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyRegOtp}
                                className="space-y-4"
                            >
                                <div className="text-center py-2">
                                    <p className="text-sm font-bold text-slate-900">Verify your email</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        We sent a code to<br />{regEmail}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={regOtpCode}
                                        onChange={(e) => setRegOtpCode(e.target.value.slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm tracking-widest text-center text-lg"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Verifying...' : 'Complete Sign Up'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setRegStep('form');
                                        setError('');
                                    }}
                                    className="w-full py-2.5 text-slate-700 font-semibold text-sm hover:text-slate-900"
                                >
                                    ← Back
                                </button>

                                {resendCountdown > 0 ? (
                                    <p className="text-center text-xs text-slate-500 mt-2">
                                        Resend code in {resendCountdown}s
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendRegOtp}
                                        disabled={loading}
                                        className="w-full text-center text-xs font-semibold text-blue-500 hover:text-blue-600 mt-2"
                                    >
                                        Resend verification code
                                    </button>
                                )}
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
