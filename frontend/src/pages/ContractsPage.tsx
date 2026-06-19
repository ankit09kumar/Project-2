import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, DollarSign, ShieldAlert, CheckCircle2, Send, Star, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const { token, user, refreshProfile } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [workSubmissionText, setWorkSubmissionText] = useState('');
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState<number | null>(null);
  
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchContracts = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load contracts');
      const data = await res.json();
      setContracts(data);

      if (data.length > 0) {
        // Find if we already had a selected contract and update its reference, else select the first one
        if (selectedContract) {
          const updated = data.find((c: any) => c.id === selectedContract.id);
          setSelectedContract(updated || data[0]);
        } else {
          setSelectedContract(data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [token]);

  const handleFundMilestone = async (milestoneId: number) => {
    if (!window.confirm('Do you want to transfer funds from your wallet to escrow for this milestone?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/contracts/milestones/${milestoneId}/fund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fund milestone');

      alert('Milestone funded successfully! Funds are now protected in escrow.');
      refreshProfile(); // sync client balance
      fetchContracts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent, milestoneId: number) => {
    e.preventDefault();
    if (!workSubmissionText.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/contracts/milestones/${milestoneId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workSubmission: workSubmissionText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit work');

      alert('Work submitted to employer review.');
      setWorkSubmissionText('');
      setSubmittingMilestoneId(null);
      fetchContracts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveMilestone = async (milestoneId: number) => {
    if (!window.confirm('Are you satisfied with this submission? Approving will release escrowed funds directly to the freelancer.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/contracts/milestones/${milestoneId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve milestone');

      alert('Milestone approved and funds released!');
      refreshProfile();
      fetchContracts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}/dispute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: disputeReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file dispute');

      alert('Dispute raised. Platform Administrators will contact both parties soon.');
      setDisputeReason('');
      setShowDisputeForm(false);
      fetchContracts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment: reviewComment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviewSubmitted(true);
      setReviewComment('');
      fetchContracts();
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
      <h1 className="text-3xl font-extrabold text-white font-outfit mb-8 tracking-tight">Escrow Contracts</h1>

      {contracts.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 rounded-3xl">
          <FileText className="mx-auto mb-3 text-slate-600" size={36} />
          <p className="text-sm">You do not have any active or completed contracts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contracts Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => {
                  setSelectedContract(contract);
                  setShowDisputeForm(false);
                  setReviewSubmitted(false);
                }}
                className={`glass-panel p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedContract?.id === contract.id
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-lg'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-sm text-white truncate max-w-[150px]">
                    {contract.project?.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    contract.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : contract.status === 'DISPUTED'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {contract.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>
                    Partner: {user?.role === 'CLIENT' ? contract.freelancer?.name : contract.client?.name}
                  </span>
                  <span className="font-semibold text-slate-400">${contract.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Contract Details Pane */}
          {selectedContract && (
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white font-outfit">
                      {selectedContract.project?.title}
                    </h2>
                    <span className="text-xs text-slate-400 mt-1 block">Contract #{selectedContract.id}</span>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Escrow</span>
                      <span className="block text-lg font-bold text-white">${selectedContract.totalAmount}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Escrow</span>
                      <span className="block text-lg font-bold text-emerald-400">${selectedContract.escrowBalance}</span>
                    </div>
                  </div>
                </div>

                {/* Partner Details */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 mb-6 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.role === 'CLIENT' ? selectedContract.freelancer?.avatarUrl : selectedContract.client?.avatarUrl}
                      alt="avatar"
                      className="h-9 w-9 rounded-full bg-slate-800 object-cover"
                    />
                    <div>
                      <span className="block font-bold text-white">
                        {user?.role === 'CLIENT' ? selectedContract.freelancer?.name : selectedContract.client?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {user?.role === 'CLIENT' ? 'Freelancer' : 'Employer'} • {user?.role === 'CLIENT' ? selectedContract.freelancer?.email : selectedContract.client?.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold tracking-wider bg-slate-800 text-slate-400">
                      Partner Profile
                    </span>
                  </div>
                </div>

                {/* Dispute / Completed Alerts */}
                {selectedContract.status === 'DISPUTED' && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl mb-6 flex gap-3">
                    <AlertTriangle size={18} className="shrink-0" />
                    <div>
                      <p className="font-bold">Contract Disputed</p>
                      <p className="mt-1 text-slate-400">Escrow is locked. LuminaWork Admin Panel moderators are reviewing communications to resolve the funds.</p>
                    </div>
                  </div>
                )}

                {/* Milestones list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider">Milestones Ledger</h3>

                  {selectedContract.milestones?.map((milestone: any, idx: number) => (
                    <div key={milestone.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{idx + 1}. {milestone.title}</span>
                          <span className="font-semibold text-slate-400">${milestone.amount}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          milestone.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : milestone.status === 'SUBMITTED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : milestone.status === 'IN_ESCROW'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {milestone.status === 'IN_ESCROW' ? 'Funded (Escrow)' : milestone.status}
                        </span>
                      </div>

                      {/* Work submission details */}
                      {milestone.workSubmission && (
                        <div className="p-3 bg-slate-950/60 rounded-lg text-xs border border-slate-900">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Work Deliverable Submission</p>
                          <p className="text-slate-300 italic">{milestone.workSubmission}</p>
                        </div>
                      )}

                      {/* Action buttons per milestone */}
                      <div className="flex items-center justify-end gap-2 text-xs pt-1">
                        {/* Client Actions */}
                        {user?.role === 'CLIENT' && (
                          <>
                            {milestone.status === 'PENDING' && (
                              <button
                                onClick={() => handleFundMilestone(milestone.id)}
                                className="px-3.5 py-1.5 rounded bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                              >
                                Fund Escrow
                              </button>
                            )}
                            {(milestone.status === 'SUBMITTED' || milestone.status === 'IN_ESCROW') && (
                              <button
                                onClick={() => handleApproveMilestone(milestone.id)}
                                className="px-3.5 py-1.5 rounded bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                              >
                                Approve & Release Payment
                              </button>
                            )}
                          </>
                        )}

                        {/* Freelancer Actions */}
                        {user?.role === 'FREELANCER' && (
                          <>
                            {milestone.status === 'IN_ESCROW' && submittingMilestoneId !== milestone.id && (
                              <button
                                onClick={() => setSubmittingMilestoneId(milestone.id)}
                                className="px-3.5 py-1.5 rounded bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                              >
                                Submit Deliverables
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Deliverable submit form */}
                      {submittingMilestoneId === milestone.id && (
                        <form
                          onSubmit={(e) => handleSubmitWork(e, milestone.id)}
                          className="mt-3 p-4 bg-slate-950/80 border border-slate-900 rounded-xl space-y-3"
                        >
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Describe Completed Work / Attach URL</label>
                            <textarea
                              required
                              placeholder="e.g. Dashboard component fully configured. Demo link: https://github.com/myusername/project"
                              value={workSubmissionText}
                              onChange={(e) => setWorkSubmissionText(e.target.value)}
                              className="w-full glass-input py-2 px-3 rounded-lg text-xs text-white focus:outline-none min-h-[60px]"
                            />
                          </div>
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setSubmittingMilestoneId(null)}
                              className="px-3 py-1.5 text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-semibold flex items-center gap-1"
                            >
                              <Send size={10} />
                              Submit
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dispute / Review Footer Actions */}
                {selectedContract.status === 'ACTIVE' && (
                  <div className="mt-8 pt-6 border-t border-slate-900 flex justify-end">
                    {!showDisputeForm ? (
                      <button
                        onClick={() => setShowDisputeForm(true)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert size={14} />
                        Raise Dispute Concern
                      </button>
                    ) : (
                      <form onSubmit={handleRaiseDispute} className="w-full bg-slate-950/60 p-4 border border-slate-900 rounded-2xl space-y-3">
                        <div className="flex gap-2 text-amber-400 text-xs font-semibold mb-1">
                          <AlertTriangle size={16} />
                          <span>Raising a dispute locks contract escrows. Admins will arbitrate.</span>
                        </div>
                        <textarea
                          required
                          placeholder="Describe the issue or disagreement in detail..."
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="w-full glass-input py-2.5 px-3 rounded-xl text-xs text-white focus:outline-none min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowDisputeForm(false)}
                            className="px-3 py-1.5 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg"
                          >
                            Submit Dispute File
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Post review form */}
                {selectedContract.status === 'COMPLETED' && (
                  <div className="mt-8 pt-6 border-t border-slate-900 space-y-4">
                    <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      Contract Fully Settled
                    </h3>

                    {reviewSubmitted ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center">
                        Thank you! Your feedback review has been submitted successfully.
                      </div>
                    ) : (
                      <form onSubmit={handleLeaveReview} className="space-y-3">
                        <p className="text-xs text-slate-400">Submit a feedback rating for your partner on this contract:</p>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-400 mr-2">Stars:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`p-1 hover:scale-110 transition-transform ${
                                star <= rating ? 'text-amber-400' : 'text-slate-600'
                              }`}
                            >
                              <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          required
                          placeholder="Write feedback comments about your experience..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full glass-input py-2.5 px-3 rounded-xl text-xs text-white focus:outline-none min-h-[60px]"
                        />

                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-xs transition-colors"
                        >
                          Submit Feedback Review
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ContractsPage;
