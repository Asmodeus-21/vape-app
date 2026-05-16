import { ArrowRight, CheckCircle2, CreditCard, Loader2, Lock, Mail, Truck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createGuestOrder, createOrder, registerWithOtp, requestOtp, verifyLoginOtp } from '../services/api';
import { Product } from '../types';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { createPaymentIntent } from '../services/api';

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
    const [shippingAddress, setShippingAddress] = useState('');
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

    const validateShippingStep = () => {
        if (!fullName.trim()) {
            toast.error('Full name is required');
            return false;
        }
        if (!customerEmail.trim() || !EMAIL_REGEX.test(customerEmail.trim())) {
            toast.error('A valid email is required');
            return false;
        }
        if (!shippingAddress.trim() || shippingAddress.trim().length < 10) {
            toast.error('Please enter a full shipping address');
            return false;
        }
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
        if (otpCode.trim().length !== 6) {
            toast.error('Enter the 6-digit code from your email');
            return;
        }

        try {
            const generatedPassword = `Auto#${Date.now()}!`;
            let authResult;

            try {
                authResult = await verifyLoginOtp(customerEmail.trim(), otpCode.trim());
            } catch (verifyError: any) {
                const verifyErrorMessage = String(verifyError?.message || '').toLowerCase();
                if (!verifyErrorMessage.includes('user not found')) {
                    throw verifyError;
                }

                authResult = await registerWithOtp(
                    customerEmail.trim(),
                    otpCode.trim(),
                    fullName.trim(),
                    generatedPassword,
                    false,
                );
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
        if (!isAgeVerified) {
            toast.error('You must confirm 21+ age verification before purchase');
            setStep('shipping');
            return;
        }

        if (!validateShippingStep()) {
            setStep('shipping');
            return;
        }

        if (isGuestCheckout && checkoutMode === 'save' && (!otpVerified || !saveDetailsToken)) {
            toast.error('Verify your email code to save details');
            return;
        }

        setIsProcessing(true);

        try {
            const itemsToOrder = cartItems.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
            }));

            let orderId: number;

            if (saveDetailsToken) {
                const response = await createOrder(saveDetailsToken, itemsToOrder, shippingAddress.trim());
                orderId = Number(response.orderId);
            } else {
                const response = await createGuestOrder(
                    itemsToOrder,
                    shippingAddress.trim(),
                    customerEmail.trim(),
                    fullName.trim(),
                    checkoutMode === 'save',
                );
                orderId = Number(response.orderId);
            }

            const summary: CheckoutSummary = {
                orderId,
                total,
                deliveryFee,
                shippingAddress: shippingAddress.trim(),
                customerEmail: customerEmail.trim(),
                items: cartItems.map((item) => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    lineTotal: item.product.price * item.quantity,
                })),
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="bg-white max-w-3xl w-full rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                            <Lock className="w-5 h-5 text-[#4AB1F4]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Checkout</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shipping → Delivery → Payment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        {step === 'shipping' && (
                            <motion.div key="shipping" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#4AB1F4] font-black flex items-center justify-center">1</div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Shipping</h3>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-[#4AB1F4] focus:outline-none" />
                                    <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" type="email" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-[#4AB1F4] focus:outline-none" />
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-[#4AB1F4] focus:outline-none" />
                                    <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Shipping address" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-[#4AB1F4] focus:outline-none" />
                                </div>

                                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isAgeVerified}
                                        onChange={(e) => setIsAgeVerified(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4AB1F4]"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                        I confirm I am 21+ and legally eligible to purchase nicotine products.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isAgeVerified) {
                                            toast.error('Confirm 21+ age verification to continue');
                                            return;
                                        }
                                        if (validateShippingStep()) {
                                            setStep('delivery');
                                        }
                                    }}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#4AB1F4] transition-colors"
                                >
                                    Continue to Delivery <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </motion.div>
                        )}

                        {step === 'delivery' && (
                            <motion.div key="delivery" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#4AB1F4] font-black flex items-center justify-center">2</div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Delivery</h3>
                                </div>

                                <div className="grid gap-4">
                                    <button type="button" onClick={() => setDeliveryMethod('standard')} className={`rounded-xl border p-4 text-left transition-colors ${deliveryMethod === 'standard' ? 'border-[#4AB1F4] bg-[#4AB1F4]/10' : 'border-slate-200 bg-white'}`}>
                                        <p className="text-sm font-black text-slate-900">Standard Shipping</p>
                                        <p className="text-xs font-semibold text-slate-500">3-5 business days • Free</p>
                                    </button>
                                    <button type="button" onClick={() => setDeliveryMethod('express')} className={`rounded-xl border p-4 text-left transition-colors ${deliveryMethod === 'express' ? 'border-[#4AB1F4] bg-[#4AB1F4]/10' : 'border-slate-200 bg-white'}`}>
                                        <p className="text-sm font-black text-slate-900">Express Shipping</p>
                                        <p className="text-xs font-semibold text-slate-500">1-2 business days • $5.99</p>
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep('shipping')} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-100 transition-colors">Back</button>
                                    <button type="button" onClick={async () => {
                                        setIsProcessing(true);
                                        try {
                                            const itemsToOrder = cartItems.map((item) => ({
                                                productId: item.product.id,
                                                quantity: item.quantity,
                                            }));
                                            const { clientSecret: secret } = await createPaymentIntent(itemsToOrder, deliveryMethod);
                                            setClientSecret(secret);
                                            setStep('payment');
                                        } catch (err: any) {
                                            toast.error(err.message || 'Failed to initialize payment');
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    }} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#4AB1F4] transition-colors">
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Continue to Payment <ArrowRight className="ml-2 h-4 w-4" /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#4AB1F4] font-black flex items-center justify-center">3</div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Payment</h3>
                                </div>


                                {isGuestCheckout && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Checkout Mode</p>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <button type="button" onClick={() => setCheckoutMode('guest')} className={`rounded-xl border px-4 py-3 text-left ${checkoutMode === 'guest' ? 'border-[#4AB1F4] bg-[#4AB1F4]/10' : 'border-slate-200'}`}>
                                                <p className="text-sm font-black text-slate-900">Guest Checkout</p>
                                                <p className="text-xs font-semibold text-slate-500">No password required</p>
                                            </button>
                                            <button type="button" onClick={() => setCheckoutMode('save')} className={`rounded-xl border px-4 py-3 text-left ${checkoutMode === 'save' ? 'border-[#4AB1F4] bg-[#4AB1F4]/10' : 'border-slate-200'}`}>
                                                <p className="text-sm font-black text-slate-900">Save My Details</p>
                                                <p className="text-xs font-semibold text-slate-500">OTP email verification</p>
                                            </button>
                                        </div>

                                        {checkoutMode === 'save' && (
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email Verification</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={handleSendOtp} className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white hover:bg-[#4AB1F4] transition-colors"><Mail className="mr-2 h-3 w-3" />{otpSent ? 'Resend Code' : 'Send Code'}</button>
                                                    <input
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        placeholder="6-digit code"
                                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold tracking-[0.2em]"
                                                    />
                                                    <button type="button" onClick={handleVerifyOtp} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-100 transition-colors">Verify</button>
                                                </div>
                                                {otpVerified && (
                                                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Verified. Details will be saved.</p>
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
