import { ArrowLeft, FileText, Shield, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import AgePolicy from './AgePolicy';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

interface LegalPagesProps {
    onBack: () => void;
}

type LegalPage = 'menu' | 'terms' | 'privacy' | 'age';

export default function LegalPages({ onBack }: LegalPagesProps) {
    const [currentPage, setCurrentPage] = useState<LegalPage>('menu');

    if (currentPage === 'terms') {
        return <TermsOfService onBack={() => setCurrentPage('menu')} />;
    }

    if (currentPage === 'privacy') {
        return <PrivacyPolicy onBack={() => setCurrentPage('menu')} />;
    }

    if (currentPage === 'age') {
        return <AgePolicy onBack={() => setCurrentPage('menu')} />;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </button>
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-brand-primary" />
                        <h1 className="text-3xl font-bold">Legal & Compliance</h1>
                    </div>
                </div>

                {/* Menu */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <div
                        onClick={() => setCurrentPage('terms')}
                        className="bg-slate-800 rounded-lg p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-8 h-8 text-brand-primary group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-semibold">Terms of Service</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Our terms and conditions for using Banana Leaf Store services, including user responsibilities and service limitations.
                        </p>
                    </div>

                    <div
                        onClick={() => setCurrentPage('privacy')}
                        className="bg-slate-800 rounded-lg p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-semibold">Privacy Policy</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            How we collect, use, and protect your personal information and data privacy rights.
                        </p>
                    </div>

                    <div
                        onClick={() => setCurrentPage('age')}
                        className="bg-slate-800 rounded-lg p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-semibold">Age Policy</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Age verification requirements, health warnings, and compliance with tobacco regulations.
                        </p>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            If you have questions about our policies or need assistance, please contact us:
                        </p>
                        <div className="text-sm text-slate-300 space-y-1">
                            <p>Email: legal@banana-leaf.store</p>
                            <p>Phone: 1-800-VAPE-HUB</p>
                            <p>Hours: Monday-Friday, 9 AM - 6 PM PST</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}