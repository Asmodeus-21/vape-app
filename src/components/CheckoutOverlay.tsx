import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ArrowRight, ShieldCheck, CheckCircle2, CreditCard, Lock, X, MapPin, Zap } from 'lucide-react';
import { Product } from '../types';
import AgeVerification from './AgeVerification';
import { createOrder } from '../services/api';
import toast from 'react-hot-toast';

interface CheckoutOverlayProps {
  cart: Product[];
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

type CheckoutStep = 'cart_review' | 'age_verification' | 'shipping_payment' | 'success';

export default function CheckoutOverlay({ cart, token, onClose, onSuccess }: CheckoutOverlayProps) {
  const [step, setStep] = useState<CheckoutStep>('cart_review');
  const [shippingAddress, setShippingAddress] = useState('123 Main St, Ukiah, CA 95482');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Group cart items by product ID & flavor/nicotine to calculate quantities
  const groupedCart = cart.reduce((acc, item) => {
    // Unique key considering options
    const key = `${item.id}-${(item as any).flavor || ''}-${(item as any).nicotine || ''}`;
    if (!acc[key]) {
      acc[key] = { product: item, quantity: 0 };
    }
    acc[key].quantity += 1;
    return acc;
  }, {} as Record<string, { product: Product; quantity: number }>);

  const cartItems = Object.values(groupedCart);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const itemsToOrder = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await createOrder(token, itemsToOrder, shippingAddress);
      setOrderId(res.orderId);
      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white max-w-2xl w-full rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <Lock className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Secure Protocol</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction Stream Encrypted</p>
            </div>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CART REVIEW */}
            {step === 'cart_review' && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 text-brand-primary font-black shadow-lg">1</div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Ledger Review</h3>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-3 scrollbar-hide">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-5 items-center bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-brand-primary/50 transition-all">
                      <div className="w-20 h-20 bg-white rounded-2xl p-2 shrink-0 border border-slate-100 shadow-sm group-hover:rotate-3 transition-transform">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 uppercase tracking-tight truncate text-sm">{item.product.name}</h4>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex gap-3 mt-1">
                          {(item.product as any).flavor && <span>Flavor: {(item.product as any).flavor}</span>}
                          {(item.product as any).nicotine && <span>Nic: {(item.product as any).nicotine}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-slate-900 tracking-tighter text-lg">${(item.product.price * item.quantity).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Units: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-8 mt-8">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                        <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Consolidated Total</span>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Including Market Tax</p>
                    </div>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setStep('age_verification')}
                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 hover:bg-brand-primary hover:scale-[1.02] transition-all text-xs"
                  >
                    Proceed to Age Auth
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AGE VERIFICATION */}
            {step === 'age_verification' && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative min-h-[400px]"
              >
                {/* We render the existing AgeVerification component but trap its callback */}
                <AgeVerification onVerified={() => setStep('shipping_payment')} />
                <button 
                  onClick={() => setStep('cart_review')}
                  className="absolute top-0 left-0 text-gray-500 font-bold text-sm hover:text-brand-primary underline"
                >
                  Back to Cart
                </button>
              </motion.div>
            )}

            {/* STEP 3: SHIPPING AND PAYMENT */}
            {step === 'shipping_payment' && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 text-brand-primary font-black shadow-lg">2</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Destination & Ledger</h3>
                  </div>
                  <button onClick={() => setStep('age_verification')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Go Back</button>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-8">
                  {/* Shipping Info */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-3 ml-2">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      Dispatch Coordinates
                    </h4>
                    <input 
                      type="text" 
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-slate-900 shadow-sm"
                    />
                  </div>

                  {/* Mock Payment Info */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-3 ml-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      Payment Terminal
                    </h4>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Card Number" 
                        value="•••• •••• •••• 4242"
                        readOnly
                        className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 font-mono outline-none text-slate-400 cursor-not-allowed shadow-sm text-xs"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="MM/YY" value="12/26" readOnly className="bg-white border text-center border-slate-100 rounded-2xl px-6 py-4 font-mono outline-none text-slate-400 cursor-not-allowed shadow-sm text-xs" />
                        <input type="text" placeholder="CVC" value="•••" readOnly className="bg-white border text-center border-slate-100 rounded-2xl px-6 py-4 font-mono outline-none text-slate-400 cursor-not-allowed shadow-sm text-xs" />
                      </div>
                      <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] text-center mt-4 flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" /> Sandbox Environment — No Actual Charge
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Authorization</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter">${cartTotal.toFixed(2)}</div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all text-xs active:scale-95"
                    >
                      {isProcessing ? 'Synchronizing...' : 'Settle Ledger'}
                      {!isProcessing && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'success' && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex flex-col items-center text-center py-12 space-y-8"
              >
                <div className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-4 relative shadow-inner">
                  <CheckCircle2 className="text-brand-primary w-16 h-16" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div>
                  <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Transmission Success</h2>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                    Order <span className="text-slate-900 font-black">#{orderId}</span> has been successfully logged into the Hub ledger. A confirmation stream has been initialized to your credentials.
                  </p>
                </div>
                <div className="pt-6 w-full">
                  <button 
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:bg-brand-primary transition-all text-xs active:scale-95"
                  >
                    Return to Marketplace
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
