import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Zap, ArrowRight, Star, Cpu, Palette, MessageSquareCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0b0f19]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-xs font-semibold text-indigo-400 mb-6 font-outfit uppercase tracking-widest animate-pulse">
          <Sparkles size={12} />
          The Future of Freelancing
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl font-outfit max-w-4xl mx-auto leading-none text-white">
          Secure, Premium <span className="text-gradient">Freelance</span> Marketplace
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          Connect with top-tier engineering, design, and product talent. Shield your payments in Stripe escrow milestoned contracts, and coordinate via real-time chats.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          {user ? (
            <Link
              to="/browse"
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white btn-primary flex items-center gap-2 group"
            >
              Browse Projects
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-white btn-primary flex items-center gap-2 group"
              >
                Hire Top Talent
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/auth"
                state={{ tab: 'register' }}
                className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-300 border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:text-white transition-all"
              >
                Apply as Freelancer
              </Link>
            </>
          )}
        </div>

        {/* Live Metrics */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl text-center">
            <p className="text-3xl font-extrabold text-white font-outfit">$4.2M+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Protected Escrow Vol</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center">
            <p className="text-3xl font-extrabold text-white font-outfit">24k+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Vetted Expert Developers</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center">
            <p className="text-3xl font-extrabold text-white font-outfit">99.8%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Dispute Success Rate</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-900">
        <h2 className="text-center text-3xl font-bold font-outfit text-white">Why LuminaWork Leads the Industry</h2>
        <p className="text-center text-xs text-slate-400 mt-2">Engineered for security, ease, and visual clarity</p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="glass-panel p-8 rounded-2xl relative group hover:border-indigo-500/25 transition-all">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Milestone Escrows</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Funds are held securely in a project contract. Freelancers start working with confidence, and clients release payments only when satisfied with the submissions.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl relative group hover:border-purple-500/25 transition-all">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Real-time Sockets</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Chat instantly with prospective hires or clients. Send documents, negotiate bid details, and get live notifications on work progress.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl relative group hover:border-emerald-500/25 transition-all">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Star size={20} />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Fair Dispute Resolution</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              In the rare event of project friction, platform administrators act as impartial judges. Funds are safely split or returned based on evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Design Showcase / Categories */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-900/60 mb-10">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-indigo-950/20 to-purple-950/20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">Ready to scale your next build?</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              Create a client account and list your project specification in under 2 minutes. Receive instant bids from active freelancers.
            </p>
          </div>
          <Link
            to="/auth"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors whitespace-nowrap"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LandingPage;
