import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, DollarSign, BookOpen, TrendingUp, ArrowUpRight, ArrowDownRight, Star, AlertTriangle, Shield, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { tutors } from "../data/mockData";
import { useState } from "react";

const userGrowth = [
  { month: "Oct", students: 120, tutors: 18 },
  { month: "Nov", students: 165, tutors: 24 },
  { month: "Dec", students: 148, tutors: 22 },
  { month: "Jan", students: 210, tutors: 31 },
  { month: "Feb", students: 268, tutors: 38 },
  { month: "Mar", students: 184, tutors: 27 },
];

const revenueData = [
  { month: "Oct", revenue: 4200, payout: 3360 },
  { month: "Nov", revenue: 6800, payout: 5440 },
  { month: "Dec", revenue: 5900, payout: 4720 },
  { month: "Jan", revenue: 9400, payout: 7520 },
  { month: "Feb", revenue: 8700, payout: 6960 },
  { month: "Mar", revenue: 5100, payout: 4080 },
];

const subjectDist = [
  { name: "Mathematics", value: 32, color: "#7c3aed" },
  { name: "Programming", value: 24, color: "#0ea5e9" },
  { name: "Physics", value: 18, color: "#10b981" },
  { name: "English", value: 14, color: "#f59e0b" },
  { name: "Other", value: 12, color: "#e2e8f0" },
];

export default function AdminAnalytics() {
  const totalRevenue = revenueData.reduce((a, b) => a + b.revenue, 0);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', employeeId: '', department: '', password: '' });
  const [adminAdded, setAdminAdded] = useState(false);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real system, this would call an API. For now, simulate success.
    setAdminAdded(true);
    setTimeout(() => {
      setShowAddAdmin(false);
      setAdminAdded(false);
      setNewAdmin({ fullName: '', email: '', employeeId: '', department: '', password: '' });
    }, 1500);
  };

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
          <p className="text-slate-500 mt-1">Platform performance overview — March 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none">
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
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
          { icon: Users, label: "Total Users", value: "1,284", change: "+18%", up: true, color: "text-violet-600", bg: "bg-violet-50" },
          { icon: BookOpen, label: "Total Sessions", value: "3,847", change: "+12%", up: true, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: DollarSign, label: "Platform Revenue", value: `$${(totalRevenue * 0.2 / 1000).toFixed(1)}k`, change: "+22%", up: true, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Star, label: "Avg Platform Rating", value: "4.7", change: "+0.2", up: true, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ icon: Icon, label, value, change, up, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {change}
              </span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">User Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={userGrowth}>
              <defs>
                <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tutorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="students" name="Students" stroke="#7c3aed" strokeWidth={2.5} fill="url(#studentGrad)" />
              <Area type="monotone" dataKey="tutors" name="Tutors" stroke="#10b981" strokeWidth={2.5} fill="url(#tutorGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Sessions by Subject</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={subjectDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {subjectDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {subjectDist.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-medium text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Revenue vs Payouts</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payout" name="Payouts" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tutors & Alerts */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Top Tutors</h2>
            <div className="space-y-3">
              {tutors.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}>{i + 1}</span>
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.sessionsCompleted} sessions</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-slate-600">{t.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Flags</h2>
            <div className="space-y-2">
              {[
                { text: "Inappropriate content reported in session #1024", type: "warning" },
                { text: "Tutor profile pending verification", type: "info" },
                { text: "Payment dispute raised by student", type: "error" },
              ].map((alert, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs ${alert.type === "error" ? "bg-rose-50 text-rose-700" : alert.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                  {alert.text}
                </div>
              ))}
            </div>
            <Link to="/admin/moderation" className="mt-3 flex items-center justify-center gap-1 text-sm text-violet-600 font-medium hover:text-violet-800 transition-colors">
              View All Issues <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
