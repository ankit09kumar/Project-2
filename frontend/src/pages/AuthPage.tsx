import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, User, Briefcase, Mail, Lock, FileText, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab switching: 'login' or 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('FREELANCER');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  useEffect(() => {
    const state = location.state as { tab?: 'login' | 'register' };
    if (state?.tab) {
      setActiveTab(state.tab);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = activeTab === 'login' ? 'login' : 'register';
    const payload = activeTab === 'login' 
      ? { email, password }
      : { 
          email, 
          password, 
          name, 
          role, 
          bio, 
          skills: skills ? skills.split(',').map(s => s.trim()) : [] 
        };

    try {
      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#0b0f19] px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Toggle Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-3xl font-extrabold font-outfit text-white tracking-tight">
              Lumina<span className="text-indigo-400">Work</span>
            </span>
            <p className="text-slate-400 text-xs mt-1.5">Premium Freelance Project Escrow Platform</p>
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-900 mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'login' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'register' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                {/* Visual Role Selector */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div
                    onClick={() => setRole('FREELANCER')}
                    className={`p-4 rounded-2xl cursor-pointer border text-center transition-all ${
                      role === 'FREELANCER'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <Briefcase size={22} className={`mx-auto mb-2 ${role === 'FREELANCER' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="block text-xs font-bold text-white">Freelancer</span>
                    <span className="block text-[10px] text-slate-400 mt-1">Place bids & earn</span>
                  </div>

                  <div
                    onClick={() => setRole('CLIENT')}
                    className={`p-4 rounded-2xl cursor-pointer border text-center transition-all ${
                      role === 'CLIENT'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <User size={22} className={`mx-auto mb-2 ${role === 'CLIENT' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="block text-xs font-bold text-white">Client</span>
                    <span className="block text-[10px] text-slate-400 mt-1">Post projects & hire</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Short Bio</label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full glass-input py-3 px-4 rounded-xl text-sm text-white focus:outline-none min-h-[70px] resize-none"
                  />
                </div>

                {role === 'FREELANCER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Skills (comma separated)</label>
                    <input
                      type="text"
                      placeholder="React, TypeScript, CSS, Node.js"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full glass-input py-3 px-4 rounded-xl text-sm text-white focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white btn-primary active:scale-[0.98] transition-transform disabled:opacity-55"
            >
              {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Quick Seed Toggles */}
          <div className="mt-8 pt-6 border-t border-slate-900 text-center">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3">Quick Login (Demo Accounts)</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  setEmail('client@luminawork.com');
                  setPassword('password123');
                  setActiveTab('login');
                }}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-all hover:border-slate-700"
              >
                Client Demo
              </button>
              <button
                onClick={() => {
                  setEmail('freelancer@luminawork.com');
                  setPassword('password123');
                  setActiveTab('login');
                }}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-all hover:border-slate-700"
              >
                Freelancer Demo
              </button>
              <button
                onClick={() => {
                  setEmail('admin@luminawork.com');
                  setPassword('password123');
                  setActiveTab('login');
                }}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-all hover:border-slate-700"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
