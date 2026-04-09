import { useState } from "react";
import { Search, Filter, Download, Eye, FileText, Film, File, Image, Grid, List, Star, BookOpen } from "lucide-react";
import { materials } from "../data/mockData";

const TYPE_ICONS: Record<string, any> = { pdf: FileText, video: Film, doc: File, img: Image };
const TYPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-100 text-rose-600",
  video: "bg-violet-100 text-violet-600",
  doc: "bg-blue-100 text-blue-600",
  img: "bg-emerald-100 text-emerald-600",
};

export default function MaterialsLibrary() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [type, setType] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<string[]>([]);

  const subjects = ["All", ...Array.from(new Set(materials.map(m => m.subject)))];
  const types = ["All", "pdf", "video", "doc"];

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.uploader.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subject === "All" || m.subject === subject;
    const matchType = type === "All" || m.type === type;
    return matchSearch && matchSubject && matchType;
  });

  const toggleFav = (id: string) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials Library</h1>
          <p className="text-slate-500 mt-1">Access all shared resources and study materials</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("grid")} className={`p-2 rounded-xl transition-colors ${view === "grid" ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-2 rounded-xl transition-colors ${view === "list" ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="All">All Types</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="doc">Document</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" /> More
        </button>
      </div>

      <div className="mb-3 text-sm text-slate-500">{filtered.length} resources found</div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(mat => {
            const Icon = TYPE_ICONS[mat.type] || File;
            const isFav = favorites.includes(mat.id);
            return (
              <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group overflow-hidden">
                {mat.type === "video" ? (
                  <div className="h-32 bg-gradient-to-br from-violet-400 to-indigo-600 relative flex items-center justify-center">
                    <Film className="w-10 h-10 text-white/80" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-violet-700" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`h-20 flex items-center justify-center ${TYPE_COLORS[mat.type]?.replace("text-", "bg-").split(" ")[0] || "bg-slate-50"}`}>
                    <Icon className={`w-10 h-10 ${TYPE_COLORS[mat.type]?.split(" ")[1] || "text-slate-400"} opacity-60`} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2 flex-1">{mat.name}</p>
                    <button onClick={() => toggleFav(mat.id)} className="flex-shrink-0">
                      <Star className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400"} transition-colors`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${TYPE_COLORS[mat.type] || "bg-slate-100 text-slate-500"}`}>{mat.type}</span>
                    <span className="text-xs text-slate-400">{mat.size}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">By {mat.uploader} · {mat.date}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Download className="w-3 h-3" /> {mat.downloads}</span>
                    <button className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Subject", "Type", "Size", "Uploaded by", "Date", "Downloads", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(mat => {
                const Icon = TYPE_ICONS[mat.type] || File;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[mat.type] || "bg-slate-100 text-slate-500"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{mat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs">{mat.subject}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLORS[mat.type] || "bg-slate-100 text-slate-500"}`}>{mat.type}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{mat.size}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{mat.uploader}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{mat.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{mat.downloads}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-600 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
