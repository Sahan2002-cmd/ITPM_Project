import { useState, useCallback, useEffect } from "react";
import { Upload, X, Check, File, Image, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { uploadFileResource, getFileResourcesByBooking } from "../services/Module_03_API";
import { toast } from "sonner";

/* ── types ── */
type UploadEntry = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
};

const ALLOWED_EXTS = ["pdf", "docx", "png", "jpg", "jpeg"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_NAME = 100;

const fmtSize = (b: number) => {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
};

const getIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
};

export default function FileUpload() {
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  /* ── load existing files for booking ── */
  useEffect(() => {
    if (!bookingId || isNaN(Number(bookingId))) return;
    setLoadingExisting(true);
    getFileResourcesByBooking(Number(bookingId))
      .then((res: any) => {
        const data = res?.Data ?? res?.data ?? res ?? [];
        setExistingFiles(Array.isArray(data) ? data : []);
      })
      .catch(() => setExistingFiles([]))
      .finally(() => setLoadingExisting(false));
  }, [bookingId]);

  /* ── validate & stage files ── */
  const addFiles = useCallback((incoming: File[]) => {
    const entries: UploadEntry[] = [];
    for (const f of incoming) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      let status: UploadEntry["status"] = "pending";
      let errorMsg: string | undefined;

      if (!ALLOWED_EXTS.includes(ext)) {
        status = "error"; errorMsg = `Type .${ext} not allowed (PDF, DOCX, PNG, JPG only)`;
      } else if (f.size > MAX_SIZE) {
        status = "error"; errorMsg = `File exceeds 20MB limit (${fmtSize(f.size)})`;
      } else if (f.name.length > MAX_NAME) {
        status = "error"; errorMsg = `File name exceeds ${MAX_NAME} characters`;
      }

      entries.push({ id: `${Date.now()}-${Math.random()}`, file: f, name: f.name, size: f.size, type: f.type, progress: 0, status, errorMsg });
    }
    setFiles(prev => [...prev, ...entries]);
  }, []);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  /* ── upload all pending files ── */
  const doUpload = async () => {
    const bid = Number(bookingId);
    if (!bid) { toast.error("Please enter a valid Booking ID"); return; }

    const pending = files.filter(f => f.status === "pending");
    if (pending.length === 0) { toast.error("No valid files to upload"); return; }

    setUploading(true);
    for (const entry of pending) {
      setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "uploading", progress: 30 } : f));
      try {
        await uploadFileResource(bid, entry.file);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "done", progress: 100 } : f));
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "error", errorMsg: err.message || "Upload failed" } : f));
      }
    }
    setUploading(false);
    toast.success("Upload complete!");
    // refresh existing files
    if (bid) {
      try {
        const res = await getFileResourcesByBooking(bid);
        const data = res?.Data ?? res?.data ?? res ?? [];
        setExistingFiles(Array.isArray(data) ? data : []);
      } catch { }
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">File Upload</h1>
        <p className="text-slate-500 mt-1">Share materials, notes, and resources for your session</p>
      </div>

      {/* Booking ID */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Booking ID</label>
        <input type="number" value={bookingId} onChange={e => setBookingId(e.target.value)}
          placeholder="Enter booking ID to attach files to..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white" />
        <p className="text-xs text-slate-400 mt-1">Allowed: PDF, DOCX, PNG, JPG • Max 20MB per file • Max 100-char filename</p>
      </div>

      {/* Drop Zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer mb-5 ${dragging ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"}`}>
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className={`w-7 h-7 transition-colors ${dragging ? "text-violet-600" : "text-violet-400"}`} />
        </div>
        <p className="text-slate-700 font-medium mb-1">
          Drop files here or{" "}
          <label className="text-violet-600 cursor-pointer hover:underline">
            <input type="file" multiple className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={e => addFiles(Array.from(e.target.files || []))} />
            browse to upload
          </label>
        </p>
        <p className="text-sm text-slate-400">PDF, DOCX, PNG, JPG — max 20MB per file</p>
        <div className="flex justify-center gap-4 mt-4">
          {["PDF", "DOCX", "PNG", "JPG"].map(ext => (
            <span key={ext} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">{ext}</span>
          ))}
        </div>
      </div>

      {/* Staged Files */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Files ({files.length})</h3>
            <span className="text-xs text-slate-400">{files.filter(f => f.status === "done").length} of {files.length} complete</span>
          </div>
          <div className="divide-y divide-slate-50">
            {files.map(f => {
              const Icon = getIcon(f.type);
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.status === "done" ? "bg-emerald-100" : f.status === "error" ? "bg-rose-100" : "bg-violet-100"}`}>
                    {f.status === "error" ? <AlertCircle className="w-5 h-5 text-rose-500" /> :
                      f.status === "uploading" ? <Loader2 className="w-5 h-5 text-violet-500 animate-spin" /> :
                        <Icon className={`w-5 h-5 ${f.status === "done" ? "text-emerald-600" : "text-violet-500"}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-slate-400">{fmtSize(f.size)}</span>
                        {f.status === "done" && <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                        {f.status !== "done" && (
                          <button onClick={() => removeFile(f.id)} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {f.status === "uploading" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full transition-all duration-300 animate-pulse" style={{ width: "60%" }} />
                        </div>
                        <span className="text-xs text-slate-400">Uploading...</span>
                      </div>
                    )}
                    {f.status === "done" && <p className="text-xs text-emerald-500 font-medium">Upload complete</p>}
                    {f.status === "error" && <p className="text-xs text-rose-500">{f.errorMsg}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button onClick={doUpload} disabled={uploading || !bookingId} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload Files"}
            </button>
            <button onClick={() => setFiles([])} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-white transition-colors">Clear All</button>
          </div>
        </div>
      )}

      {/* Existing Files for this Booking */}
      {bookingId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Existing Files for Booking #{bookingId}</h3>
          </div>
          {loadingExisting ? (
            <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 text-violet-500 animate-spin" /></div>
          ) : existingFiles.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No files uploaded yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {existingFiles.map((f: any) => (
                <div key={f.FileId ?? f.fileId} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{f.FileName ?? f.fileName}</p>
                    <p className="text-xs text-slate-400">{fmtSize(f.FileSize ?? f.fileSize ?? 0)} • {(f.FileType ?? f.fileType ?? "").toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
