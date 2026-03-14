import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Upload, Database, UserCheck, AlertCircle, CheckCircle2, Zap, Camera, FileText } from 'lucide-react';

interface AgeVerificationProps {
  onVerified: () => void;
}

type Step = 'initial' | 'method_select' | 'id_upload' | 'database_check' | 'pending_review' | 'success';

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [step, setStep] = useState<Step>('initial');
  const [uploading, setUploading] = useState(false);
  const [dbChecking, setDbChecking] = useState(false);

  const handleIdUpload = () => {
    setUploading(true);
    // Simulate ID processing
    setTimeout(() => {
      setUploading(false);
      setStep('pending_review');
    }, 3000);
  };

  const handleDbCheck = () => {
    setDbChecking(true);
    // Simulate database lookup
    setTimeout(() => {
      setDbChecking(false);
      setStep('success');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 md:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-8 md:p-12 max-w-xl w-full space-y-10 relative overflow-hidden rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-secondary/5 rounded-full blur-3xl" />

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
              <Shield className="text-brand-primary w-10 h-10 md:w-12 md:h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">Compliance Layer</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Strict Age Authentication Protocol</p>
          </div>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            In accordance with digital trade standards, we require a one-time identity verification to access the VapesHub supply network.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-4">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-brand-primary/10 rounded-2xl mt-1">
                    <AlertCircle className="text-brand-primary w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Protocol Awareness</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">VapesHub operates under strict regulatory frameworks. All clients must be 21+ to initialize hardware nodes or chemical assets.</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setStep('method_select')}
                className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-primary transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
              >
                Access Supply Network
              </button>
              <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">256-bit AES Encrypted Identity Stream</p>
            </motion.div>
          )}

          {step === 'method_select' && (
            <motion.div 
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-4"
            >
              <button 
                onClick={() => setStep('database_check')}
                className="flex items-center gap-6 p-8 bg-slate-50 border border-slate-100 rounded-3xl transition-all text-left group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-brand-primary"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-all">
                  <Database className="text-brand-primary w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Neural Database Sync</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify via SSN stream & credit history. Instant Activation.</p>
                </div>
              </button>

              <button 
                onClick={() => setStep('id_upload')}
                className="flex items-center gap-6 p-8 bg-slate-50 border border-slate-100 rounded-3xl transition-all text-left group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-brand-primary"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:-rotate-6 transition-all">
                  <Camera className="text-slate-900 w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Biometric Scan (ID)</h3>
                  <p className="text-xs text-slate-500 font-medium">Upload government credentials for AI optical analysis.</p>
                </div>
              </button>

              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-xs font-bold text-text-muted">Having trouble? <button className="text-brand-primary hover:underline">Contact manual review team</button></p>
              </div>
            </motion.div>
          )}

          {step === 'database_check' && (
            <motion.div 
              key="db"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] ml-2">Primary Forename</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] ml-2">Surname Node</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] ml-2">Chronological DOB</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] ml-2">SSN Hash (Last 4)</label>
                  <input type="password" maxLength={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all" placeholder="••••" />
                </div>
              </div>
              <button 
                onClick={handleDbCheck}
                disabled={dbChecking}
                className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
              >
                {dbChecking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Syncing Stream...
                  </>
                ) : 'Authenticate Identity'}
              </button>
              <button onClick={() => setStep('method_select')} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Go Back</button>
            </motion.div>
          )}

          {step === 'id_upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="border border-slate-100 rounded-[2rem] p-12 text-center space-y-6 hover:border-brand-primary/50 transition-all cursor-pointer group bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm group-hover:rotate-12 transition-all relative z-10">
                  <Upload className="text-slate-400 group-hover:text-brand-primary w-10 h-10" />
                </div>
                <div className="space-y-2 relative z-10">
                  <p className="font-black text-[11px] uppercase tracking-widest text-slate-900">Initialize Optical Stream</p>
                  <p className="text-xs text-slate-500 font-medium">Drag गवर्नमेंट ID (DL/Passport) into the secure capture zone.</p>
                </div>
              </div>
              <button 
                onClick={handleIdUpload}
                disabled={uploading}
                className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing Bio-Data...
                  </>
                ) : 'Run AI Optical Check'}
              </button>
              <button onClick={() => setStep('method_select')} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Go Back</button>
            </motion.div>
          )}

          {step === 'pending_review' && (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative">
                <FileText className="text-amber-600 w-12 h-12" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse border-4 border-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Human Review Escalated</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs mx-auto">AI confidence below threshold. A compliance officer will manually verify your credentials within 15-30 units.</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 inline-block px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Session Token</p>
                <p className="text-sm font-mono text-brand-primary font-black tracking-widest">VH-PROTO-9928-X</p>
              </div>
              <button 
                onClick={() => onVerified()} 
                className="w-full py-5 bg-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all"
              >
                Exit to Waiting Room
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative">
                <CheckCircle2 className="text-brand-primary w-12 h-12" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white border-4 border-white">
                  <Zap className="w-3 h-3 fill-current" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Identity Cleared</h3>
                <p className="text-slate-500 font-medium text-sm">Welcome to the inner circle. Your account is now authorized for the full VapesHub supply network.</p>
              </div>
              <button 
                onClick={onVerified}
                className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all active:scale-[0.98]"
              >
                Initialize Secure Session
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
