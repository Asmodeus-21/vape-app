import {
    ArrowRight,
    Building2,
    CheckCircle2,
    CreditCard,
    Globe,
    Loader2,
    Lock,
    Mail,
    Map,
    MapPin,
    Phone,
    ShieldCheck,
    ShoppingBag,
    Truck,
    User,
    X,
    ZapIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createGuestOrder, createOrder, createPaymentIntent, registerWithOtp, requestOtp, verifyLoginOtp } from '../services/api';
import { Product } from '../types';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
    storeId?: number | null;
}

interface CheckoutSummary {
    orderId: number;
    total: number;
    deliveryFee: number;
    shippingAddress: string;
    customerEmail: string;
    items: Array<{ name: string; quantity: number; lineTotal: number }>;
}

interface CheckoutOverlayProps {
    cart: Product[];
    token?: string | null;
    currentUser: AuthUser | null;
    onClose: () => void;
    onSuccess: () => void;
    onOrderComplete: (summary: CheckoutSummary) => void;
    onAuthSuccess: (user: AuthUser, token: string) => void;
}

type CheckoutStep = 'shipping' | 'delivery' | 'payment';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InputField({
    icon: Icon,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 focus-within:border-[#1a2744] focus-within:ring-2 focus-within:ring-[#1a2744]/10 transition-all">
            <Icon className="w-5 h-5 text-slate-400 shrink-0" />
            <input
                {...props}
                className="flex-1 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
        </div>
    );
}

export default function CheckoutOverlay({
    cart,
    token,
    currentUser,
    onClose,
    onSuccess,
    onOrderComplete,
    onAuthSuccess,
}: CheckoutOverlayProps) {
    const [step, setStep] = useState<CheckoutStep>('shipping');
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>('');

    const [fullName, setFullName] = useState(currentUser?.name || '');
    const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [apt, setApt] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [country, setCountry] = useState('United States');
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');

    const [checkoutMode, setCheckoutMode] = useState<'guest' | 'save'>('guest');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [saveDetailsToken, setSaveDetailsToken] = useState<string | null>(token ?? null);

    const groupedCart = useMemo(() => {
        return cart.reduce((acc, item) => {
            const key = `${item.id}-${(item as any).flavor || ''}-${(item as any).nicotine || ''}`;
            if (!acc[key]) {
                acc[key] = { product: item, quantity: 0 };
            }
            acc[key].quantity += 1;
            return acc;
        }, {} as Record<string, { product: Product; quantity: number }>);
    }, [cart]);

    const cartItems = useMemo(() => Object.values(groupedCart), [groupedCart]);
    const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
    const deliveryFee = deliveryMethod === 'express' ? 5.99 : 0;
    const total = subtotal + deliveryFee;
    const isGuestCheckout = !currentUser;

    const shippingAddress = [address, apt, city, state, zip, country].filter(Boolean).join(', ');

    const validateShippingStep = () => {
        if (!fullName.trim()) { toast.error('Full name is required'); return false; }
        if (!customerEmail.trim() || !EMAIL_REGEX.test(customerEmail.trim())) { toast.error('A valid email is required'); return false; }
        if (!address.trim()) { toast.error('Please enter your address'); return false; }
        if (!city.trim()) { toast.error('Please enter your city'); return false; }
        return true;
    };

    const handleSendOtp = async () => {
        if (!customerEmail.trim() || !EMAIL_REGEX.test(customerEmail.trim())) {
            toast.error('Enter a valid email before requesting verification');
            return;
        }
        try {
            await requestOtp(customerEmail.trim());
            setOtpSent(true);
            toast.success('Verification code sent to your email');
        } catch (err: any) {
            toast.error(err.message || 'Unable to send verification code');
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.trim().length !== 6) { toast.error('Enter the 6-digit code from your email'); return; }
        try {
            const generatedPassword = `Auto#${Date.now()}!`;
            let authResult;
            try {
                authResult = await verifyLoginOtp(customerEmail.trim(), otpCode.trim());
            } catch (verifyError: any) {
                if (!String(verifyError?.message || '').toLowerCase().includes('user not found')) throw verifyError;
                authResult = await registerWithOtp(customerEmail.trim(), otpCode.trim(), fullName.trim(), generatedPassword, false);
            }
            setOtpVerified(true);
            setSaveDetailsToken(authResult.token);
            onAuthSuccess(authResult.user, authResult.token);
            toast.success('Email verified. Details will be saved.');
        } catch (err: any) {
            toast.error(err.message || 'Verification failed');
        }
    };

    const handleCompletePurchase = async () => {
        if (!isAgeVerified) { toast.error('You must confirm 21+ age verification before purchase'); setStep('shipping'); return; }
        if (!validateShippingStep()) { setStep('shipping'); return; }
        if (isGuestCheckout && checkoutMode === 'save' && (!otpVerified || !saveDetailsToken)) { toast.error('Verify your email code to save details'); return; }

        setIsProcessing(true);
        try {
            const itemsToOrder = cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
            let orderId: number;

            if (saveDetailsToken) {
                const response = await createOrder(saveDetailsToken, itemsToOrder, shippingAddress);
                orderId = Number(response.orderId);
            } else {
                const response = await createGuestOrder(itemsToOrder, shippingAddress, customerEmail.trim(), fullName.trim(), checkoutMode === 'save');
                orderId = Number(response.orderId);
            }

            const summary: CheckoutSummary = {
                orderId, total, deliveryFee, shippingAddress, customerEmail: customerEmail.trim(),
                items: cartItems.map((item) => ({ name: item.product.name, quantity: item.quantity, lineTotal: item.product.price * item.quantity })),
            };
            onSuccess();
            onOrderComplete(summary);
            toast.success('Purchase completed successfully');
        } catch (err: any) {
            toast.error(err.message || 'Checkout failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const steps: CheckoutStep[] = ['shipping', 'delivery', 'payment'];
    const stepIndex = steps.indexOf(step);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                className="bg-[#f5f6f8] max-w-lg w-full rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-[#1a2744] rounded-2xl flex items-center justify-center shadow-md">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#1a2744] uppercase tracking-wide leading-none">Checkout</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                {(['Shipping', 'Delivery', 'Payment'] as const).map((label, i) => (
                                    <span key={label} className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${i === stepIndex ? 'text-[#4AB1F4]' : 'text-slate-400'}`}>{label}</span>
                                        {i < 2 && <span className="text-slate-300 text-[10px]">›</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            Secure Checkout
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-6">
                    <AnimatePresence mode="wait">

                        {/* ── SHIPPING STEP ── */}
                        {step === 'shipping' && (
                            <motion.div key="shipping" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white font-black text-sm flex items-center justify-center shadow-md">1</div>
                                    <div>
                                        <h3 className="text-[15px] font-black text-[#1a2744] uppercase tracking-wide leading-none">Shipping Information</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Enter your details to continue</p>
                                    </div>
                                </div>

                                <InputField icon={User} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                                <InputField icon={Mail} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email Address" type="email" />
                                <InputField icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" type="tel" />
                                <InputField icon={MapPin} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                                <InputField icon={Building2} value={apt} onChange={(e) => setApt(e.target.value)} placeholder="APT / Unit Number (optional)" />

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField icon={Building2} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                                    <InputField icon={Map} value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField icon={ZapIcon} value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP Code" />
                                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 focus-within:border-[#1a2744] transition-all">
                                        <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                                        <select
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="flex-1 text-sm text-slate-800 font-medium focus:outline-none bg-transparent appearance-none cursor-pointer"
                                        >
                                            {['United States', 'United Kingdom', 'Canada', 'Australia', 'Ireland', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'].map((c) => (
                                                <option key={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <label className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 cursor-pointer hover:border-[#1a2744] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isAgeVerified}
                                        onChange={(e) => setIsAgeVerified(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 accent-[#1a2744]"
                                    />
                                    <span className="text-[13px] font-medium text-slate-700">
                                        I confirm I am 21+ and legally eligible to purchase nicotine products.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isAgeVerified) { toast.error('Confirm 21+ age verification to continue'); return; }
                                        if (validateShippingStep()) setStep('delivery');
                                    }}
                                    className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#1a2744] text-white text-[13px] font-black uppercase tracking-[0.15em] hover:bg-[#243460] active:scale-[0.98] transition-all shadow-lg shadow-[#1a2744]/30"
                                >
                                    Continue to Delivery <ArrowRight className="w-4 h-4" />
                                </button>
                                <p className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                                    <Lock className="w-3 h-3" /> Your information is secure and encrypted
                                </p>
                            </motion.div>
                        )}

                        {/* ── DELIVERY STEP ── */}
                        {step === 'delivery' && (
                            <motion.div key="delivery" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white font-black text-sm flex items-center justify-center shadow-md">2</div>
                                    <div>
                                        <h3 className="text-[15px] font-black text-[#1a2744] uppercase tracking-wide leading-none">Delivery Method</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Choose how you want your order delivered</p>
                                    </div>
                                </div>

                                <button type="button" onClick={() => setDeliveryMethod('standard')} className={`w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${deliveryMethod === 'standard' ? 'border-[#1a2744] bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${deliveryMethod === 'standard' ? 'bg-[#1a2744]' : 'bg-slate-100'}`}>
                                        <Truck className={`w-5 h-5 ${deliveryMethod === 'standard' ? 'text-white' : 'text-slate-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">Standard Shipping</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">3–5 business days</p>
                                    </div>
                                    <span className="text-sm font-black text-emerald-600">Free</span>
                                </button>

                                <button type="button" onClick={() => setDeliveryMethod('express')} className={`w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${deliveryMethod === 'express' ? 'border-[#1a2744] bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${deliveryMethod === 'express' ? 'bg-[#1a2744]' : 'bg-slate-100'}`}>
                                        <ZapIcon className={`w-5 h-5 ${deliveryMethod === 'express' ? 'text-white' : 'text-slate-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">Express Shipping</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">1–2 business days</p>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">£5.99</span>
                                </button>

                                {/* Order Summary */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Summary</p>
                                    {cartItems.map((item) => (
                                        <div key={item.product.id} className="flex justify-between text-sm">
                                            <span className="text-slate-700 font-medium">{item.product.name} × {item.quantity}</span>
                                            <span className="font-black text-slate-900">£{(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Delivery</span>
                                        <span className="font-bold text-slate-700">{deliveryFee === 0 ? 'Free' : `£${deliveryFee.toFixed(2)}`}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-[#1a2744]">
                                        <span>Total</span>
                                        <span>£{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep('shipping')} className="h-14 px-6 rounded-2xl border-2 border-slate-200 text-[12px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors">Back</button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setIsProcessing(true);
                                            try {
                                                const itemsToOrder = cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
                                                const { clientSecret: secret } = await createPaymentIntent(itemsToOrder, deliveryMethod);
                                                setClientSecret(secret);
                                                setStep('payment');
                                            } catch (err: any) {
                                                toast.error(err.message || 'Failed to initialize payment');
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#1a2744] text-white text-[13px] font-black uppercase tracking-[0.15em] hover:bg-[#243460] active:scale-[0.98] transition-all shadow-lg shadow-[#1a2744]/30"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Continue to Payment</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── PAYMENT STEP ── */}
                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white font-black text-sm flex items-center justify-center shadow-md">3</div>
                                    <div>
                                        <h3 className="text-[15px] font-black text-[#1a2744] uppercase tracking-wide leading-none">Payment</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Complete your secure payment</p>
                                    </div>
                                </div>

                                {isGuestCheckout && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checkout Mode</p>
                                        <div className="grid gap-3 grid-cols-2">
                                            <button type="button" onClick={() => setCheckoutMode('guest')} className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${checkoutMode === 'guest' ? 'border-[#1a2744] bg-[#1a2744]/5' : 'border-slate-200'}`}>
                                                <p className="text-sm font-black text-slate-900">Guest</p>
                                                <p className="text-[11px] font-medium text-slate-500">No account needed</p>
                                            </button>
                                            <button type="button" onClick={() => setCheckoutMode('save')} className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${checkoutMode === 'save' ? 'border-[#1a2744] bg-[#1a2744]/5' : 'border-slate-200'}`}>
                                                <p className="text-sm font-black text-slate-900">Save Details</p>
                                                <p className="text-[11px] font-medium text-slate-500">Email verification</p>
                                            </button>
                                        </div>
                                        {checkoutMode === 'save' && (
                                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Verification</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={handleSendOtp} className="h-10 px-4 rounded-xl bg-[#1a2744] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#243460] transition-colors flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />{otpSent ? 'Resend Code' : 'Send Code'}
                                                    </button>
                                                    <input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold tracking-[0.2em] focus:outline-none focus:border-[#1a2744] w-32" />
                                                    <button type="button" onClick={handleVerifyOtp} className="h-10 px-4 rounded-xl border border-slate-300 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors">Verify</button>
                                                </div>
                                                {otpVerified && (
                                                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Verified — details will be saved.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {clientSecret && (
                                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                                        <StripePaymentForm
                                            onPaymentSuccess={handleCompletePurchase}
                                            totalAmount={total}
                                            onBack={() => setStep('delivery')}
                                        />
                                    </Elements>
                                )}

                                <p className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                                    <Lock className="w-3 h-3" /> Your payment is secure and encrypted
                                </p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
