import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Truck } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
    onPaymentSuccess: () => void;
    totalAmount: number;
    onBack: () => void;
}

export default function StripePaymentForm({ onPaymentSuccess, totalAmount, onBack }: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // We're handling the redirect manually by using redirect: 'if_required'
            },
            redirect: 'if_required',
        });

        if (error) {
            toast.error(error.message || 'Payment failed. Please try again.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onPaymentSuccess();
        } else {
            toast.error('Payment status: ' + paymentIntent?.status);
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
                <PaymentElement />
            </div>
            
            <div className="flex flex-wrap gap-3">
                <button 
                    type="button" 
                    onClick={onBack} 
                    disabled={isProcessing}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button 
                    type="submit" 
                    disabled={!stripe || isProcessing} 
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-[#4AB1F4] px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_22px_rgba(74,177,244,0.42)] hover:bg-[#2f9ce5] transition-colors disabled:opacity-70"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                    Pay ${totalAmount.toFixed(2)} & Complete Purchase
                </button>
            </div>
        </form>
    );
}
