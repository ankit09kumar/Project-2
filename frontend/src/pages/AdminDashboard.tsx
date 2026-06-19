import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, ShieldAlert, BarChart3, Scale, UserCheck, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'disputes' | 'users' | 'analytics'>('disputes');

  // Admin states
  const [analytics, setAnalytics] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Analytics
      const analRes = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // 2. Fetch Disputes
      const dispRes = await fetch('http://localhost:5000/api/admin/disputes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // 3. Fetch Users
      const userRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (analRes.ok && dispRes.ok && userRes.ok) {
        const analData = await analRes.json();
        const dispData = await dispRes.json();
        const userData = await userRes.json();

        setAnalytics(analData);
        setDisputes(dispData);
        setUsers(userData);
      } else {
        throw new Error('Failed to load admin console information');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const handleResolveDispute = async (disputeId: number, action: 'REFUND_CLIENT' | 'RELEASE_FREELANCER') => {
    if (!window.confirm(`Are you sure you want to resolve this dispute? Action: ${action === 'REFUND_CLIENT' ? 'Refund Client' : 'Release to Freelancer'}`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve dispute');

      alert('Dispute resolved successfully!');
      fetchAdminData(); // reload stats
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#0b0f19]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)]">
      {/* Title */}
      <div className="mb-8 border-b border-slate-900 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <ShieldCheck size={28} className="text-amber-400" />
            Lumina Admin Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">Mediate transaction disputes, review platform metrics, and manage user privileges</p>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'disputes' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale size={14} />
            Dispute Cases ({disputes.filter(d => d.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'users' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            Platform Users
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-6 text-rose-400 text-xs rounded-2xl mb-6">{error}</div>
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-outfit">Open Dispute Review Queue</h2>

          {disputes.length === 0 ? (
            <div className="glass-panel p-16 text-center text-slate-500 rounded-3xl">No dispute tickets submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="font-bold text-sm text-white">Dispute #{dispute.id} on Contract #{dispute.contractId}</h3>
                      <span className="text-[10px] text-slate-400 mt-1 block">Project Title: {dispute.contract?.project?.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Escrow Locked</span>
                      <span className="block text-base font-bold text-rose-400">${dispute.contract?.totalAmount}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-xs space-y-3">
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Dispute Filing Claim</span>
                      <p className="text-slate-300 italic">"{dispute.reason}"</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900/60 text-[10px]">
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider">Client (Employer)</span>
                        <span className="text-white font-semibold">{dispute.contract?.client?.name} ({dispute.contract?.client?.email})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider">Freelancer</span>
                        <span className="text-white font-semibold">{dispute.contract?.freelancer?.name} ({dispute.contract?.freelancer?.email})</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolutions */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      dispute.status === 'OPEN'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      Ticket Status: {dispute.status}
                    </span>

                    {dispute.status === 'OPEN' && (
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'REFUND_CLIENT')}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-semibold rounded-xl transition-all"
                        >
                          Refund Client
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'RELEASE_FREELANCER')}
                          className="px-4 py-2 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 rounded-xl transition-all"
                        >
                          Release to Freelancer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 uppercase font-bold tracking-wider">
                <th className="p-4">User Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Account Role</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4 text-right">Rating Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 bg-[#0e1424]/30">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{item.name}</td>
                  <td className="p-4">{item.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      item.role === 'ADMIN'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : item.role === 'CLIENT'
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-400 font-semibold">${item.balance.toFixed(2)}</td>
                  <td className="p-4 text-right font-bold text-amber-400">★ {item.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-outfit">Platform System Metrics</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="glass-panel p-6 rounded-2xl text-center">
              <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gross Contract Volume</span>
              <p className="text-3xl font-extrabold text-white font-outfit mt-1">${analytics.metrics.totalVolume.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Secured Escrow Balance</span>
              <p className="text-3xl font-extrabold text-emerald-400 font-outfit mt-1">${analytics.metrics.escrowBalance.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider font-semibold">Total Platforms Users</span>
              <p className="text-3xl font-extrabold text-indigo-400 font-outfit mt-1">{analytics.metrics.totalUsers} Accounts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
