import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Calendar, Users, Briefcase, Star, Send, Clock, UserPlus } from 'lucide-react';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal form state (for Freelancers)
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [bidSubmitLoading, setBidSubmitLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/projects/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to load project details');
      const data = await res.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, token]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate('/auth');
      return;
    }
    setBidSubmitLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: id,
          amount: Number(bidAmount),
          proposal: proposalText,
          deliveryTime: Number(deliveryTime)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit proposal');

      setBidSuccess(true);
      setBidAmount('');
      setDeliveryTime('');
      setProposalText('');
      fetchProjectDetails(); // refresh bids list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBidSubmitLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    if (!window.confirm('Are you sure you want to accept this proposal and enter a milestone contract?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/bids/${bidId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept proposal');

      alert('Proposal accepted! Redirecting to the active contract page...');
      navigate(`/contracts`);
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

  if (error && !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center bg-[#0b0f19]">
        <div className="glass-panel p-8 text-rose-400 rounded-3xl">{error}</div>
      </div>
    );
  }

  const isOwner = user?.id === project.clientId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <span className="inline-flex items-center gap-0.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Briefcase size={12} />
                Open Brief
              </span>
              <span className="text-xl font-bold text-emerald-400">
                ${project.budgetMin} - ${project.budgetMax}
                {project.budgetType === 'HOURLY' && ' / hr'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit leading-tight">
              {project.title}
            </h1>

            <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-slate-400 font-semibold border-b border-slate-900 pb-6">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-400" />
                <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-purple-400" />
                <span>{project.bids?.length || 0} proposals</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-white font-outfit mb-2">Project Specification</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </div>

          {/* Proposal submission form (Freelancers only) */}
          {!isOwner && user?.role === 'FREELANCER' && (
            <div className="glass-panel p-8 rounded-3xl">
              <h2 className="text-lg font-bold text-white font-outfit mb-4">Submit Your Proposal</h2>

              {bidSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center">
                  Your proposal was submitted successfully! You can monitor contract updates or chat with the client.
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bid Amount ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="number"
                          required
                          placeholder="1200"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full glass-input py-3 pl-9 pr-4 rounded-xl text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Delivery Time (Days)</label>
                      <input
                        type="number"
                        required
                        placeholder="5"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full glass-input py-3 px-4 rounded-xl text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Proposal / Cover Letter</label>
                    <textarea
                      required
                      placeholder="Explain your approach, milestones, and relevant experience..."
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      className="w-full glass-input py-3 px-4 rounded-xl text-sm text-white focus:outline-none min-h-[120px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bidSubmitLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white btn-primary flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    {bidSubmitLoading ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* List of current bids (Visible to project client) */}
          {isOwner && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-white font-outfit">Received Proposals ({project.bids?.length || 0})</h2>

              {project.bids?.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-500 rounded-3xl text-xs">
                  No proposals submitted yet.
                </div>
              ) : (
                project.bids.map((bid: any) => (
                  <div key={bid.id} className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-4">
                      {/* Freelancer Profile */}
                      <div className="flex items-center gap-3">
                        <img
                          src={bid.freelancer?.avatarUrl}
                          alt={bid.freelancer?.name}
                          className="h-10 w-10 rounded-full bg-slate-800 object-cover"
                        />
                        <div>
                          <span className="block font-bold text-sm text-white">{bid.freelancer?.name}</span>
                          <div className="flex items-center gap-1 mt-0.5 text-amber-400 text-xs">
                            <Star size={12} fill="currentColor" />
                            <span className="font-semibold">{bid.freelancer?.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bid Specs */}
                      <div className="text-right">
                        <span className="block text-lg font-bold text-indigo-400">${bid.amount}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{bid.deliveryTime} days delivery</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Proposal Letter</h4>
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                        {bid.proposal}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => navigate(`/chat`, { state: { startChatWith: bid.freelancer?.id } })}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                      >
                        Message Freelancer
                      </button>
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        Accept Proposal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Client profile card */}
          <div className="glass-panel p-6 rounded-3xl text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About the Employer</h3>
            <img
              src={project.client?.avatarUrl}
              alt={project.client?.name}
              className="h-16 w-16 mx-auto rounded-full bg-slate-800 object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <h4 className="text-base font-bold text-white font-outfit">{project.client?.name}</h4>
              <div className="flex items-center justify-center gap-1 mt-1 text-amber-400 text-xs">
                <Star size={12} fill="currentColor" />
                <span className="font-semibold">{project.client?.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {project.client?.bio || 'No bio provided.'}
            </p>

            {user?.id !== project.clientId && (
              <button
                onClick={() => navigate(`/chat`, { state: { startChatWith: project.client?.id } })}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-white/5 transition-all"
              >
                Chat with Employer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProjectDetails;
