import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, Users, Star, Clock, TrendingUp, Calendar, MessageSquare, ArrowUpRight, BookOpen, Bell, Check, X, ChevronDown } from "lucide-react";
import { tutors, TUTOR_IMAGES } from "../data/mockData";

const earningsData = [
  { month: "Oct", earnings: 920, sessions: 18 },
  { month: "Nov", earnings: 1240, sessions: 24 },
  { month: "Dec", earnings: 1080, sessions: 21 },
  { month: "Jan", earnings: 1580, sessions: 31 },
  { month: "Feb", earnings: 1420, sessions: 28 },
  { month: "Mar", earnings: 860, sessions: 17 },
];

type BookingStatus = "pending" | "approved" | "rejected";

type Notification = {
  id: string;
  student: string;
  avatar: string;
  date: string;
  time: string;
  sessionType: "Individual" | "Group";
  requestedAt: string;
  status: BookingStatus;
  read: boolean;
};

const initialNotifications: Notification[] = [
  { id: "n1", student: "Nethmi Perera", avatar: TUTOR_IMAGES.student, date: "April 10", time: "2:00 PM", sessionType: "Individual", requestedAt: "5 min ago", status: "pending", read: false },
  { id: "n2", student: "Kavya Sharma", avatar: TUTOR_IMAGES.mei, date: "April 11", time: "10:00 AM", sessionType: "Group", requestedAt: "23 min ago", status: "pending", read: false },
  { id: "n3", student: "Roshan Silva", avatar: TUTOR_IMAGES.alex, date: "April 9", time: "4:00 PM", sessionType: "Individual", requestedAt: "1 hr ago", status: "approved", read: true },
];

type UpcomingSession = {
  id: string;
  student: string;
  avatar: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: "Approved" | "Pending";
  sessionType: "Individual" | "Group";
  memberCount?: number;
};

// Only this tutor's sessions (tutorId = "1" = Sarah Johnson)
const upcomingSessions: UpcomingSession[] = [
  { id: "s1", student: "Nethmi Perera", avatar: TUTOR_IMAGES.student, subject: "Calculus", date: "Today", time: "10:00 AM", duration: 60, status: "Approved", sessionType: "Individual" },
  { id: "s2", student: "Kavya Sharma", avatar: TUTOR_IMAGES.mei, subject: "Statistics", date: "Tomorrow", time: "2:00 PM", duration: 45, status: "Pending", sessionType: "Group", memberCount: 4 },
  { id: "s3", student: "Roshan Silva", avatar: TUTOR_IMAGES.alex, subject: "Linear Algebra", date: "Apr 10", time: "11:00 AM", duration: 90, status: "Approved", sessionType: "Individual" },
];

export default function TutorDashboard() {
  const tutor = tutors[0]; // logged-in tutor
  const totalEarnings = earningsData.reduce((a, b) => a + b.earnings, 0);
  const totalSessions = earningsData.reduce((a, b) => a + b.sessions, 0);

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  const handleApprove = (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, status: "approved", read: true } : n));
  };

  const handleReject = (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, status: "rejected", read: true } : n));
  };

  const openNotifications = () => {
    setShowNotifications(v => !v);
    // Mark all as read when panel is opened
    setTimeout(() => setNotifications(ns => ns.map(n => ({ ...n, read: true }))), 800);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src={tutor.avatar} alt={tutor.name} className="w-12 h-12 rounded-2xl object-cover" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome back, Sarah 👋</h1>
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
              onClick={openNotifications}
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
                    <button onClick={markAllRead} className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">Mark all read</button>
                    <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
                  )}
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 transition-colors ${!n.read ? "bg-violet-50/60" : "bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <img src={n.avatar} alt={n.student} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {n.sessionType === "Group" ? "Group session request" : "New booking request"} from <span className="text-violet-700">{n.student}</span>
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs text-slate-500">{n.date} at {n.time}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${n.sessionType === "Group" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                              {n.sessionType}
                            </span>
                            <span className="text-[10px] text-slate-400">{n.requestedAt}</span>
                          </div>

                          {n.status === "pending" ? (
                            <div className="flex gap-2 mt-2.5">
                              <button
                                onClick={() => handleApprove(n.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(n.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-200 transition-colors"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-semibold ${n.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                              {n.status === "approved" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {n.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />}
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
          { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, change: "+12%", color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Users, label: "Total Students", value: "47", change: "+8%", color: "text-violet-600", bg: "bg-violet-50" },
          { icon: BookOpen, label: "Sessions Done", value: totalSessions.toString(), change: "+5%", color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Star, label: "Avg Rating", value: tutor.rating.toString(), change: "+0.1", color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ icon: Icon, label, value, change, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> {change}
              </span>
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
              <h2 className="font-semibold text-slate-800">Earnings Overview</h2>
              <select className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none">
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v}`, "Earnings"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="earnings" stroke="#7c3aed" strokeWidth={2.5} fill="url(#earningsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-5">Sessions Per Month</h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={earningsData}>
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
          {/* Upcoming Sessions — only this tutor's sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" /> Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <img src={s.avatar} alt={s.student} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.student}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-slate-500">{s.subject} · {s.duration}min</p>
                      {s.sessionType === "Group" && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-semibold">
                          Group {s.memberCount ? `(${s.memberCount})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-violet-700">{s.date}</p>
                    <p className="text-[10px] text-slate-400">{s.time}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${s.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 rounded-xl transition-colors flex items-center justify-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">This Month</h2>
            <div className="space-y-3">
              {[
                { label: "Sessions Completed", value: "17", icon: BookOpen, color: "text-violet-600" },
                { label: "Hours Taught", value: "24h", icon: Clock, color: "text-blue-600" },
                { label: "New Students", value: "4", icon: Users, color: "text-emerald-600" },
                { label: "Messages Replied", value: "38", icon: MessageSquare, color: "text-amber-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payout */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
            <p className="text-violet-200 text-sm">Pending Payout</p>
            <p className="text-3xl font-bold mt-1">$386.00</p>
            <p className="text-violet-200 text-xs mt-1">Available March 7, 2026</p>
            <button className="mt-4 w-full py-2 bg-white text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-50 transition-colors">
              Request Early Payout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
