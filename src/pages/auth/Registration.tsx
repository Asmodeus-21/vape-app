import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { registerWithOtp, requestOtp } from '../services/api';

interface FormData {
    fullName: string;
    email: string;
    password: string;
    dob: string;
}

export default function Registration() {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        password: '',
        dob: '',
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.fullName.trim()) {
            setError('Full name is required.');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email address is required.');
            return;
        }
        if (!formData.password || formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!formData.dob) {
            setError('Date of birth is required.');
            return;
        }
        if (!isTwentyOneOrOlder(formData.dob)) {
            setError('You must be 21 years or older to register.');
            return;
        }
        if (!isAgeVerified) {
            setError('Please confirm your age by checking the box.');
            return;
        }

        setIsSubmitting(true);
        setResendCountdown(60);
        try {
            const otpRes = await requestOtp(formData.email);
            if (!otpRes.success) {
                setError(otpRes.error || 'Failed to send verification code.');
                setResendCountdown(0);
                return;
            }
            setShowOtpVerification(true);
            toast.success('Verification code sent to your email.', { duration: 4000 });
        } catch {
            setError('An unexpected error occurred. Please try again later.');
            setResendCountdown(0);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!otp.trim() || otp.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { user, token } = await registerWithOtp(
                formData.email,
                otp,
                formData.fullName,
                formData.password,
                false,
                undefined,
                undefined,
                formData.dob,
                true
            );

            localStorage.setItem('vapeshub_token', token);
            toast.success('Account created successfully! You can now log in. 🎉');
            // Redirect to login or dashboard
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Countdown timer
    React.useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8">
                    <h1 className="text-2xl font-black text-white mb-2">Banana Leaf Store</h1>
                    <p className="text-sm text-slate-300">
                        {showOtpVerification ? 'Verify your email' : 'Create your account'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    {!showOtpVerification ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                        disabled={isSubmitting}
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
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <label className="flex items-start gap-2 p-3 border border-blue-100 bg-blue-50 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAgeVerified}
                                    onChange={(e) => setIsAgeVerified(e.target.checked)}
                                    className="w-4 h-4 mt-0.5"
                                    disabled={isSubmitting}
                                    required
                                />
                                <span className="text-xs text-slate-700">
                                    I confirm I am of legal age to purchase in my jurisdiction
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isSubmitting ? 'Creating account...' : 'Create Account'}
                            </button>

                            <p className="text-center text-xs text-slate-600">
                                Already have an account?{' '}
                                <a href="/login" className="text-blue-500 hover:underline font-semibold">
                                    Log in
                                </a>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="text-center py-2">
                                <p className="text-sm font-bold text-slate-900">Verify your email</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    We sent a 6-digit code to<br />
                                    <span className="font-semibold text-slate-700">{formData.email}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm tracking-widest text-center text-lg font-semibold"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isSubmitting ? 'Verifying...' : 'Complete Sign Up'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowOtpVerification(false);
                                    setOtp('');
                                    setError('');
                                }}
                                className="w-full py-2.5 text-slate-700 font-semibold text-sm hover:text-slate-900 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                ← Back to registration
                            </button>

                            {resendCountdown > 0 && (
                                <p className="text-center text-xs text-slate-500">
                                    Resend code in {resendCountdown}s
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
