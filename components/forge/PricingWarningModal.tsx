import React from 'react';
import { useRouter } from 'next/navigation';

// We define the properties (props) this component needs to receive
interface PricingWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingWarningModal({ isOpen, onClose }: PricingWarningModalProps) {
  const router = useRouter();

  // If the modal is not open, we render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-emerald-500/30 rounded-2xl shadow-custom shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center">

          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-5">
            <i className="fi fi-rr-gem"></i>
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-3">Save on fees!</h3>

          <p className="text-secondary mb-8 text-sm leading-relaxed">
            Enabling white label adds a direct <strong>ETH</strong> fee to your transaction. <br /><br />
            Did you know you can avoid this extra cost on every deployment by purchasing a credit pack in <strong>USDC</strong>?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              View Subscription Plans
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Continue with ETH fees
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}