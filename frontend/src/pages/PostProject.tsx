import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, DollarSign, Calendar, Sparkles } from 'lucide-react';

export const PostProject: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState<'FIXED' | 'HOURLY'>('FIXED');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'CLIENT') {
      navigate('/browse');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    if (Number(budgetMin) > Number(budgetMax)) {
      setError('Minimum budget cannot exceed maximum budget.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          budgetType,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post project');

      alert('Project posted successfully!');
      navigate(`/projects/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)]">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-[60px] pointer-events-none" />

        <div className="mb-8 border-b border-slate-900 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit flex items-center gap-2">
            <Sparkles size={24} className="text-indigo-400" />
            Publish a Project Brief
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">Define your deliverables and budget limits to attract top-tier freelancers</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Design a Figma dashboard and code the React app"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input py-3.5 px-4 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Brief & Details</label>
            <textarea
              required
              placeholder="Provide a clear description of the tasks, required skills, tools, and expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input py-3.5 px-4 rounded-xl text-sm text-white focus:outline-none min-h-[160px]"
            />
          </div>

          {/* Budget Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Model</label>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-900">
                <button
                  type="button"
                  onClick={() => setBudgetType('FIXED')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    budgetType === 'FIXED' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType('HOURLY')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    budgetType === 'HOURLY' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hourly
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Budget ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  required
                  placeholder="500"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full glass-input py-3 pl-9 pr-4 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Budget ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  required
                  placeholder="1500"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full glass-input py-3 pl-9 pr-4 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-sm text-white btn-primary active:scale-[0.98] transition-transform disabled:opacity-55"
          >
            {loading ? 'Publishing...' : 'Publish Project Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default PostProject;
