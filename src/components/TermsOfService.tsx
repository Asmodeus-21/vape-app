import { ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalPageProps {
    onBack: () => void;
}

export default function TermsOfService({ onBack }: LegalPageProps) {
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
                        <FileText className="w-8 h-8 text-brand-primary" />
                        <h1 className="text-3xl font-bold">Terms of Service</h1>
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

                    <section>
                        <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-300 leading-relaxed">
                            By accessing and using Banana Leaf Store, you accept and agree to be bound by the terms and provision of this agreement.
                            If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">2. Age Restrictions</h2>
                        <p className="text-slate-300 leading-relaxed">
                            You must be at least 21 years old to use this service. Banana Leaf Store is committed to preventing underage access
                            to tobacco and vaping products. By using our service, you certify that you are of legal age in your jurisdiction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">3. Product Information</h2>
                        <p className="text-slate-300 leading-relaxed">
                            All product information, including prices and availability, is subject to change without notice.
                            We strive to provide accurate information but cannot guarantee the accuracy of product descriptions,
                            pricing, or availability.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">4. Orders and Payment</h2>
                        <p className="text-slate-300 leading-relaxed">
                            All orders are subject to acceptance and availability. Payment must be received in full before order processing.
                            We reserve the right to refuse or cancel any order for any reason.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">5. Shipping and Delivery</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Shipping times are estimates only. We are not responsible for delays caused by shipping carriers or other factors
                            beyond our control. Risk of loss passes to the buyer upon delivery to the carrier.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">6. Returns and Refunds</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Due to the nature of our products, returns are only accepted for defective items within 7 days of delivery.
                            All returns require prior authorization. Refunds will be processed within 5-10 business days of receipt.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">7. User Conduct</h2>
                        <p className="text-slate-300 leading-relaxed">
                            You agree not to use our service for any unlawful purpose or to solicit others to perform unlawful acts.
                            You are responsible for maintaining the confidentiality of your account information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Banana Leaf Store shall not be liable for any indirect, incidental, special, or consequential damages arising out of
                            or in connection with your use of our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
                        <p className="text-slate-300 leading-relaxed">
                            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                            Banana Leaf Store operates, without regard to conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We reserve the right to modify these terms at any time. Continued use of our service after changes
                            constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <div className="mt-8 p-4 bg-slate-700 rounded-lg">
                        <p className="text-sm text-slate-400">
                            For questions about these terms, please contact us at legal@banana-leaf.store
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}