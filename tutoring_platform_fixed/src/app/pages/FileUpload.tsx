import { useState, useCallback } from "react";
import { Upload, X, Check, File, Image, Film, FileText, AlertCircle } from "lucide-react";

type UploadFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "done" | "error";
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  if (type.includes("pdf")) return FileText;
  return File;
};

export default function FileUpload() {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([
    { id: "1", name: "Calculus Notes Week 5.pdf", size: 2457600, type: "application/pdf", progress: 100, status: "done" },
    { id: "2", name: "Practice Problems.docx", size: 1048576, type: "application/docx", progress: 72, status: "uploading" },
  ]);
  const [category, setCategory] = useState("Session Materials");
  const [visibility, setVisibility] = useState("shared");

  const addFiles = useCallback((newFiles: File[]) => {
    const uploaded: UploadFile[] = newFiles.map((f, i) => ({
      id: Date.now() + i + "",
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
      status: "uploading",
    }));
    setFiles(prev => [...prev, ...uploaded]);
    // Simulate upload progress
    uploaded.forEach(uf => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 25;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: 100, status: "done" } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: Math.min(p, 100) } : f));
        }
      }, 400);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (id: string) => setFiles(f => f.filter(x => x.id !== id));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">File Upload</h1>
        <p className="text-slate-500 mt-1">Share materials, notes, and resources with your students</p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white">
              <option>Session Materials</option>
              <option>Practice Problems</option>
              <option>Lecture Notes</option>
              <option>Reference Guides</option>
              <option>Assignments</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Visibility</label>
            <select value={visibility} onChange={e => setVisibility(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white">
              <option value="private">Private (only me)</option>
              <option value="session">Session students only</option>
              <option value="shared">All my students</option>
              <option value="public">Public library</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer mb-5 ${dragging ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"}`}
      >
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className={`w-7 h-7 transition-colors ${dragging ? "text-violet-600" : "text-violet-400"}`} />
        </div>
        <p className="text-slate-700 font-medium mb-1">Drop files here or <label className="text-violet-600 cursor-pointer hover:underline">
          <input type="file" multiple className="hidden" onChange={e => addFiles(Array.from(e.target.files || []))} />
          browse to upload
        </label></p>
        <p className="text-sm text-slate-400">Supports PDF, Word, Excel, Images, Videos — max 100MB per file</p>

        <div className="flex justify-center gap-4 mt-4">
          {["PDF", "DOC", "PPT", "MP4", "JPG", "ZIP"].map(ext => (
            <span key={ext} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">{ext}</span>
          ))}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Uploads ({files.length})</h3>
            <span className="text-xs text-slate-400">{files.filter(f => f.status === "done").length} of {files.length} complete</span>
          </div>
          <div className="divide-y divide-slate-50">
            {files.map(f => {
              const FileIcon = getFileIcon(f.type);
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.status === "done" ? "bg-emerald-100" : f.status === "error" ? "bg-rose-100" : "bg-violet-100"}`}>
                    {f.status === "error" ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <FileIcon className={`w-5 h-5 ${f.status === "done" ? "text-emerald-600" : "text-violet-500"}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-slate-400">{formatSize(f.size)}</span>
                        {f.status === "done" ? (
                          <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>
                        ) : (
                          <button onClick={() => removeFile(f.id)} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {f.status === "uploading" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{Math.round(f.progress)}%</span>
                      </div>
                    )}
                    {f.status === "done" && <p className="text-xs text-emerald-500 font-medium">Upload complete</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
              Save to Library
            </button>
            <button onClick={() => setFiles([])} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
