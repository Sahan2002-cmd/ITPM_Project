import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, Clock, Star, Calendar, MessageSquare, Play, ChevronRight, TrendingUp, Award, Sparkles, X } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { getBookingsByStudent } from "../services/Module_02_API";
import { getAllTutors, getUserById } from "../services/Module_01_API";
import { getRatingsByStudent } from "../services/Module_04_API";

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
};

type TutorProfile = {
  Id: string;
  UserId: number;
  FullName: string;
  SubjectsTaught: string[];
  HourlyRate: number;
  IsVerified: boolean;
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

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-600",
  Declined: "bg-rose-100 text-rose-600",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratePopup, setRatePopup] = useState<Booking | null>(null);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [performanceGrade, setPerformanceGrade] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;
      
      const safeFetch = async (p: Promise<any>) => {
        try { return await p; } catch (err) { console.error(err); return null; }
      };

      const [bookRes, tutorRes, ratingRes, userRes] = await Promise.all([
        safeFetch(getBookingsByStudent(user.userId)),
        safeFetch(getAllTutors()),
        safeFetch(getRatingsByStudent(user.userId)),
        safeFetch(getUserById(user.userId)),
      ]);

      const loadedBookings: Booking[] = bookRes?.StatusCode === 1 && Array.isArray(bookRes.Data) ? bookRes.Data : [];
      setBookings(loadedBookings);

      const tutorData = tutorRes?.Data ?? tutorRes;
      if (Array.isArray(tutorData)) {
        setTutors(tutorData);
      }

      if (userRes?.StatusCode === 1 && userRes.Data) {
        setPerformanceScore(userRes.Data.PerformanceScore ?? null);
        setPerformanceGrade(userRes.Data.PerformanceGrade ?? null);
      }

      // Find completed bookings not yet rated — trigger popup for the first one
      const ratedBookingIds = new Set<number>(
        ratingRes?.StatusCode === 1 && Array.isArray(ratingRes.Data)
          ? ratingRes.Data.map((r: any) => r.BookingId)
          : []
      );
      const unrated = loadedBookings.filter(
        b => b.Status === "Completed" && b.BookingId && !ratedBookingIds.has(b.BookingId)
      );
      if (unrated.length > 0) setRatePopup(unrated[0]);
      
      setLoading(false);
    };
    fetchData();
  }, [user?.userId]);

  const tutorMap = new Map<string, TutorProfile>(tutors.map(t => [t.Id, t]));

  // Derive sessions-per-month from real bookings (last 6 months, SLST)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  const monthCount: Record<string, number> = {};
  bookings.forEach(b => {
    if (!b.SessionDate) return;
    const d = new Date(b.SessionDate.endsWith("Z") ? b.SessionDate : b.SessionDate + "Z");
    d.setMinutes(d.getMinutes() + 330);
    const key = MONTHS[d.getMonth()];
    monthCount[key] = (monthCount[key] || 0) + 1;
  });
  const sessionsByMonth = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = MONTHS[d.getMonth()];
    return { month: label, sessions: monthCount[label] || 0 };
  });

  // Derive subject engagement from tutors booked
  const SUBJECT_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#e11d48"];
  const subjectCount: Record<string, number> = {};
  bookings.forEach(b => {
    tutorMap.get(b.TutorProfileId)?.SubjectsTaught?.forEach(s => {
      subjectCount[s] = (subjectCount[s] || 0) + 1;
    });
  });
  const subjectEntries = Object.entries(subjectCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSubjectCnt = subjectEntries[0]?.[1] ?? 1;
  const subjectData = subjectEntries.map(([subject, cnt], i) => ({
    subject,
    progress: Math.round((cnt / maxSubjectCnt) * 100),
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const upcomingBookings = bookings.filter(b => b.Status === "Confirmed");
  const completedSessions = bookings.filter(b => b.Status === "Completed").length;
  const nextSession = upcomingBookings[0];
  const nextTutor = nextSession ? tutorMap.get(nextSession.TutorProfileId) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Rate Session Popup ────────────────────────────────────────── */}
      {ratePopup && !popupDismissed && (() => {
        const popupTutor = tutorMap.get(ratePopup.TutorProfileId);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Rate your experience!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                How was your session with <span className="font-semibold text-slate-700 dark:text-slate-200">{popupTutor?.FullName ?? "your tutor"}</span>?
              </p>
              <p className="text-xs text-slate-400 mb-5">
                {popupTutor?.SubjectsTaught?.[0] ?? "Session"} &middot; Booking #{ratePopup.BookingId}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPopupDismissed(true)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>
                <Link
                  to="/student/session/review"
                  state={{
                    bookingId: ratePopup.BookingId,
                    tutorProfileId: ratePopup.TutorProfileId,
                    tutorId: ratePopup.TutorId,
                    tutorName: popupTutor?.FullName ?? "Tutor",
                    sessionDate: ratePopup.SessionDate,
                    subject: popupTutor?.SubjectsTaught?.[0] ?? "Session",
                  }}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                  onClick={() => setPopupDismissed(true)}
                >
                  Rate Now
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 ring-2 ring-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl">
              {user?.name?.charAt(0)?.toUpperCase() ?? "S"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Good morning, {user?.name?.split(" ")[0] ?? "Student"}! 🌟</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Keep up your learning streak!</p>
          </div>
        </div>
        <Link to="/student/browse" className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40">
          <BookOpen className="w-4 h-4" /> Book a Session
        </Link>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "Sessions Booked", value: loading ? "—" : bookings.length.toString(), sub: "total", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-100 dark:border-violet-800" },
          { icon: Clock, label: "Upcoming Sessions", value: loading ? "—" : upcomingBookings.length.toString(), sub: "confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-800" },
          { icon: Star, label: "Completed Sessions", value: loading ? "—" : completedSessions.toString(), sub: "finished", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-800" },
          { icon: TrendingUp, label: "Tutors Booked", value: loading ? "—" : new Set(bookings.map(b => b.TutorProfileId)).size.toString(), sub: "unique tutors", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800" },
        ].map(({ icon: Icon, label, value, sub, color, bg, border }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sessions Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-white text-lg">Sessions Over Time</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sessionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={3} dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Subject Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-5 text-lg">Subject Progress</h2>
            <div className="space-y-5">
              {subjectData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Book a session to see your subject progress</p>
              ) : (
                subjectData.map(({ subject, progress, color }) => (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{subject}</span>
                      <span className="font-bold text-base" style={{ color }}>{progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Booking History Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800 dark:text-white text-lg">Recent Bookings</h2>
              <Link to="/student/history" className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map(b => {
                  const t = tutorMap.get(b.TutorProfileId);
                  return (
                    <div key={b.Id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                      <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold ring-2 ring-slate-100 dark:ring-slate-700">
                        {t?.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{t?.FullName ?? "Tutor"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{toSlstDateStr(b.SessionDate)} · {toSlstTime(b.StartTime)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.Status] ?? "bg-slate-100 text-slate-600"}`}>
                          {b.Status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Next Session */}
          {nextSession && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-700 dark:to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/30"
            >
              <p className="text-violet-200 dark:text-violet-300 text-sm font-medium mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Next Session
              </p>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl border-2 border-white/40">
                  {nextTutor?.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                </div>
                <div>
                  <p className="font-semibold text-lg">{nextTutor?.FullName ?? "Tutor"}</p>
                  <p className="text-violet-200 dark:text-violet-300 text-sm">{nextTutor?.SubjectsTaught?.[0] ?? ""}</p>
                </div>
              </div>
              <p className="text-violet-100 dark:text-violet-200 text-sm font-medium mb-4">
                {toSlstDateStr(nextSession.SessionDate)} · {toSlstTime(nextSession.StartTime)}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-white text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-50 transition-colors shadow-md">
                  Join Now
                </button>
                <Link to="/student/chat" className="flex items-center justify-center px-4 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm">
                  <MessageSquare className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-amber-500" /> Achievements
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: "🔥", label: "Active\nLearner", active: bookings.length > 0 },
                { emoji: "📚", label: "5 Sessions\nCompleted", active: completedSessions >= 5 },
                { emoji: "⭐", label: "Top\nStudent", active: false },
                { emoji: "💬", label: "Active\nLearner", active: bookings.length >= 3 },
                { emoji: "🏆", label: "First\nBooking", active: bookings.length >= 1 },
                { emoji: "🎯", label: "Goal\nSetter", active: false },
              ].map(({ emoji, label, active }) => (
                <div key={label} className={`text-center p-3 rounded-xl transition-all ${active ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800" : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-50 grayscale"}`}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-tight whitespace-pre-line">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance Grade */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-violet-500" /> Performance Grade
            </h2>
            {performanceGrade ? (
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0 shadow-sm ${
                  performanceGrade === "A+" ? "bg-emerald-100 text-emerald-700" :
                  performanceGrade === "A"  ? "bg-green-100 text-green-700" :
                  performanceGrade === "B"  ? "bg-blue-100 text-blue-700" :
                  performanceGrade === "C"  ? "bg-amber-100 text-amber-700" :
                  "bg-rose-100 text-rose-700"
                }`}>
                  {performanceGrade}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Score: {performanceScore !== null ? Number(performanceScore).toFixed(2) : "—"} / 5.0
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Based on tutor evaluations</p>
                  <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-36 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${((performanceScore ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-3">
                No evaluations yet. Complete a session to receive a grade.
              </p>
            )}
          </motion.div>

          {/* Recommended Tutors */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg">Recommended Tutors</h2>
            {tutors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Loading tutors...</p>
            ) : (
              <div className="space-y-4">
                {tutors.slice(0, 2).map(t => (
                  <div key={t.Id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                    <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold ring-2 ring-slate-100 dark:ring-slate-700">
                      {t.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{t.FullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">LKR {t.HourlyRate?.toLocaleString()}/hr</p>
                    </div>
                    <Link to={`/student/booking/${t.Id}`} className="px-3 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: "/student/recordings", icon: Play, label: "Recordings", color: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30" },
                { to: "/student/materials", icon: BookOpen, label: "Materials", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
                { to: "/student/chat", icon: MessageSquare, label: "Messages", color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
                { to: "/student/session/review", icon: Star, label: "Reviews", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} transition-all shadow-sm hover:shadow-md`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

