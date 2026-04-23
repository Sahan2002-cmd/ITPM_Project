import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, Users, TrendingUp, Calendar, ArrowUpRight, BookOpen, Bell, Check, X, Award } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getBookingsByTutor, acceptBooking, declineBooking, completeBooking } from "../services/Module_02_API";
import { submitEvaluation } from "../services/Module_04_API";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Booking = {
  Id: string;
  BookingId?: number;
  TutorProfileId: string;
  TutorId: number;
  StudentId: number;
  Status: string;
  SessionDate: string;
  StartTime: string;
  EndTime: string;
  CreatedAt?: string;
};

function toSlstTime(utcStr: string): string {
  if (!utcStr) return "";
  return new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z").toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo",
  });
}

function toSlstDateStr(utcStr: string): string {
  if (!utcStr) return "";
  return new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "Asia/Colombo",
  });
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [actionError, setActionError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Evaluation state
  const EVAL_FACTORS = ["Attendance", "Participation", "Understanding", "Behavior", "AssignmentCompletion"] as const;
  const EVAL_LABELS: Record<string, string> = {
    Attendance: "Attendance",
    Participation: "Participation",
    Understanding: "Understanding",
    Behavior: "Behavior",
    AssignmentCompletion: "Assignment Completion",
  };
  const defaultScores = (): Record<string, number> =>
    Object.fromEntries(EVAL_FACTORS.map(f => [f, 3]));

  const [evaluatingBooking, setEvaluatingBooking] = useState<Booking | null>(null);
  const [evalScores, setEvalScores] = useState<Record<string, number>>(defaultScores());
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [evaluatedIds, setEvaluatedIds] = useState<Set<number>>(new Set());

  const fetchBookings = async () => {
    if (!user?.userId) return;
    try {
      const res = await getBookingsByTutor(user.userId);
      if (res?.StatusCode === 1) {
        setBookings(Array.isArray(res.Data) ? res.Data : []);
      }
    } catch {
      // show empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [user?.userId]);

  const pendingBookings = bookings.filter(b => b.Status === "Pending");
  const confirmedBookings = bookings.filter(b => b.Status === "Confirmed");
  const completedBookings = bookings.filter(b => b.Status === "Completed");
  const unreadCount = pendingBookings.length;

  // Derive chart data from real bookings (last 6 months, SLST)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  const bmMap: Record<string, number> = {};
  bookings.forEach(b => {
    if (!b.SessionDate) return;
    const d = new Date(b.SessionDate.endsWith("Z") ? b.SessionDate : b.SessionDate + "Z");
    d.setMinutes(d.getMinutes() + 330);
    const key = MONTHS[d.getMonth()];
    bmMap[key] = (bmMap[key] || 0) + 1;
  });
  const sessionsChartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = MONTHS[d.getMonth()];
    return { month: label, sessions: bmMap[label] || 0 };
  });

  const handleAccept = async (bookingId: number) => {
    if (!bookingId) { setActionError("Booking ID missing."); return; }
    if (!user?.userId) { setActionError("User session missing. Please log in again."); return; }
    setActionError("");
    const res = await acceptBooking(bookingId, user.userId);
    if (res?.StatusCode === 1) {
      await fetchBookings();
    } else {
      setActionError(res?.Message || "Failed to accept booking.");
    }
  };

  const handleDecline = async (bookingId: number) => {
    if (!bookingId) { setActionError("Booking ID missing."); return; }
    if (!user?.userId) { setActionError("User session missing. Please log in again."); return; }
    setActionError("");
    const res = await declineBooking(bookingId, user.userId);
    if (res?.StatusCode === 1) {
      await fetchBookings();
    } else {
      setActionError(res?.Message || "Failed to decline booking.");
    }
  };

  const handleEvaluate = async () => {
    if (!evaluatingBooking) return;
    if (!evaluatingBooking.BookingId) {
      setEvalError("Cannot evaluate: booking ID is missing. Please refresh the page and try again.");
      return;
    }
    setEvalSubmitting(true);
    setEvalError("");
    try {
      const res = await submitEvaluation({
        BookingId: evaluatingBooking.BookingId,
        TutorProfileId: evaluatingBooking.TutorProfileId,
        TutorId: evaluatingBooking.TutorId,
        StudentId: evaluatingBooking.StudentId,
        Attendance: evalScores["Attendance"],
        Participation: evalScores["Participation"],
        Understanding: evalScores["Understanding"],
        Behavior: evalScores["Behavior"],
        AssignmentCompletion: evalScores["AssignmentCompletion"],
      });
      if (res?.StatusCode === 1) {
        setEvaluatedIds(prev => {
          const next = new Set(prev);
          next.add(evaluatingBooking.BookingId!);
          return next;
        });
        setEvaluatingBooking(null);
        setEvalScores(defaultScores());
      } else {
        setEvalError(res?.Message || "Failed to submit evaluation.");
      }
    } catch (err: any) {
      setEvalError(err?.message || "Failed to submit evaluation.");
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleComplete = async (bookingId: number) => {
    if (!bookingId) {
      setActionError("Cannot complete: booking ID is missing. Please refresh the page.");
      return;
    }
    setActionError("");
    setCompletingId(bookingId);
    try {
      const res = await completeBooking(bookingId);
      if (res?.StatusCode === 1) {
        await fetchBookings();
      } else {
        setActionError(res?.Message || "Failed to mark session as completed.");
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to mark session as completed.");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Evaluation Modal ──────────────────────────────────────── */}
      {evaluatingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Evaluate Student</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Student #{evaluatingBooking.StudentId} &middot; Booking #{evaluatingBooking.BookingId}
                </p>
              </div>
              <button
                onClick={() => { setEvaluatingBooking(null); setEvalError(""); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {EVAL_FACTORS.map(factor => (
                <div key={factor}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">{EVAL_LABELS[factor]}</label>
                    <span className="text-sm font-bold text-violet-600">{evalScores[factor]} / 5</span>
                  </div>
                  <input
                    type="range" min={1} max={5} step={1}
                    value={evalScores[factor]}
                    onChange={e => setEvalScores(s => ({ ...s, [factor]: Number(e.target.value) }))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1 – Poor</span><span>3 – Average</span><span>5 – Excellent</span>
                  </div>
                </div>
              ))}
            </div>

            {evalError && (
              <p className="mt-3 text-sm text-rose-600">{evalError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setEvaluatingBooking(null); setEvalError(""); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEvaluate}
                disabled={evalSubmitting}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {evalSubmitting ? "Submitting..." : "Submit Evaluation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() ?? "T"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome back, {user?.name?.split(" ")[0] ?? "Tutor"} 👋</h1>
            <p className="text-sm text-slate-500">Here's your tutoring performance overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Available
          </span>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-600" /> Booking Requests
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-semibold">{unreadCount} new</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                {actionError && (
                  <p className="text-xs text-rose-600 px-4 pt-3">{actionError}</p>
                )}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                  {pendingBookings.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">No pending requests</p>
                  )}
                  {pendingBookings.map(b => (
                    <div key={b.Id} className="p-4 bg-violet-50/60">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                          S
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            Booking request from <span className="text-violet-700">Student #{b.StudentId}</span>
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs text-slate-500">{toSlstDateStr(b.SessionDate)} at {toSlstTime(b.StartTime)}</span>
                          </div>
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => b.BookingId && handleAccept(b.BookingId)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => b.BookingId && handleDecline(b.BookingId)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-200 transition-colors"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                        <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "Confirmed Sessions", value: loading ? "—" : confirmedBookings.length.toString(), color: "text-violet-600", bg: "bg-violet-50" },
          { icon: Users, label: "Pending Requests", value: loading ? "—" : pendingBookings.length.toString(), color: "text-amber-600", bg: "bg-amber-50" },
          { icon: DollarSign, label: "Completed Sessions", value: loading ? "—" : completedBookings.length.toString(), color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: TrendingUp, label: "Total Bookings", value: loading ? "—" : bookings.length.toString(), color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">Sessions Overview</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sessionsChartData}>
                <defs>
                  <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={2.5} fill="url(#sessionsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-5">Sessions Per Month</h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={sessionsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="sessions" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" /> Upcoming Sessions
            </h2>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
            ) : confirmedBookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {confirmedBookings.slice(0, 4).map((b) => (
                  <div key={b.Id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm flex-shrink-0">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">Student #{b.StudentId}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{toSlstTime(b.StartTime)} – {toSlstTime(b.EndTime)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-violet-700">{toSlstDateStr(b.SessionDate)}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block bg-emerald-100 text-emerald-700">
                          Confirmed
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => b.BookingId && handleComplete(b.BookingId)}
                      disabled={completingId === b.BookingId}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      {completingId === b.BookingId ? "Marking..." : "Mark as Completed"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!loading && confirmedBookings.length > 4 && (
              <button className="w-full mt-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 rounded-xl transition-colors flex items-center justify-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Completed Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600" /> Completed Sessions
            </h2>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
            ) : completedBookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No completed sessions yet</p>
            ) : (
              <div className="space-y-3">
                {completedBookings.slice(0, 3).map(b => (
                  <div key={b.Id ?? b.BookingId} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">Student #{b.StudentId}</p>
                        <p className="text-xs text-slate-500">{toSlstDateStr(b.SessionDate)}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">Done</span>
                    </div>
                    {!evaluatedIds.has(b.BookingId!) ? (
                      <button
                        onClick={() => {
                          setEvaluatingBooking(b);
                          setEvalScores(defaultScores());
                          setEvalError("");
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        <Award className="w-3 h-3" /> Evaluate Student
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">
                        <Check className="w-3 h-3" /> Evaluated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Bookings Summary</h2>
            <div className="space-y-3">
              {[
                { label: "Pending Requests", value: loading ? "—" : pendingBookings.length.toString(), color: "text-amber-600" },
                { label: "Confirmed", value: loading ? "—" : confirmedBookings.length.toString(), color: "text-blue-600" },
                { label: "Completed", value: loading ? "—" : completedBookings.length.toString(), color: "text-emerald-600" },
                { label: "Cancelled / Declined", value: loading ? "—" : bookings.filter(b => b.Status === "Cancelled" || b.Status === "Declined").length.toString(), color: "text-rose-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total sessions card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
            <p className="text-violet-200 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold mt-1">{loading ? "—" : bookings.length}</p>
            <p className="text-violet-200 text-xs mt-1">Across all statuses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
