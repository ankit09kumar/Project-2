import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, Briefcase, FileText, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fallback / mock visual data for dashboard charts
  const clientChartData = [
    { month: 'Jan', spent: 1200 },
    { month: 'Feb', spent: 3400 },
    { month: 'Mar', spent: 2200 },
    { month: 'Apr', spent: 4500 },
    { month: 'May', spent: 2900 },
    { month: 'Jun', spent: 5000 }
  ];

  const freelancerChartData = [
    { month: 'Jan', earnings: 800 },
    { month: 'Feb', earnings: 1500 },
    { month: 'Mar', earnings: 3200 },
    { month: 'Apr', earnings: 2100 },
    { month: 'May', earnings: 4400 },
    { month: 'Jun', earnings: 5600 }
  ];

  const fetchDashboardStats = async () => {
    if (!token) return;
    try {
      // Fetch projects & contracts to compile stats locally
      const projRes = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contractRes = await fetch('http://localhost:5000/api/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (projRes.ok && contractRes.ok) {
        const projects = await projRes.json();
        const contracts = await contractRes.json();

        const activeContractsCount = contracts.filter((c: any) => c.status === 'ACTIVE').length;
        const completedContractsCount = contracts.filter((c: any) => c.status === 'COMPLETED').length;
        
        let financialLabel = 'Total Earned';
        let financialSum = 0;

        if (user?.role === 'CLIENT') {
          financialLabel = 'Total Allocated';
          financialSum = contracts.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);
        } else {
          // Freelancer: sum of completed milestones
          financialSum = contracts
            .filter((c: any) => c.status === 'COMPLETED')
            .reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);
        }

        setStats({
          activeContractsCount,
          completedContractsCount,
          financialLabel,
          financialSum,
          projects: projects.slice(0, 3), // active listings
          contracts: contracts.slice(0, 3) // recent contracts
        });
      }
    } catch (err) {
      console.error('Failed to compile dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#0b0f19]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const chartData = user?.role === 'CLIENT' ? clientChartData : freelancerChartData;
  const dataKey = user?.role === 'CLIENT' ? 'spent' : 'earnings';
  const colorAccent = user?.role === 'CLIENT' ? '#818cf8' : '#34d399';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-slate-400 text-xs mt-1">Here is a snapshot of your platform analytics and active work ledger</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Wallet size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wallet Balance</span>
            <span className="block text-xl font-extrabold text-white font-outfit mt-0.5">${user?.balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">{stats?.financialLabel}</span>
            <span className="block text-xl font-extrabold text-white font-outfit mt-0.5">${stats?.financialSum.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <FileText size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Contracts</span>
            <span className="block text-xl font-extrabold text-white font-outfit mt-0.5">{stats?.activeContractsCount}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Settled Projects</span>
            <span className="block text-xl font-extrabold text-white font-outfit mt-0.5">{stats?.completedContractsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Analytics Area */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-4">
            <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider">Financial Overview</h3>
            <span className="text-xs text-indigo-400 flex items-center gap-1">
              Live statistics
            </span>
          </div>

          <div className="h-64 mt-4 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorAccent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colorAccent} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0e1424',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Area type="monotone" dataKey={dataKey} stroke={colorAccent} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity list */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-4">
            <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider">Recent Contracts</h3>
            <Link to="/contracts" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center">
              View All
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-900 space-y-3.5 pt-2">
            {stats?.contracts.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">No active work records found.</div>
            ) : (
              stats?.contracts.map((contract: any) => (
                <div
                  key={contract.id}
                  onClick={() => navigate('/contracts')}
                  className="flex justify-between items-center cursor-pointer pt-3 first:pt-0 hover:opacity-85 transition-opacity"
                >
                  <div>
                    <span className="block text-xs font-bold text-white truncate max-w-[155px]">
                      {contract.project?.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Partner: {user?.role === 'CLIENT' ? contract.freelancer?.name : contract.client?.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-indigo-400">${contract.totalAmount}</span>
                    <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[8px] font-bold bg-slate-800 text-slate-400 uppercase tracking-wider">
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
