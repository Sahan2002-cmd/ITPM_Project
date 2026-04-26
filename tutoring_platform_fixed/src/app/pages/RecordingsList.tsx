import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Play, Clock, BookOpen, Search, Filter, Eye, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getStudentRecordings } from "../services/RecordingAPI";
import { toast } from "sonner";

export default function RecordingsList() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    if (user?.userId) {
      loadRecordings();
    }
  }, [user?.userId]);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const res = await getStudentRecordings(user.userId);
      if (res.StatusCode === 1) {
        setRecordings(res.Data || []);
      }
    } catch (err: any) {
      toast.error("Failed to load recordings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const subjects = ["All", ...Array.from(new Set(recordings.map(r => r.Subject)))];
  const filtered = recordings.filter(r => {
    const matchSearch = r.Title?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subject === "All" || r.Subject === subject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recorded Sessions</h1>
          <p className="text-slate-500 mt-1">Watch and rewatch your past tutoring sessions</p>
        </div>
        <button onClick={loadRecordings} disabled={loading} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-violet-600" /> : <Clock className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recordings..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none">
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-5 text-sm text-slate-500">
        <span className="flex items-center gap-1.5"><Play className="w-4 h-4 text-violet-500" /> {recordings.length} recordings available</span>
      </div>

      {/* Recordings Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(rec => (
            <Link key={rec.Id} to={`/student/recordings/${rec.Id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group overflow-hidden block">
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <img src={rec.ThumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} alt={rec.Title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-violet-600 ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-mono">
                  {rec.Duration}
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-violet-600/90 text-white rounded-lg text-xs font-medium">{rec.Subject}</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3">{rec.Title}</h3>
                <p className="text-xs text-slate-500 mb-2 line-clamp-2">{rec.Description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400">{new Date(rec.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500">No recordings found</p>
        </div>
      )}
    </div>
  );
}
