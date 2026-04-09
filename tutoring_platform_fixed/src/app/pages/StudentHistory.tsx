import { useState } from "react";
import { Link } from "react-router";
import { Clock, Star, Filter, Download, MessageSquare, RotateCcw, ChevronRight, Calendar } from "lucide-react";
import { studentBookings } from "../data/mockData";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

export default function StudentHistory() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? studentBookings : studentBookings.filter(b => b.status === filter);

  const total = studentBookings.filter(b => b.status === "completed").reduce((a, b) => a + b.price, 0);
  const upcomingCount = studentBookings.filter(b => b.status === "upcoming").length;
  const completedCount = studentBookings.filter(b => b.status === "completed").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking History</h1>
          <p className="text-slate-500 mt-1">Track all your tutoring sessions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming Sessions", value: upcomingCount, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed Sessions", value: completedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Spent", value: `$${total.toFixed(2)}`, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Calendar className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "upcoming", "completed", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {f === "all" ? "All Bookings" : f}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.map((booking) => {
          const statusStyle = STATUS_STYLES[booking.status];
          return (
            <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <img src={booking.avatar} alt={booking.tutor} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{booking.tutor}</h3>
                      <p className="text-sm text-slate-500">{booking.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      <span className="font-bold text-slate-800">${booking.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.time}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.duration} min</span>
                  </div>

                  {booking.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < booking.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">Your rating</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 border-t border-slate-100 pt-4">
                {booking.status === "upcoming" && (
                  <>
                    <Link to="/chat" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-violet-500" /> Message
                    </Link>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 rounded-lg text-xs font-medium text-white hover:bg-violet-700 transition-colors">
                      Join Session <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors ml-auto">
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === "completed" && (
                  <>
                    <Link to={`/booking/1`} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Book Again
                    </Link>
                    {!booking.rating && (
                      <Link to="/session/review" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
                        <Star className="w-3.5 h-3.5" /> Leave Review
                      </Link>
                    )}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
