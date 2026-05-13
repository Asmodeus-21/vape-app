import { useState } from 'react';
import AgeVerification from '../../components/AgeVerification';

export default function Registration() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        dob: '',
        isRetailer: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isTwentyOneOrOlder(formData.dob)) {
            setError('You must be 21 years of age or older to register.');
            return;
        }

        if (!isAgeVerified) {
            setError('Please complete age verification before registering.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Request OTP code
            const otpRes = await requestOtp(formData.email);
            if (!otpRes.success) {
                setError(otpRes.error || 'Failed to send OTP');
                return;
            }

            // Show OTP verification step
            setShowOtpVerification(true);
            setSuccess('OTP sent to your email. Please check your inbox.');
        } catch {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp.trim()) {
            setError('Please enter the OTP code');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await registerWithOtp(
                formData.email,
                otp,
                {
                    fullName: formData.fullName,
                    isRetailer: formData.isRetailer,
                    dob: formData.dob,
                    ageVerified: true,
                }
            );

            if (!res.success) {
                setError(res.error || 'Failed to register');
                return;
            }

            setSuccess('Account created successfully! You can now log in.');
            // Reset form and hide OTP verification
            setFormData({
                fullName: '',
                email: '',
                password: '',
                dob: '',
                isRetailer: false,
            });
            setOtp('');
            setShowOtpVerification(false);
            setIsAgeVerified(false);
        } catch {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <img src="/path/to/logo.png" alt="Banana Leaf Logo" className="mx-auto w-16" />
                    <h1 className="text-2xl font-bold text-gray-800">{showOtpVerification ? 'Verify Email' : 'Registration'}</h1>
                    <p className="text-gray-500">{showOtpVerification ? 'Enter the code sent to your email' : 'Initialize Hub Credentials'}</p>
                </div>

                {!showOtpVerification ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Legal Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                minLength={8}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input
                                type="date"
                                id="dob"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isRetailer"
                                    checked={formData.isRetailer}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    disabled={isSubmitting}
                                />
                                <span className="ml-2 text-sm text-gray-700">Retailer Authorization (Enroll in Retailer OS Ecosystem)</span>
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    disabled={isSubmitting}
                                />
                                <span className="ml-2 text-sm text-gray-700">I certify that I am 21 years of age or older</span>
                            </label>
                        </div>

                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="mb-4">
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowOtpVerification(false);
                                setOtp('');
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full mt-2 bg-gray-300 text-gray-700 py-2 px-4 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none"
                            disabled={isSubmitting}
                        >
                            Back
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">Proudly serving Ukiah, CA</p>
            </div>

            {!isAgeVerified && <AgeVerification onVerified={() => setIsAgeVerified(true)} />}
        </div>
    );
}