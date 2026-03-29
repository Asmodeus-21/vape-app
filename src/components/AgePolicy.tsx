import { AlertTriangle, ArrowLeft, Shield, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalPageProps {
    onBack: () => void;
}

export default function AgePolicy({ onBack }: LegalPageProps) {
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
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-500" />
                        <h1 className="text-3xl font-bold">Age Verification Policy</h1>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 rounded-lg p-8 space-y-6"
                >
                    <div className="text-sm text-slate-400 mb-6">
                        Last updated: {new Date().toLocaleDateString()}
                    </div>

                    {/* Warning Banner */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3 text-red-400 mb-2">
                            <AlertTriangle className="w-6 h-6" />
                            <span className="font-semibold text-lg">Age Restricted Content</span>
                        </div>
                        <p className="text-red-300">
                            This website contains tobacco and vaping products. You must be 21 years or older to access this site.
                        </p>
                    </div>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-primary" />
                            Age Requirements
                        </h2>
                        <div className="space-y-3 text-slate-300">
                            <p><strong>Minimum Age:</strong> You must be at least 21 years old to purchase or access tobacco and vaping products.</p>
                            <p><strong>Legal Compliance:</strong> This requirement complies with federal and state laws regarding the sale of tobacco products.</p>
                            <p><strong>International Users:</strong> Users outside the United States must comply with their local age restrictions for tobacco products.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Verification Process</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            To ensure compliance with age restrictions, we require verification of age before allowing access to our products and services:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Self-certification of age during account registration</li>
                            <li>Age verification questions</li>
                            <li>Document verification for high-value orders (if required)</li>
                            <li>IP-based age verification (where available)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Prohibited Activities</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            The following activities are strictly prohibited and may result in account suspension or legal action:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Purchasing tobacco products for minors</li>
                            <li>Sharing account credentials with minors</li>
                            <li>Attempting to circumvent age verification systems</li>
                            <li>Providing false age information</li>
                            <li>Assisting minors in accessing restricted content</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Health and Safety Warnings</h2>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <h3 className="text-yellow-400 font-semibold mb-2">Surgeon General Warning</h3>
                            <p className="text-yellow-300 text-sm leading-relaxed">
                                Tobacco products are addictive and can cause cancer, heart disease, and lung disorders.
                                Nicotine is highly addictive and can harm brain development in youth.
                                Vaping products may contain harmful chemicals and are not safe alternatives to smoking.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Parental Controls</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Parents and guardians are encouraged to monitor their children's online activities and use parental control tools
                            to prevent access to age-restricted websites. We recommend using filtering software and discussing online safety
                            with your children.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Legal Compliance</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">
                            VapesHub complies with all applicable laws and regulations regarding age-restricted sales:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Federal Tobacco Control Act</li>
                            <li>State and local tobacco sales regulations</li>
                            <li>Online age verification requirements</li>
                            <li>Data privacy laws (COPPA, GDPR, CCPA)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Reporting Violations</h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you suspect that a minor is attempting to access or purchase age-restricted products,
                            please report this immediately to our compliance team at compliance@vapeshub.com or call 1-800-VAPE-HUB.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Account Suspension</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Accounts found to be in violation of our age policy will be immediately suspended.
                            Suspended accounts may be permanently banned, and all associated data may be deleted.
                            Legal authorities may be notified in cases of suspected underage access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We may update this age verification policy to reflect changes in laws or best practices.
                            Users will be notified of significant changes via email or website announcements.
                        </p>
                    </section>

                    <div className="mt-8 p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Shield className="w-5 h-5" />
                            <span className="font-semibold">Contact Information</span>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                            <p>For age verification questions: age-check@vapeshub.com</p>
                            <p>For compliance reports: compliance@vapeshub.com</p>
                            <p>Emergency hotline: 1-800-VAPE-HUB</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm">
                            By continuing to use VapesHub, you certify that you are 21 years of age or older and agree to comply with all age verification requirements.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}