import { useState, useEffect } from "react";
import {
  Search, Download, FileText, File, Image, Grid, List, Trash2,
  Edit3, Check, X, Loader2, FolderOpen
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getFileResourcesByBooking, renameFileResource,
  deleteFileResource
} from "../services/Module_03_API";
import { toast } from "sonner";

const BASE_URL = "https://localhost:44331/api";

const TYPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-100 text-rose-600",
  docx: "bg-blue-100 text-blue-600",
  png: "bg-emerald-100 text-emerald-600",
  jpg: "bg-amber-100 text-amber-600",
  jpeg: "bg-amber-100 text-amber-600",
};

const fmtSize = (b: number) => {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
};

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString(); } catch { return ""; }
};

interface FileRes {
  FileId?: number; fileId?: number;
  BookingId?: number; bookingId?: number;
  UploadedBy?: number; uploadedBy?: number;
  FileName?: string; fileName?: string;
  FilePath?: string; filePath?: string;
  FileSize?: number; fileSize?: number;
  FileType?: string; fileType?: string;
  CreatedAt?: string; createdAt?: string;
}

const getId = (f: FileRes) => f.FileId ?? f.fileId ?? 0;
const getName = (f: FileRes) => f.FileName ?? f.fileName ?? "file";
const getType = (f: FileRes) => (f.FileType ?? f.fileType ?? "").toLowerCase();
const getSize = (f: FileRes) => f.FileSize ?? f.fileSize ?? 0;
const getDate = (f: FileRes) => f.CreatedAt ?? f.createdAt ?? "";
const getUploader = (f: FileRes) => f.UploadedBy ?? f.uploadedBy ?? 0;

export default function MaterialsLibrary() {
  const { user } = useAuth();
  const uid = user?.userId ?? 0;

  const [bookingId, setBookingId] = useState("");
  const [files, setFiles] = useState<FileRes[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  // rename
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");

  /* ── load files ── */
  const loadFiles = async () => {
    const bid = Number(bookingId);
    if (!bid) return;
    setLoading(true);
    try {
      const res = await getFileResourcesByBooking(bid);
      const data = res?.Data ?? res?.data ?? res ?? [];
      setFiles(Array.isArray(data) ? data : []);
    } catch { setFiles([]); toast.error("Failed to load files"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (bookingId) loadFiles(); }, [bookingId]);

  /* ── download ── */
  const doDownload = (f: FileRes) => {
    const token = localStorage.getItem("token");
    const url = `${BASE_URL}/fileresource/download/${getId(f)}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => {
        if (!r.ok) throw new Error("Download failed");
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = getName(f);
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Download failed"));
  };

  /* ── rename ── */
  const startRename = (f: FileRes) => {
    setRenameId(getId(f));
    setRenameName(getName(f));
  };
  const doRename = async () => {
    if (!renameId || !renameName.trim()) return;
    if (renameName.trim().length > 100) { toast.error("Name cannot exceed 100 characters"); return; }
    try {
      await renameFileResource(renameId, renameName.trim());
      setFiles(prev => prev.map(f => getId(f) === renameId ? { ...f, FileName: renameName.trim(), fileName: renameName.trim() } : f));
      setRenameId(null);
      toast.success("File renamed");
    } catch (e: any) { toast.error(e.message || "Rename failed"); }
  };

  /* ── delete ── */
  const doDelete = async (f: FileRes) => {
    if (!confirm(`Delete "${getName(f)}"? This cannot be undone.`)) return;
    try {
      await deleteFileResource(getId(f));
      setFiles(prev => prev.filter(x => getId(x) !== getId(f)));
      toast.success("File deleted");
    } catch (e: any) { toast.error(e.message || "Delete failed"); }
  };

  /* ── filter ── */
  const types = ["All", ...Array.from(new Set(files.map(f => getType(f)).filter(Boolean)))];
  const filtered = files.filter(f => {
    const matchSearch = getName(f).toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || getType(f) === typeFilter;
    return matchSearch && matchType;
  });

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

      {/* Booking + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="min-w-40">
          <input type="number" value={bookingId} onChange={e => setBookingId(e.target.value)}
            placeholder="Booking ID" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          {types.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t.toUpperCase()}</option>)}
        </select>
      </div>

      {!bookingId ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <FolderOpen className="w-12 h-12 opacity-30" />
          <p className="text-sm">Enter a Booking ID to view files</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
      ) : (
        <>
          <div className="mb-3 text-sm text-slate-500">{filtered.length} resources found</div>

          {view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(f => {
                const fType = getType(f);
                const colorClass = TYPE_COLORS[fType] || "bg-slate-100 text-slate-500";
                const isOwner = getUploader(f) === uid;
                const isRenaming = renameId === getId(f);

                return (
                  <div key={getId(f)} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group overflow-hidden">
                    <div className={`h-20 flex items-center justify-center ${colorClass.split(" ")[0]}`}>
                      <FileText className={`w-10 h-10 ${colorClass.split(" ")[1]} opacity-60`} />
                    </div>
                    <div className="p-4">
                      {isRenaming ? (
                        <div className="flex items-center gap-1 mb-2">
                          <input value={renameName} onChange={e => setRenameName(e.target.value)} maxLength={100}
                            className="flex-1 text-sm px-2 py-1 border border-violet-300 rounded-lg focus:outline-none" />
                          <button onClick={doRename} className="p-1 text-emerald-600"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setRenameId(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">{getName(f)}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colorClass}`}>{fType}</span>
                        <span className="text-xs text-slate-400">{fmtSize(getSize(f))}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{fmtDate(getDate(f))}</p>
                      <div className="flex items-center justify-between mt-3">
                        <button onClick={() => doDownload(f)} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        {isOwner && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startRename(f)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => doDelete(f)} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
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
                    {["Name", "Type", "Size", "Date", ""].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(f => {
                    const fType = getType(f);
                    const colorClass = TYPE_COLORS[fType] || "bg-slate-100 text-slate-500";
                    const isOwner = getUploader(f) === uid;

                    return (
                      <tr key={getId(f)} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-slate-800">{getName(f)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>{fType}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtSize(getSize(f))}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(getDate(f))}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => doDownload(f)} className="p-1.5 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-600 transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {isOwner && (
                              <>
                                <button onClick={() => startRename(f)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => doDelete(f)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No files found.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
