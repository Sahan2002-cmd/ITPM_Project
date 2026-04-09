import { useState } from "react";
import { Link } from "react-router";
import { Play, Clock, BookOpen, Search, Filter, Eye } from "lucide-react";
import { recordings } from "../data/mockData";

export default function RecordingsList() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

  const subjects = ["All", ...Array.from(new Set(recordings.map(r => r.subject)))];
  const filtered = recordings.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.tutor.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subject === "All" || r.subject === subject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recorded Sessions</h1>
          <p className="text-slate-500 mt-1">Watch and rewatch your past tutoring sessions</p>
        </div>
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
        <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-5 text-sm text-slate-500">
        <span className="flex items-center gap-1.5"><Play className="w-4 h-4 text-violet-500" /> {recordings.length} recordings available</span>
        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-500" /> 2h 48m total watch time</span>
        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-violet-500" /> {recordings.reduce((a, b) => a + b.views, 0)} total views</span>
      </div>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(rec => (
          <Link key={rec.id} to={`/student/recordings/${rec.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group overflow-hidden block">
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
              <img src={rec.thumbnail} alt={rec.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-violet-600 ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-mono">
                {rec.duration}
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-violet-600/90 text-white rounded-lg text-xs font-medium">{rec.subject}</span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3">{rec.title}</h3>
              <div className="flex items-center gap-2">
                <img src={rec.avatar} alt={rec.tutor} className="w-7 h-7 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{rec.tutor}</p>
                  <p className="text-[10px] text-slate-400">{rec.date}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye className="w-3 h-3" /> {rec.views}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500">No recordings found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
