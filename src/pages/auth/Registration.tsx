import { useState } from 'react';
import AgeVerification from '../../components/AgeVerification';
import { supabase } from '../../services/api';

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

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_legal_name: formData.fullName,
                        age_verified: true,
                        is_retailer: formData.isRetailer,
                        dob: formData.dob,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
            } else {
                setSuccess('Account created successfully! Please check your email to verify your account.');
            }
        } catch {
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <img src="/path/to/logo.png" alt="Banana Leaf Logo" className="mx-auto w-16" />
                    <h1 className="text-2xl font-bold text-gray-800">Registration</h1>
                    <p className="text-gray-500">Initialize Hub Credentials</p>
                </div>
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
                            />
                            <span className="ml-2 text-sm text-gray-700">I certify that I am 21 years of age or older</span>
                        </label>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create Account
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-6">Proudly serving Ukiah, CA</p>
            </div>

            {!isAgeVerified && <AgeVerification onVerified={() => setIsAgeVerified(true)} />}
        </div>
    );
}