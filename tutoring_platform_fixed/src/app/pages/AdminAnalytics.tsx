import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, DollarSign, BookOpen, Star, AlertTriangle, Shield, UserPlus, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getAnalyticsSummary, getSubjectPopularity, getTopRatedTutors, getStudentEngagement, getPendingFeedback } from "../services/Module_04_API";

const CHART_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#e11d48", "#6366f1"];

type Summary = {
  TotalCompletedSessions: number;
  TotalRevenue: number;
  TotalActiveStudents: number;
  TotalActiveTutors: number;
};
type SubjectItem = { Subject: string; BookingCount: number };
type TopTutor = { TutorProfileId: string; TutorId: number; FullName: string; AverageRating: number; TotalRatings: number; CompletedSessions: number };
type EngagementItem = { StudentId: number; FullName: string; TotalSessions: number; AverageHoursPerSession: number; TotalHours: number };
type PendingRating = { RatingId: number; StudentId: number; TutorId: number; Stars: number; CreatedAt: string };

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [topTutors, setTopTutors] = useState<TopTutor[]>([]);
  const [engagement, setEngagement] = useState<EngagementItem[]>([]);
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', employeeId: '', department: '', password: '' });
  const [adminAdded, setAdminAdded] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, subRes, tutorRes, engRes, pendingRes] = await Promise.all([
          getAnalyticsSummary(),
          getSubjectPopularity(),
          getTopRatedTutors(5),
          getStudentEngagement(),
          getPendingFeedback(),
        ]);
        if (sumRes?.StatusCode === 1) setSummary(sumRes.Data);
        if (subRes?.StatusCode === 1) setSubjects(Array.isArray(subRes.Data) ? subRes.Data : []);
        if (tutorRes?.StatusCode === 1) setTopTutors(Array.isArray(tutorRes.Data) ? tutorRes.Data : []);
        if (engRes?.StatusCode === 1) setEngagement(Array.isArray(engRes.Data) ? engRes.Data : []);
        if (pendingRes?.StatusCode === 1) setPendingRatings(Array.isArray(pendingRes.Data) ? pendingRes.Data : []);
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAdded(true);
    setTimeout(() => {
      setShowAddAdmin(false);
      setAdminAdded(false);
      setNewAdmin({ fullName: '', email: '', employeeId: '', department: '', password: '' });
    }, 1500);
  };

  const totalUsers = (summary?.TotalActiveStudents ?? 0) + (summary?.TotalActiveTutors ?? 0);

  const subjectDist = subjects.map((s, i) => ({
    name: s.Subject,
    value: s.BookingCount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const totalSubjectBookings = subjectDist.reduce((sum, s) => sum + s.value, 0);

  const engagementData = engagement.slice(0, 8).map(e => ({
    name: e.FullName.split(" ")[0],
    sessions: e.TotalSessions,
  }));

  const avgPlatformRating = topTutors.length > 0
    ? (topTutors.reduce((sum, t) => sum + t.AverageRating, 0) / topTutors.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Admin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create a new admin account</p>
              </div>
              <button onClick={() => setShowAddAdmin(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">✕</button>
            </div>
            {adminAdded ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">Admin account created!</p>
              </div>
            ) : (
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input type="text" required value={newAdmin.fullName} onChange={e => setNewAdmin({...newAdmin, fullName: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                    placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input type="email" required value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                    placeholder="newadmin@sliit.lk" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID *</label>
                  <input type="text" required value={newAdmin.employeeId} onChange={e => setNewAdmin({...newAdmin, employeeId: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                    placeholder="ADM-2026-002" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <select required value={newAdmin.department} onChange={e => setNewAdmin({...newAdmin, department: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm">
                    <option value="">Select department</option>
                    <option>Operations</option>
                    <option>Academic Affairs</option>
                    <option>Student Services</option>
                    <option>IT Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Temporary Password *</label>
                  <input type="password" required value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                    placeholder="Min. 8 chars, uppercase, number, symbol" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddAdmin(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20">
                    Create Admin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Analytics Panel</h1>
          <p className="text-slate-500 mt-1">Live platform statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddAdmin(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Admin
          </button>
          <Link to="/admin/moderation" className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors">
            <Shield className="w-4 h-4" /> Moderation
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "Total Users", value: loading ? "—" : totalUsers.toLocaleString(), color: "text-violet-600", bg: "bg-violet-50" },
          { icon: BookOpen, label: "Completed Sessions", value: loading ? "—" : (summary?.TotalCompletedSessions ?? 0).toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
          { icon: DollarSign, label: "Total Revenue", value: loading ? "—" : `$${(summary?.TotalRevenue ?? 0).toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Star, label: "Avg Platform Rating", value: loading ? "—" : avgPlatformRating, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Student Engagement Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Student Engagement</h2>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : engagementData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No engagement data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="sessions" name="Sessions" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Sessions by Subject</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : subjectDist.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={subjectDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {subjectDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} formatter={(v: number) => [v, "Sessions"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {subjectDist.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">
                      {totalSubjectBookings > 0 ? Math.round((s.value / totalSubjectBookings) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Platform Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Platform Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Active Students", value: loading ? "—" : (summary?.TotalActiveStudents ?? 0).toLocaleString(), color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Active Tutors", value: loading ? "—" : (summary?.TotalActiveTutors ?? 0).toLocaleString(), color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Completed Sessions", value: loading ? "—" : (summary?.TotalCompletedSessions ?? 0).toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Revenue", value: loading ? "—" : `$${(summary?.TotalRevenue ?? 0).toLocaleString()}`, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-slate-600 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tutors & Alerts */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Top Tutors</h2>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
            ) : topTutors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No ratings yet</p>
            ) : (
              <div className="space-y-3">
                {topTutors.map((t, i) => (
                  <div key={t.TutorId} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm flex-shrink-0">
                      {t.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{t.FullName}</p>
                      <p className="text-[10px] text-slate-400">{t.CompletedSessions} sessions</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-slate-600">{t.AverageRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Feedback</h2>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-3">Loading...</p>
            ) : pendingRatings.length === 0 ? (
              <div className="p-2.5 rounded-xl text-xs bg-emerald-50 text-emerald-700">
                No pending ratings — all feedback reviewed.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRatings.slice(0, 3).map(r => (
                  <div key={r.RatingId} className="p-2.5 rounded-xl text-xs bg-amber-50 text-amber-700">
                    Rating #{r.RatingId}: Student {r.StudentId} rated Tutor {r.TutorId} — {r.Stars}★ awaiting approval
                  </div>
                ))}
                {pendingRatings.length > 3 && (
                  <p className="text-xs text-slate-400 pl-1">+{pendingRatings.length - 3} more pending...</p>
                )}
              </div>
            )}
            <Link to="/admin/moderation" className="mt-3 flex items-center justify-center gap-1 text-sm text-violet-600 font-medium hover:text-violet-800 transition-colors">
              Review All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
