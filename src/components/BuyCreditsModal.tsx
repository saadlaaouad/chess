import React, { useState } from 'react';
import { X, Sparkles, Check, ShieldCheck, Zap, CreditCard, Gift, Trophy } from 'lucide-react';
import { addCredits } from '../lib/credits';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: string;
  popular?: boolean;
  badge?: string;
  description: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_starter',
    name: 'Rookie Pack',
    credits: 10,
    price: '$1.99',
    description: 'Perfect for quick game analysis and tactical tips.',
  },
  {
    id: 'pack_pro',
    name: 'Grandmaster Pack',
    credits: 50,
    price: '$4.99',
    popular: true,
    badge: 'MOST POPULAR',
    description: 'Deep game breakdowns, opening strategy & threat detection.',
  },
  {
    id: 'pack_legend',
    name: 'Legend Pack',
    credits: 150,
    price: '$9.99',
    badge: 'BEST VALUE',
    description: 'Unlimited AI coaching for serious competitive players.',
  },
];

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, currentBalance }) => {
  const [selectedPack, setSelectedPack] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTxn, setCompletedTxn] = useState<{ txnId: string; credits: number; price: string } | null>(null);

  if (!isOpen) return null;

  const handleSimulatedCheckout = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const mockTxnId = `PP-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      addCredits(selectedPack.credits, 'PayPal Credit Top-up');

      setCompletedTxn({
        txnId: mockTxnId,
        credits: selectedPack.credits,
        price: selectedPack.price,
      });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1e1c18] border border-[#36322b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#282520] to-[#1e1c18] border-b border-[#312e2b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#81b64c]/10 border border-[#81b64c]/30 rounded-xl text-[#81b64c]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>AI Coach Credit Store</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40 uppercase font-extrabold tracking-wider">
                  Store
                </span>
              </h2>
              <p className="text-xs text-[#9e9b97]">
                Current Balance:{' '}
                <span className="font-extrabold text-amber-400">{currentBalance} Credits</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8b8885] hover:text-white hover:bg-[#312e2b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {completedTxn ? (
            /* Purchase Completed View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
                <p className="text-sm text-[#bababa]">
                  Added <strong className="text-emerald-400">+{completedTxn.credits} AI Coach Credits</strong> to your balance.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-[#141311] border border-[#312e2b] rounded-xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between text-[#8b8885]">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-white">{completedTxn.txnId}</span>
                </div>
                <div className="flex justify-between text-[#8b8885]">
                  <span>Payment Provider:</span>
                  <span className="text-sky-400 font-bold">PayPal Express Checkout</span>
                </div>
                <div className="flex justify-between text-[#8b8885]">
                  <span>Total Paid:</span>
                  <span className="text-emerald-400 font-black">{completedTxn.price}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCompletedTxn(null);
                  onClose();
                }}
                className="px-6 py-3 bg-[#81b64c] hover:bg-[#92cb59] text-[#161512] font-extrabold rounded-xl text-sm tracking-wide transition-all shadow-lg"
              >
                Done & Start Asking AI Coach
              </button>
            </div>
          ) : (
            <>
              {/* How to Get Credits Banner */}
              <div className="bg-[#282520] border border-[#3a3630] rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white block">Earn Free Credits by Winning Games!</span>
                    <span className="text-[#a09d98]">Win any match against online players or bot to earn +3 credits.</span>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 bg-amber-500/20 text-amber-300 font-extrabold rounded-lg border border-amber-500/30">
                  +3 Free / Win
                </span>
              </div>

              {/* Package Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CREDIT_PACKS.map((pack) => {
                  const isSelected = selectedPack.id === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`relative cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#2b2721] border-[#81b64c] ring-2 ring-[#81b64c]/40 shadow-xl'
                          : 'bg-[#22201c] border-[#312e2b] hover:border-[#4d4944]'
                      }`}
                    >
                      {pack.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#81b64c] text-[#161512] font-black text-[10px] rounded-full uppercase tracking-wider shadow-md">
                          {pack.badge}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-start pt-1">
                          <h3 className="font-extrabold text-white text-sm">{pack.name}</h3>
                          {isSelected && <Check className="w-4 h-4 text-[#81b64c]" />}
                        </div>

                        <div className="text-3xl font-black text-amber-400 flex items-baseline gap-1">
                          <span>{pack.credits}</span>
                          <span className="text-xs text-[#8b8885] font-normal">Credits</span>
                        </div>

                        <p className="text-xs text-[#9e9b97] leading-relaxed">{pack.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#312e2b] flex items-center justify-between">
                        <span className="text-lg font-black text-white">{pack.price}</span>
                        <span className="text-[10px] text-[#81b64c] font-bold uppercase">Select</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Provider Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-[#b5b2ae] uppercase tracking-wider block">
                  Select Payment Gateway
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#003087]/20 border-[#0079C1] text-sky-300 ring-2 ring-[#0079C1]/30'
                        : 'bg-[#181714] border-[#312e2b] text-[#8b8885] hover:border-[#4d4944]'
                    }`}
                  >
                    <span className="font-extrabold tracking-tight text-sky-400 italic">PayPal</span>
                    <span>Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#81b64c]/20 border-[#81b64c] text-[#81b64c] ring-2 ring-[#81b64c]/30'
                        : 'bg-[#181714] border-[#312e2b] text-[#8b8885] hover:border-[#4d4944]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              {/* PayPal Checkout Button Simulation */}
              <div className="bg-[#141311] border border-[#312e2b] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8b8885]">Selected Bundle:</span>
                  <span className="font-extrabold text-white">
                    {selectedPack.name} ({selectedPack.credits} Credits)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#282520]">
                  <span className="text-[#8b8885]">Total Amount:</span>
                  <span className="font-black text-emerald-400 text-sm">{selectedPack.price}</span>
                </div>

                <button
                  onClick={handleSimulatedCheckout}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-[#FFC439] hover:bg-[#f2b830] text-[#003087] font-black text-sm uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="font-black italic">PayPal</span>
                      <span>Pay {selectedPack.price} Now</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#716e6a] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-Bit SSL Encrypted & Instant Credit Activation</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
