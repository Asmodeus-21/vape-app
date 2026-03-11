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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-secondary/60 backdrop-blur-md p-4 md:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-6 md:p-10 max-w-xl w-full space-y-8 relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-secondary/5 rounded-full blur-3xl" />

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-accent rounded-3xl flex items-center justify-center shadow-inner">
              <Shield className="text-brand-secondary w-8 h-8 md:w-10 md:h-10" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-secondary">Checkout Verification</h1>
          <p className="text-sm md:text-base text-text-muted font-medium max-w-sm mx-auto leading-relaxed">
            To complete your purchase, we must verify that you are 21 or older. This is a one-time process.
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
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-brand-primary/10 rounded-lg mt-1">
                    <AlertCircle className="text-brand-primary w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-brand-secondary">Why is this required?</h3>
                    <p className="text-sm text-text-muted font-medium">Federal law requires age verification for all online tobacco and nicotine sales to prevent underage access.</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setStep('method_select')}
                className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary/90 transition-all text-lg shadow-xl shadow-brand-primary/20"
              >
                Start Verification
              </button>
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-text-muted">Encrypted & Secure Processing</p>
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
                className="flex items-center gap-6 p-6 bg-gray-50 border-2 border-transparent hover:border-brand-primary hover:bg-white rounded-2xl transition-all text-left group shadow-sm"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="text-blue-600 w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-brand-secondary">Instant Database Check</h3>
                  <p className="text-sm text-text-muted font-medium">Verify using your name, address, and SSN (last 4). Fastest method.</p>
                </div>
              </button>

              <button 
                onClick={() => setStep('id_upload')}
                className="flex items-center gap-6 p-6 bg-gray-50 border-2 border-transparent hover:border-brand-primary hover:bg-white rounded-2xl transition-all text-left group shadow-sm"
              >
                <div className="w-14 h-14 bg-brand-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="text-brand-secondary w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-brand-secondary">Government ID Upload</h3>
                  <p className="text-sm text-text-muted font-medium">Upload a photo of your Driver's License or Passport for AI analysis.</p>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase font-black tracking-widest">First Name</label>
                    <input type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:ring-brand-primary focus:bg-white transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase font-black tracking-widest">Last Name</label>
                    <input type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:ring-brand-primary focus:bg-white transition-all" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted uppercase font-black tracking-widest">Date of Birth</label>
                  <input type="date" className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:ring-brand-primary focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted uppercase font-black tracking-widest">Last 4 of SSN</label>
                  <input type="password" maxLength={4} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:ring-brand-primary focus:bg-white transition-all" placeholder="••••" />
                </div>
              </div>
              <button 
                onClick={handleDbCheck}
                disabled={dbChecking}
                className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
              >
                {dbChecking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : 'Submit for Instant Check'}
              </button>
              <button onClick={() => setStep('method_select')} className="w-full text-xs font-bold text-text-muted hover:text-brand-secondary transition-colors">Go Back</button>
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
              <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center space-y-4 hover:border-brand-primary/50 transition-colors cursor-pointer group bg-gray-50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="text-gray-400 group-hover:text-brand-primary w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-brand-secondary">Click to upload or drag & drop</p>
                  <p className="text-sm text-text-muted font-medium">Front of Driver's License or Passport</p>
                </div>
              </div>
              <button 
                onClick={handleIdUpload}
                disabled={uploading}
                className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing ID...
                  </>
                ) : 'Submit ID for AI Analysis'}
              </button>
              <button onClick={() => setStep('method_select')} className="w-full text-xs font-bold text-text-muted hover:text-brand-secondary transition-colors">Go Back</button>
            </motion.div>
          )}

          {step === 'pending_review' && (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FileText className="text-yellow-600 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-brand-secondary">Manual Review Required</h3>
                <p className="text-text-muted font-medium">Our AI couldn't instantly verify your ID. A team member will review it within 15-30 minutes.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-bold text-brand-secondary">Verification ID: <span className="font-mono text-brand-primary">VH-9928-X</span></p>
              </div>
              <button 
                onClick={() => onVerified()} 
                className="w-full py-4 bg-gray-100 rounded-2xl font-black uppercase tracking-widest text-brand-secondary hover:bg-gray-200 transition-all"
              >
                Close & Wait
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
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="text-green-600 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-brand-secondary">Verification Successful</h3>
                <p className="text-text-muted font-medium">Welcome to VapesHub! You are now verified to shop our full catalog.</p>
              </div>
              <button 
                onClick={onVerified}
                className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20"
              >
                Enter Marketplace
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
