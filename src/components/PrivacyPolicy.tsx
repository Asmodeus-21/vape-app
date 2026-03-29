import { ArrowLeft, Eye, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalPageProps {
    onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: LegalPageProps) {
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
                        <Shield className="w-8 h-8 text-brand-primary" />
                        <h1 className="text-3xl font-bold">Privacy Policy</h1>
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
                        <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
                        <div className="space-y-3 text-slate-300">
                            <p><strong>Personal Information:</strong> Name, email address, shipping address, payment information</p>
                            <p><strong>Account Information:</strong> Username, password, order history, preferences</p>
                            <p><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent on site</p>
                            <p><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Process and fulfill your orders</li>
                            <li>Provide customer service and support</li>
                            <li>Send order confirmations and updates</li>
                            <li>Improve our website and services</li>
                            <li>Send marketing communications (with consent)</li>
                            <li>Prevent fraud and ensure security</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">
                            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>With service providers who help us operate our business</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and prevent fraud</li>
                            <li>With your explicit consent</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access,
                            alteration, disclosure, or destruction. This includes encryption of sensitive data and regular security assessments.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">
                            We use cookies and similar technologies to enhance your browsing experience:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how you use our site</li>
                            <li><strong>Marketing Cookies:</strong> Used to show relevant advertisements</li>
                        </ul>
                        <p className="text-slate-300 leading-relaxed mt-3">
                            You can control cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">You have the right to:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate information</li>
                            <li>Request deletion of your data</li>
                            <li>Object to processing of your data</li>
                            <li>Data portability</li>
                            <li>Withdraw consent for marketing</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
                            Order history is typically retained for 7 years for tax and accounting purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">8. Third-Party Services</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
                            Please review their privacy policies before providing any personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Our services are not intended for children under 21. We do not knowingly collect personal information from minors.
                            If we become aware that we have collected personal information from a minor, we will take steps to delete it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page
                            and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you have any questions about this privacy policy or our data practices, please contact us at:
                        </p>
                        <div className="bg-slate-700 p-4 rounded-lg mt-3">
                            <p className="text-slate-300">Email: privacy@vapeshub.com</p>
                            <p className="text-slate-300">Phone: 1-800-VAPE-HUB</p>
                            <p className="text-slate-300">Address: 123 Vape Street, Cloud City, CC 12345</p>
                        </div>
                    </section>

                    <div className="mt-8 p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                            <Eye className="w-5 h-5" />
                            <span className="font-semibold">Important Notice</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            This privacy policy applies to VapesHub. By using our services, you agree to the collection and use of information in accordance with this policy.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}