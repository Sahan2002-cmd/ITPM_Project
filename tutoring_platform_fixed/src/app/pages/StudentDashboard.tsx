import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { BookOpen, Clock, DollarSign, Star, Calendar, MessageSquare, Play, ChevronRight, TrendingUp, Award, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { studentBookings, tutors, TUTOR_IMAGES } from "../data/mockData";
import { motion } from "motion/react";

const spendingData = [
  { month: "Oct", spent: 60 },
  { month: "Nov", spent: 95 },
  { month: "Dec", spent: 45 },
  { month: "Jan", spent: 120 },
  { month: "Feb", spent: 147.5 },
  { month: "Mar", spent: 45 },
];

const subjectProgress = [
  { subject: "Mathematics", progress: 78, color: "#7c3aed" },
  { subject: "Programming", progress: 62, color: "#0ea5e9" },
  { subject: "Physics", progress: 45, color: "#10b981" },
];

export default function StudentDashboard() {
  const totalSpent = spendingData.reduce((a, b) => a + b.spent, 0);
  const upcomingBookings = studentBookings.filter(b => b.status === "upcoming");
  const completedSessions = studentBookings.filter(b => b.status === "completed").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={TUTOR_IMAGES.student} alt="Student" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-violet-100 dark:ring-violet-900" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Good morning, Emma! 🌟</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Keep up your learning streak — <span className="text-amber-600 dark:text-amber-400 font-semibold">12 days strong!</span></p>
          </div>
        </div>
        <Link to="/student/browse" className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40">
          <BookOpen className="w-4 h-4" /> Book a Session
        </Link>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "Sessions Booked", value: studentBookings.length.toString(), sub: "total", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-100 dark:border-violet-800" },
          { icon: Clock, label: "Hours Learned", value: "18.5h", sub: "this month", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-800" },
          { icon: DollarSign, label: "Total Spent", value: `$${totalSpent.toFixed(0)}`, sub: "6 months", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-800" },
          { icon: Star, label: "Avg Session Rating", value: "4.7", sub: "given by you", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800" },
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
          {/* Spending Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-white text-lg">Learning Investment</h2>
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> 24% this month
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v}`, "Spent"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="spent" stroke="#7c3aed" strokeWidth={3} dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }} />
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
              {subjectProgress.map(({ subject, progress, color }) => (
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
              ))}
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
            <div className="space-y-3">
              {studentBookings.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <img src={b.avatar} alt={b.tutor} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{b.tutor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.subject} · {b.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">${b.price.toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "upcoming" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : b.status === "completed" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Upcoming Session */}
          {upcomingBookings.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-700 dark:to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/30"
            >
              <p className="text-violet-200 dark:text-violet-300 text-sm font-medium mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Next Session
              </p>
              <div className="flex items-center gap-3 mb-5">
                <img src={upcomingBookings[0].avatar} alt={upcomingBookings[0].tutor} className="w-12 h-12 rounded-full object-cover border-2 border-white/40" />
                <div>
                  <p className="font-semibold text-lg">{upcomingBookings[0].tutor}</p>
                  <p className="text-violet-200 dark:text-violet-300 text-sm">{upcomingBookings[0].subject}</p>
                </div>
              </div>
              <p className="text-violet-100 dark:text-violet-200 text-sm font-medium mb-4">{upcomingBookings[0].date} · {upcomingBookings[0].time}</p>
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
                { emoji: "🔥", label: "12 Day\nStreak", active: true },
                { emoji: "📚", label: "5 Sessions\nCompleted", active: true },
                { emoji: "⭐", label: "Top\nStudent", active: false },
                { emoji: "💬", label: "Active\nLearner", active: true },
                { emoji: "🏆", label: "First\nReview", active: true },
                { emoji: "🎯", label: "Goal\nSetter", active: false },
              ].map(({ emoji, label, active }) => (
                <div key={label} className={`text-center p-3 rounded-xl transition-all ${active ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800" : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-50 grayscale"}`}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-tight whitespace-pre-line">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recommended Tutors */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg">Recommended Tutors</h2>
            <div className="space-y-4">
              {tutors.slice(1, 3).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{t.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t.rating} · ${t.hourlyRate}/hr</span>
                    </div>
                  </div>
                  <Link to={`/student/booking/${t.id}`} className="px-3 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
                    Book
                  </Link>
                </div>
              ))}
            </div>
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