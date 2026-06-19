import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, CreditCard, X, ShieldCheck } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { token, user, refreshProfile } = useAuth();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleOpenStripe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }
    setError(null);
    setShowStripeModal(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPaymentLoading(true);
    setError(null);

    // Simulate verification delay
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:5000/api/payments/confirm-deposit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: Number(depositAmount) })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment failed');

        alert(`$${depositAmount} has been credited to your wallet!`);
        setDepositAmount('');
        setShowStripeModal(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        await refreshProfile(); // reload user context balance
      } catch (err: any) {
        setError(err.message);
      } finally {
        setPaymentLoading(false);
      }
    }, 1500);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      alert('Please enter a valid payout amount');
      return;
    }

    if (Number(withdrawAmount) > user!.balance) {
      alert('Insufficient wallet funds.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/payments/payout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');

      alert(`$${withdrawAmount} withdrawal processed!`);
      setWithdrawAmount('');
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)] relative">
      <h1 className="text-3xl font-extrabold text-white font-outfit mb-8 tracking-tight">Payments & Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Wallet Balance Hero Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/5 blur-[40px] pointer-events-none" />

            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <Wallet size={20} />
            </div>

            <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Lumina Wallet Balance</span>
            <span className="block text-4xl font-extrabold text-white font-outfit mt-1">${user?.balance.toFixed(2)}</span>

            <div className="mt-8 flex gap-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>Account: {user?.role}</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Add Funds Form */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
                <ArrowDownLeft size={16} className="text-emerald-400" />
                Add Funds to Wallet
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">Deposit money securely via Stripe. Balance can be used to fund milestones on active contracts.</p>
              
              <form onSubmit={handleOpenStripe} className="space-y-3">
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full glass-input py-3 pl-9 pr-4 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
                >
                  Deposit Funds
                </button>
              </form>
            </div>

            {/* Payout Form */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
                <ArrowUpRight size={16} className="text-indigo-400" />
                Withdraw Earnings (Payout)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">Transfer your wallet balance directly to your designated bank account.</p>

              <form onSubmit={handleWithdraw} className="space-y-3">
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full glass-input py-3 pl-9 pr-4 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
                >
                  Request Payout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Stripe Credit Card Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowStripeModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-white font-outfit mb-6">
              <CreditCard size={20} className="text-indigo-400" />
              <span className="font-extrabold text-lg">Stripe Payment Portal</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 flex justify-between items-center mb-2">
                <span className="text-slate-400">Total charge:</span>
                <span className="text-base font-bold text-white">${depositAmount}</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Credit Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full glass-input py-2.5 px-3.5 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">CVC Security Code</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-55"
              >
                {paymentLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Pay ${depositAmount} Now
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 mt-2">
                <span>Secured by Stripe Escrow Protocol. No real funds charged.</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PaymentsPage;
