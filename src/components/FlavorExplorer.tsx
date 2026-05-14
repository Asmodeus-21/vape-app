import { ChevronRight, Loader2, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { getSmartAiResponse, SYSTEM_INSTRUCTIONS, vapeosAI } from '../services/aiService';

type LeadStep = 'idle' | 'collecting' | 'loading' | 'done';

interface LeadData {
    name: string;
    email: string;
    phone: string;
}

export default function FlavorExplorer() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
    const [leadStep, setLeadStep] = useState<LeadStep>('idle');
    const [pendingQuery, setPendingQuery] = useState('');
    const [lead, setLead] = useState<LeadData>({ name: '', email: '', phone: '' });
    const [leadSaved, setLeadSaved] = useState(false);

    const flavorProfiles = [
        { id: 'fruity', name: 'Fruity Blends', image: '/images/flavor_fruity_1773423120040.png', desc: 'Fresh & Vibrant' },
        { id: 'icy', name: 'Icy Menthol', image: '/images/flavor_icy_1773423140543.png', desc: 'Cool & Refreshing' },
        { id: 'dessert', name: 'Sweet Desserts', image: '/images/flavor_desserts_1773423159844.png', desc: 'Rich & Creamy' },
        { id: 'candy', name: 'Candy Shop', image: '/images/flavor_candy_1773423186249.png', desc: 'Sweet & Tangy' },
        { id: 'tobacco', name: 'Classic Tobacco', image: '/images/flavor_tobacco_1773423204201.png', desc: 'Bold & Earthy' },
    ];

    const runAI = async (finalQuery: string, capturedLead: LeadData | null) => {
        setLeadStep('loading');
        setLoading(true);
        setRecommendation(null);

        const prompt = `Customer is looking for: ${finalQuery}.\nSelected Profile: ${selectedProfile || 'Any'}.\nPlease provide specific product recommendations and detailed explanations.`;

        try {
            const response = await vapeosAI.generateResponse(prompt, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
            const text = response || getSmartAiResponse(prompt, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
            setRecommendation(text);

            if (capturedLead && (capturedLead.name || capturedLead.email || capturedLead.phone)) {
                await vapeosAI.saveLead({
                    name: capturedLead.name || undefined,
                    email: capturedLead.email || undefined,
                    phone: capturedLead.phone || undefined,
                    flavorQuery: finalQuery,
                    aiResponse: text,
                    source: 'flavor_explorer',
                });
                setLeadSaved(true);
            }
        } catch (error) {
            console.error('Flavor explorer fallback engaged:', error);
            setRecommendation(getSmartAiResponse(prompt, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT));
        } finally {
            setLoading(false);
            setLeadStep('done');
        }
    };

    const handleExplore = async (customQuery?: string) => {
        const finalQuery = customQuery || query;
        if (!finalQuery.trim()) return;
        setPendingQuery(finalQuery);

        if (!leadSaved) {
            setLeadStep('collecting');
            return;
        }

        await runAI(finalQuery, null);
    };

    const handleLeadSubmit = async () => {
        // Validate required fields
        if (!lead.name.trim()) {
            alert('Please enter your name');
            return;
        }
        if (!lead.email.trim()) {
            alert('Please enter your email');
            return;
        }

        await runAI(pendingQuery, lead);
    };

    return (
        <section className="bg-white mx-4 p-8 md:p-12 premium-card space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 rotate-3">
                        <Sparkles className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Flavor DNA Explorer</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">VAPEOS AI curation layer active</p>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
                        placeholder="Define your sensory hardware (e.g. 'high-intensity menthol fruit')..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 pr-16 text-sm focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    />
                    <button
                        onClick={() => void handleExplore()}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-xl shadow-xl hover:bg-brand-primary transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {leadStep === 'collecting' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Before we run your analysis</h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    We need your contact info to send your personalized results and exclusive deals.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={lead.name}
                                    onChange={(e) => setLead((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Your name"
                                    required
                                    maxLength={200}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={lead.email}
                                    onChange={(e) => setLead((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="you@email.com"
                                    required
                                    maxLength={254}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone <span className="text-slate-300">(optional)</span></label>
                                <input
                                    type="tel"
                                    value={lead.phone}
                                    onChange={(e) => setLead((prev) => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+1 (555) 000-0000"
                                    maxLength={30}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => void handleLeadSubmit()}
                                disabled={!lead.name.trim() || !lead.email.trim()}
                                className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                            >
                                Run My Analysis
                            </button>
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium text-center">
                            We respect your privacy. Your info is never sold or shared with third parties.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {leadStep !== 'collecting' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Classification - Common Profiles</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {flavorProfiles.map((profile) => (
                            <div
                                key={profile.id}
                                onClick={() => {
                                    setSelectedProfile(profile.id === selectedProfile ? null : profile.id);
                                    setQuery(`I'm looking for ${profile.name} flavors...`);
                                }}
                                className={`min-w-[160px] max-w-[160px] flex flex-col gap-3 cursor-pointer group transition-all ${selectedProfile === profile.id ? 'scale-105' : ''}`}
                            >
                                <div className={`aspect-square bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 transition-all duration-500 ${selectedProfile === profile.id ? 'border-brand-primary shadow-2xl shadow-brand-primary/10' : 'border-slate-50 group-hover:border-slate-200'}`}>
                                    <img
                                        src={profile.image}
                                        alt={profile.name}
                                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className={`text-[11px] font-black uppercase tracking-tighter transition-colors ${selectedProfile === profile.id ? 'text-brand-primary' : 'text-slate-900'}`}>
                                        {profile.name}
                                    </h4>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{profile.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {recommendation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-primary/10 p-3 rounded-2xl">
                                    <Sparkles className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">AI Synthesis Results</h4>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bio-Matches Optimized</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setRecommendation(null);
                                    setLeadStep('idle');
                                }}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Reset Stream
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-900">
                            <div className="markdown-body bg-transparent p-0 text-sm italic">
                                <Markdown>{recommendation}</Markdown>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-200">
                            <button className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-2 group active:scale-95">
                                <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Commit to Ledger
                            </button>
                            <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                                Bookmark Profile
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!recommendation && leadStep === 'idle' && (
                <div className="flex flex-wrap gap-2 pt-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 py-1.5 ml-2">Hardware Suggestions:</span>
                    {['Sour apple with ice', 'Creamy vanilla tobacco', 'Blueberry muffin', 'Icy watermelon'].map((s) => (
                        <button
                            key={s}
                            onClick={() => {
                                setQuery(s);
                                void handleExplore(s);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all text-slate-600 active:scale-95"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
