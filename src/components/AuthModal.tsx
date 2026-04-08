import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MapPin, RefreshCw, ShoppingBag, User, X, Zap } from 'lucide-react';
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

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
    const [tab, setTab] = useState<Tab>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loginMode, setLoginMode] = useState<'password' | 'otp_request' | 'otp_verify'>('password');
    const [loginOtpCode, setLoginOtpCode] = useState('');
    const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
    const [regOtpCode, setRegOtpCode] = useState('');

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [isVendor, setIsVendor] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, token } = await loginUser(loginEmail, loginPassword);
            localStorage.setItem('vapeshub_token', token);
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
        setLoading(true);
        try {
            await requestLoginOtp(loginEmail);
            setLoginMode('otp_verify');
            toast.success('Login code sent. Check your email.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to send login code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyLoginOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!loginOtpCode.trim() || loginOtpCode.length !== 6) {
            setError('Enter the 6-digit login code from your email.');
            return;
        }
        setLoading(true);
        try {
            const { user, token } = await verifyLoginOtp(loginEmail, loginOtpCode);
            localStorage.setItem('vapeshub_token', token);
            toast.success(`Welcome back, ${user.name}! 👋`);
            onAuthSuccess(user, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (isVendor && !storeName.trim()) { setError('Store name is required for franchise onboarding.'); return; }
        setLoading(true);
        try {
            await requestOtp(regEmail);
            setRegStep('otp');
            toast.success('Verification code sent! Check your inbox.', { duration: 4000 });
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!regOtpCode.trim() || regOtpCode.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
        setLoading(true);
        try {
            const { user, token } = await registerWithOtp(regEmail, regOtpCode, regName, regPassword, isVendor, storeName, storeAddress);
            localStorage.setItem('vapeshub_token', token);
            toast.success(`Welcome to BananaLeaf, ${user.name}! 🎉`);
            onAuthSuccess(user, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden relative border border-white/20"
            >
                {/* Header */}
                <div className="bg-slate-900 px-10 pt-10 pb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-brand-primary/20 rotate-3">
                            <Zap className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter uppercase italic">BananaLeaf<span className="text-brand-primary">.</span></span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                        {tab === 'login' ? 'Authentication' : 'Registration'}
                    </h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                        {tab === 'login' ? 'Authorized Access Required' : 'Initialize Hub Credentials'}
                    </p>

                    {/* Tab Switcher */}
                    <div className="flex mt-8 bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                        {(['login', 'register'] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(''); setLoginMode('password'); setLoginOtpCode(''); setRegStep('form'); setRegOtpCode(''); }}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${tab === t ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'
                                    }`}
                            >
                                {t === 'login' ? 'Auth Link' : 'New Entry'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {tab === 'login' && loginMode === 'password' ? (
                            <motion.form
                                key="login-password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Email Protocol</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="ID_VERIFIED@HUB.COM"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Access Key</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-3 mt-8 active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Decrypting...' : 'Initialize Session'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode('otp_request'); setError(''); setLoginOtpCode(''); }}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Mail className="w-3 h-3" /> Sign In With Email OTP
                                </button>
                            </motion.form>
                        ) : tab === 'login' && loginMode === 'otp_request' ? (
                            <motion.form
                                key="login-otp-request"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendLoginOtp}
                                className="space-y-6"
                            >
                                <div className="text-center py-2">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-7 h-7 text-brand-primary" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Passwordless Login</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Email Protocol</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="ID_VERIFIED@HUB.COM"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-3 active:scale-95">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {loading ? 'Sending Code...' : 'Send Login Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode('password'); setError(''); }}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" /> Use Password Instead
                                </button>
                            </motion.form>
                        ) : tab === 'login' && loginMode === 'otp_verify' ? (
                            <motion.form
                                key="login-otp-verify"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyLoginOtp}
                                className="space-y-6"
                            >
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-7 h-7 text-brand-primary" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Login code sent to</p>
                                    <p className="font-black text-slate-900 text-sm mt-1">{loginEmail}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Login Code</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            value={loginOtpCode}
                                            onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-2xl font-black tracking-[0.5em] text-center placeholder:text-slate-300 placeholder:tracking-[0.3em]"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading || loginOtpCode.length !== 6} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode('otp_request'); setLoginOtpCode(''); setError(''); }}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" /> Change Email / Resend
                                </button>
                            </motion.form>
                        ) : regStep === 'form' ? (
                            <motion.form
                                key="register-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOtp}
                                className="space-y-4"
                            >
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Identity Descriptor</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                            <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="FULL_LEGAL_NAME" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Email Protocol</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                            <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="ID_VERIFIED@HUB.COM" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Access Key</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                            <input type={showPassword ? 'text' : 'password'} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="MIN_8_CHARS" className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-4 mt-6 mb-2 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-brand-primary transition-all">
                                        <input type="checkbox" checked={isVendor} onChange={(e) => { const checked = e.target.checked; setIsVendor(checked); if (!checked) { setStoreName(''); setStoreAddress(''); } }} className="w-5 h-5 text-brand-primary rounded-lg border-slate-300 focus:ring-brand-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Retailer Authorization</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enroll in Retailer OS ecosystem</span>
                                        </div>
                                    </label>
                                    {isVendor && (
                                        <div className="space-y-5 mt-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Store Name</label>
                                                <div className="relative group">
                                                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                                    <input type="text" required={isVendor} value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="DOWNTOWN FRANCHISE" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Store Address</label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                                    <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="123 MAIN ST, CITY" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm font-bold placeholder:text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-3 mt-8 active:scale-95">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                                </button>
                                <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-widest pt-4">
                                    By joining, you adhere to the <span className="text-slate-900">Hub Compliance Standards</span>.
                                </p>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="otp-verify"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-6"
                            >
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-7 h-7 text-brand-primary" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Code sent to</p>
                                    <p className="font-black text-slate-900 text-sm mt-1">{regEmail}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Verification Code</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            value={regOtpCode}
                                            onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all text-2xl font-black tracking-[0.5em] text-center placeholder:text-slate-300 placeholder:tracking-[0.3em]"
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-2">Code expires in 10 minutes</p>
                                </div>
                                <button type="submit" disabled={loading || regOtpCode.length !== 6} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRegStep('form'); setRegOtpCode(''); setError(''); }}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" /> Change Email / Resend
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
