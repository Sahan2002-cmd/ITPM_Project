import { useState } from "react";
import { Upload, Video, Check, X, Play, Clock, BookOpen, Tag, Globe, Lock } from "lucide-react";
import { tutors } from "../data/mockData";

export default function UploadRecording() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number; progress: number } | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("enrolled");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [uploaded, setUploaded] = useState(false);

  const startUpload = (name: string, size: number) => {
    setFile({ name, size, progress: 0 });
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setFile(f => f ? { ...f, progress: 100 } : null);
      } else {
        setFile(f => f ? { ...f, progress: p } : null);
      }
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f.name, f.size);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f.name, f.size);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(t => [...t, newTag.trim()]);
      setNewTag("");
    }
  };

  const handlePublish = () => setUploaded(true);

  if (uploaded) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-96">
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Recording Published!</h2>
        <p className="text-slate-500 text-center mb-6">Your session recording is now available to enrolled students.</p>
        <button onClick={() => { setUploaded(false); setFile(null); setTitle(""); }} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          Upload Another
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload Session Recording</h1>
        <p className="text-slate-500 mt-1">Share your session recordings with enrolled students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Drop Zone */}
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragging ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"}`}
            >
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className={`w-8 h-8 ${dragging ? "text-violet-600" : "text-violet-400"}`} />
              </div>
              <p className="text-slate-700 font-medium mb-1">Drag & drop your video file here</p>
              <p className="text-sm text-slate-400 mb-4">MP4, MOV, AVI, WebM — up to 2GB</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                Select Video File
              </label>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{file.progress < 100 ? "Uploading..." : "Upload complete"}</span>
                      <span className={file.progress < 100 ? "text-violet-600 font-medium" : "text-emerald-600 font-medium"}>{Math.round(file.progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${file.progress === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${file.progress}%` }} />
                    </div>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {file.progress === 100 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Video uploaded! Complete the details below and publish.
                </div>
              )}
            </div>
          )}

          {/* Recording Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800">Recording Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Calculus Session — Chain Rule & Integration"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white">
                <option value="">Select subject...</option>
                {["Mathematics", "Physics", "Chemistry", "Programming", "English"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What topics are covered in this recording?"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Add tag..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                <button onClick={addTag} className="px-3 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">Add</button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                      <button onClick={() => setTags(t => t.filter(x => x !== tag))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Visibility */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Visibility Settings</h3>
            <div className="space-y-2">
              {[
                { id: "enrolled", icon: BookOpen, label: "Enrolled Students", desc: "Only students in this session" },
                { id: "all", icon: Globe, label: "All My Students", desc: "Anyone who has booked with you" },
                { id: "private", icon: Lock, label: "Private", desc: "Only visible to you" },
              ].map(({ id, icon: Icon, label, desc }) => (
                <button key={id} onClick={() => setVisibility(id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${visibility === id ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${visibility === id ? "text-violet-600" : "text-slate-400"}`} />
                  <div>
                    <p className={`text-sm font-medium ${visibility === id ? "text-violet-700" : "text-slate-700"}`}>{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Points */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-600" /> Chapter Points</h3>
            <div className="space-y-2">
              {[{ time: "0:00", label: "Introduction" }, { time: "8:30", label: "Chain Rule Basics" }, { time: "24:15", label: "Practice Problems" }].map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-violet-600 font-mono w-12 flex-shrink-0">{c.time}</span>
                  <input defaultValue={c.label} className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                </div>
              ))}
              <button className="text-xs text-violet-600 font-medium hover:text-violet-800 transition-colors">+ Add chapter point</button>
            </div>
          </div>

          {/* Publish */}
          <button
            onClick={handlePublish}
            disabled={!file || file.progress < 100 || !title}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200"
          >
            <Play className="w-4 h-4" /> Publish Recording
          </button>
          <p className="text-xs text-center text-slate-400">Students will be notified when the recording is published</p>
        </div>
      </div>
    </div>
  );
}
