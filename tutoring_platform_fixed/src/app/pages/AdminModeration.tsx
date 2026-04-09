import { useState } from "react";
import { Shield, AlertTriangle, Check, X, Eye, MessageSquare, Ban, ChevronDown, Search, Filter, Flag } from "lucide-react";
import { tutors, TUTOR_IMAGES } from "../data/mockData";

type Report = {
  id: string;
  type: "content" | "behavior" | "fraud" | "spam";
  title: string;
  reporter: string;
  reported: string;
  reportedAvatar: string;
  date: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  priority: "high" | "medium" | "low";
  description: string;
  sessionId: string;
};

const reports: Report[] = [
  { id: "r1", type: "content", title: "Inappropriate content shared during session", reporter: "Emma T.", reported: "Unknown Tutor", reportedAvatar: TUTOR_IMAGES.james, date: "Mar 3, 2026", status: "pending", priority: "high", description: "Student reports that tutor shared adult content during a math session via screen share.", sessionId: "#S-1024" },
  { id: "r2", type: "behavior", title: "Tutor was rude and dismissive", reporter: "Marcus R.", reported: "Alex Rivera", reportedAvatar: TUTOR_IMAGES.alex, date: "Mar 2, 2026", status: "reviewing", priority: "medium", description: "Student felt belittled when asking questions. Tutor made sarcastic remarks.", sessionId: "#S-1019" },
  { id: "r3", type: "fraud", title: "Tutor credentials appear falsified", reporter: "Admin System", reported: "James Williams", reportedAvatar: TUTOR_IMAGES.james, date: "Mar 1, 2026", status: "reviewing", priority: "high", description: "Automated system detected possible credential mismatch. University confirmation pending.", sessionId: "#T-445" },
  { id: "r4", type: "spam", title: "Excessive promotional messages", reporter: "Priya K.", reported: "Sarah Johnson", reportedAvatar: TUTOR_IMAGES.sarah, date: "Feb 28, 2026", status: "resolved", priority: "low", description: "Tutor sent 12 promotional messages within one day. Exceeds platform messaging limits.", sessionId: "#MSG-220" },
  { id: "r5", type: "behavior", title: "No-show without cancellation", reporter: "David L.", reported: "Mei Chen", reportedAvatar: TUTOR_IMAGES.mei, date: "Feb 27, 2026", status: "dismissed", priority: "low", description: "Tutor did not attend the scheduled session and did not cancel beforehand.", sessionId: "#S-1010" },
];

const TYPE_STYLES: Record<string, string> = {
  content: "bg-rose-100 text-rose-700",
  behavior: "bg-amber-100 text-amber-700",
  fraud: "bg-red-100 text-red-800",
  spam: "bg-slate-100 text-slate-600",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  reviewing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  dismissed: { bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-rose-600",
  medium: "text-amber-600",
  low: "text-slate-400",
};

export default function AdminModeration() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = reports.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.reporter.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    pending: reports.filter(r => r.status === "pending").length,
    reviewing: reports.filter(r => r.status === "reviewing").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-600" /> Session Moderation
          </h1>
          <p className="text-slate-500 mt-1">Review and manage platform safety reports</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {counts.pending} pending review
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending", count: counts.pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Reviewing", count: counts.reviewing, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Resolved", count: counts.resolved, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Dismissed", count: counts.dismissed, color: "text-slate-500", bg: "bg-slate-50" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-slate-200 p-4 text-center cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => setFilter(label.toLowerCase())}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
        </div>
        {["all", "pending", "reviewing", "resolved", "dismissed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f === "all" ? "All Reports" : f}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filtered.map(report => {
          const statusStyle = STATUS_STYLES[report.status];
          const isExpanded = expanded === report.id;

          return (
            <div key={report.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
              {/* Main Row */}
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : report.id)}>
                <img src={report.reportedAvatar} alt={report.reported} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_STYLES[report.type]}`}>{report.type}</span>
                    <span className={`text-sm font-semibold ${PRIORITY_COLORS[report.priority]}`}>●</span>
                    <p className="text-sm font-medium text-slate-800">{report.title}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    <span>Session {report.sessionId}</span>
                    <span>Reporter: {report.reporter}</span>
                    <span>Reported: {report.reported}</span>
                    <span>{report.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50">
                  <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Report Description</p>
                    <p className="text-sm text-slate-700">{report.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Eye className="w-4 h-4 text-violet-500" /> Review Session
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <MessageSquare className="w-4 h-4 text-blue-500" /> Contact Users
                    </button>
                    {report.status !== "resolved" && (
                      <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                        <Check className="w-4 h-4" /> Mark Resolved
                      </button>
                    )}
                    {report.status !== "dismissed" && report.status !== "resolved" && (
                      <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        <X className="w-4 h-4 text-slate-400" /> Dismiss
                      </button>
                    )}
                    {report.priority === "high" && report.status !== "resolved" && (
                      <button className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors ml-auto">
                        <Ban className="w-4 h-4" /> Suspend Account
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-slate-600 font-medium">No reports found</p>
          <p className="text-slate-400 text-sm mt-1">The platform is looking clean!</p>
        </div>
      )}
    </div>
  );
}
