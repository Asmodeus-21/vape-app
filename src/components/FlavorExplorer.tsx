import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Search, ChevronRight, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { vapeosAI, SYSTEM_INSTRUCTIONS } from '../services/aiService';
import Markdown from 'react-markdown';

export default function FlavorExplorer() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const flavorProfiles = [
    { id: 'fruity', name: 'Fruity Blends', image: '/images/flavor_fruity_1773423120040.png', desc: 'Fresh & Vibrant' },
    { id: 'icy', name: 'Icy Menthol', image: '/images/flavor_icy_1773423140543.png', desc: 'Cool & Refreshing' },
    { id: 'dessert', name: 'Sweet Desserts', image: '/images/flavor_desserts_1773423159844.png', desc: 'Rich & Creamy' },
    { id: 'candy', name: 'Candy Shop', image: '/images/flavor_candy_1773423186249.png', desc: 'Sweet & Tangy' },
    { id: 'tobacco', name: 'Classic Tobacco', image: '/images/flavor_tobacco_1773423204201.png', desc: 'Bold & Earthy' },
  ];

  const handleExplore = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setRecommendation(null);

    const prompt = `Customer is looking for: ${finalQuery}. 
    Selected Profile: ${selectedProfile || 'Any'}. 
    Please provide specific product recommendations and detailed explanations.`;

    const response = await vapeosAI.generateResponse(prompt, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
    setRecommendation(response || 'Sorry, I couldn\'t find any specific matches. Try describing the taste differently!');
    setLoading(false);
  };

  return (
    <section className="bg-white p-6 shadow-sm rounded-xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary p-2 rounded-xl">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Find Your Perfect Flavor</h3>
            <p className="text-xs text-text-muted font-bold">Describe your taste and let VAPEOS AI curate your experience</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
            placeholder="Describe your ideal taste (e.g. 'sweet strawberry with ice')..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-medium"
          />
          <button 
            onClick={() => handleExplore()}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Popular Flavor Profiles</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {flavorProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => {
                setSelectedProfile(profile.id === selectedProfile ? null : profile.id);
                setQuery(`I'm looking for ${profile.name} flavors...`);
              }}
              className={`min-w-[160px] max-w-[160px] flex flex-col gap-3 cursor-pointer group transition-all ${
                selectedProfile === profile.id ? 'scale-105' : ''
              }`}
            >
              <div className={`aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border-2 transition-all ${
                selectedProfile === profile.id ? 'border-brand-primary shadow-lg' : 'border-gray-100 group-hover:border-brand-primary/50'
              }`}>
                <img 
                  src={profile.image} 
                  alt={profile.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-black uppercase tracking-tight transition-colors ${
                  selectedProfile === profile.id ? 'text-brand-primary' : 'text-brand-secondary'
                }`}>
                  {profile.name}
                </h4>
                <p className="text-[10px] text-text-muted font-bold">{profile.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary/10 p-2 rounded-lg">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-secondary">AI Recommendations</h4>
              </div>
              <button onClick={() => setRecommendation(null)} className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors">Clear</button>
            </div>
            
            <div className="prose prose-sm max-w-none prose-p:text-brand-secondary prose-p:font-medium prose-p:leading-relaxed prose-headings:text-brand-secondary prose-strong:text-brand-secondary">
              <div className="markdown-body bg-transparent p-0 text-sm">
                <Markdown>{recommendation}</Markdown>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button className="flex-1 py-3 bg-brand-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Save Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!recommendation && !loading && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted py-1.5">Quick Ideas:</span>
          {[
            "Sour apple with ice",
            "Creamy vanilla tobacco",
            "Blueberry muffin",
            "Icy watermelon"
          ].map((s) => (
            <button 
              key={s}
              onClick={() => { setQuery(s); handleExplore(s); }}
              className="text-[10px] font-bold bg-white border border-gray-100 px-3 py-1.5 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
