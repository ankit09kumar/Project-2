import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, DollarSign, Calendar, Users, Briefcase, Plus, Filter } from 'lucide-react';

export const BrowseProjects: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Figma', 'Optimization'];

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/projects?status=OPEN';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (budgetMin) url += `&budgetMin=${budgetMin}`;
      if (budgetMax) url += `&budgetMax=${budgetMax}`;
      if (selectedTag) url += `&skills=${selectedTag}`;

      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to load listings');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, budgetMin, budgetMax, selectedTag]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight">Open Opportunities</h1>
          <p className="text-slate-400 text-xs mt-1">Explore and place proposals on active listings</p>
        </div>
        {user?.role === 'CLIENT' && (
          <Link
            to="/post-project"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white btn-primary active:scale-[0.98] transition-transform"
          >
            <Plus size={16} />
            Post a New Project
          </Link>
        )}
      </div>

      {/* Filter and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2 mb-4">
              <Filter size={16} className="text-indigo-400" />
              Filter Options
            </h3>

            {/* Keyword Search */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="React, REST API..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full glass-input py-2 pl-9 pr-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Budget Fields */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Budget Range ($)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full glass-input py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full glass-input py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Reset Filters */}
            {(search || budgetMin || budgetMax || selectedTag) && (
              <button
                onClick={() => {
                  setSearch('');
                  setBudgetMin('');
                  setBudgetMax('');
                  setSelectedTag(null);
                }}
                className="w-full mt-2 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20 bg-indigo-500/5 rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Quick Categories list */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white font-outfit mb-3">Popular Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-900/40 text-slate-400 border border-slate-800/80 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Main Section */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="glass-panel p-8 text-center text-rose-400 rounded-2xl">{error}</div>
          ) : projects.length === 0 ? (
            <div className="glass-panel p-16 text-center text-slate-500 rounded-2xl">
              <Briefcase className="mx-auto mb-3 text-slate-600" size={32} />
              <p className="text-sm font-medium">No open projects match your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-panel glass-panel-hover p-6 rounded-2xl cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white font-outfit hover:text-indigo-400 transition-colors">
                        {project.title}
                      </h2>
                      {/* Description truncate */}
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    {/* Budget Badge */}
                    <div className="text-left sm:text-right shrink-0">
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <DollarSign size={10} />
                        {project.budgetType === 'FIXED'
                          ? `$${project.budgetMin} - $${project.budgetMax}`
                          : `$${project.budgetMin} - $${project.budgetMax} / hr`}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1.5 font-semibold uppercase tracking-wider">
                        {project.budgetType} Budget
                      </span>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-900/60 text-[10px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={project.client?.avatarUrl}
                        alt={project.client?.name}
                        className="h-4 w-4 rounded-full bg-slate-800 object-cover"
                      />
                      <span>Posted by {project.client?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">•</div>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-indigo-400" />
                      <span>{project._count?.bids || 0} Proposals</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">•</div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-purple-400" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BrowseProjects;
