import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Check, X, ChevronDown, Search, MessageSquare, Star } from "lucide-react";
import { getPendingFeedback, moderateFeedback, getAllRatings } from "../services/Module_04_API";

type PendingRating = {
  RatingId: number;
  BookingId: number;
  TutorProfileId: string;
  TutorId: number;
  StudentId: number;
  Stars: number;
  Feedback: string | null;
  FeedbackStatus: string;
  CreatedAt: string;
};

function toSlstDateStr(utcStr: string) {
  if (!utcStr) return "";
  const d = new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z");
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [ratings, setRatings] = useState<PendingRating[]>([]);
  const [allRatingsData, setAllRatingsData] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [allLoading, setAllLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await getPendingFeedback();
      if (res?.StatusCode === 1) setRatings(Array.isArray(res.Data) ? res.Data : []);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setAllLoading(true);
    try {
      const res = await getAllRatings();
      if (res?.StatusCode === 1) setAllRatingsData(Array.isArray(res.Data) ? res.Data : []);
    } catch {
      // show empty state
    } finally {
      setAllLoading(false);
    }
  };

  useEffect(() => { fetchPending(); fetchAll(); }, []);

  const handleModerate = async (ratingId: number, status: "Approved" | "Rejected") => {
    setActionLoading(ratingId);
    setActionError("");
    try {
      const res = await moderateFeedback(ratingId, status);
      if (res?.StatusCode === 1) {
        setRatings(prev => prev.filter(r => r.RatingId !== ratingId));
        setAllRatingsData(prev => prev.map(r =>
          r.RatingId === ratingId ? { ...r, FeedbackStatus: status } : r
        ));
        setExpanded(null);
      } else {
        setActionError(res?.Message || "Action failed. Please try again.");
      }
    } catch {
      setActionError("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = (activeTab === 'pending' ? ratings : allRatingsData).filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(r.StudentId).includes(q) ||
      String(r.TutorId).includes(q) ||
      (r.Feedback?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-600" /> Rating Moderation
          </h1>
          <p className="text-slate-500 mt-1">Review and approve student feedback before publishing</p>
        </div>
        {!loading && ratings.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> {ratings.length} pending review
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('pending'); setExpanded(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Approval
          {!loading && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>{ratings.length}</span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('all'); setExpanded(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Reviews
          {!allLoading && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>{allRatingsData.length}</span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{loading ? "—" : ratings.length}</p>
          <p className="text-sm text-slate-500 mt-1">Pending Approval</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {allLoading ? "—" : allRatingsData.filter(r => r.FeedbackStatus === 'Approved').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">Approved</p>
        </div>
        <div className="bg-violet-50 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{allLoading ? "—" : allRatingsData.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Reviews</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student ID, tutor ID, or feedback text..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {/* Rating List */}
      {(activeTab === 'pending' ? loading : allLoading) ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading ratings...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-slate-600 font-medium">
            {activeTab === 'pending' ? 'No pending ratings' : 'No reviews found'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search.trim() ? "No results match your search." : activeTab === 'pending' ? "All feedback has been reviewed!" : "No reviews have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rating => {
            const isExpanded = expanded === rating.RatingId;
            const isActioning = actionLoading === rating.RatingId;

            return (
              <div key={rating.RatingId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                {/* Main Row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : rating.RatingId)}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Stars visual */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${n <= rating.Stars ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                      {/* Status badge — context-aware */}
                      {rating.FeedbackStatus === 'Approved' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Approved</span>
                      ) : rating.FeedbackStatus === 'Rejected' ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold uppercase">Rejected</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase">Pending Approval</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span>Rating #{rating.RatingId}</span>
                      <span>Student ID: {rating.StudentId}</span>
                      <span>Tutor ID: {rating.TutorId}</span>
                      <span>Booking #{rating.BookingId}</span>
                      <span>{toSlstDateStr(rating.CreatedAt)}</span>
                    </div>
                    {rating.Feedback && (
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-lg">{rating.Feedback}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50">
                    <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Student Feedback
                      </p>
                      {rating.Feedback ? (
                        <p className="text-sm text-slate-700">{rating.Feedback}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No written feedback provided.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {rating.FeedbackStatus === 'Pending Approval' && (
                        <>
                      <button
                        onClick={() => handleModerate(rating.RatingId, "Approved")}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {isActioning ? "Processing..." : "Approve & Publish"}
                      </button>
                      <button
                        onClick={() => handleModerate(rating.RatingId, "Rejected")}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        {isActioning ? "Processing..." : "Reject"}
                      </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
