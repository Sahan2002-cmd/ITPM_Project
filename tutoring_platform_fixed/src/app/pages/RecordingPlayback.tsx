import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, ChevronLeft, Download, MessageSquare, BookOpen, Clock, Star, Loader2 } from "lucide-react";
import { getRecordingById } from "../services/RecordingAPI";
import { toast } from "sonner";

export default function RecordingPlayback() {
  const { id } = useParams();
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [note, setNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadRecording();
    }
  }, [id]);

  const loadRecording = async () => {
    setLoading(true);
    try {
      const res = await getRecordingById(id!);
      if (res.StatusCode === 1) {
        setRecording(res.Data);
      }
    } catch (err) {
      toast.error("Failed to load recording");
    } finally {
      setLoading(false);
    }
  };

  const addNote = () => {
    if (note.trim()) {
      setSavedNotes(n => [...n, { time: "00:00", text: note.trim() }]);
      setNote("");
    }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
              <p className="text-slate-500">Loading recording...</p>
          </div>
      );
  }

  if (!recording) {
      return (
          <div className="text-center py-20">
              <h2 className="text-xl font-bold text-slate-800">Recording not found</h2>
              <Link to="/student/recordings" className="text-violet-600 mt-4 inline-block">Back to list</Link>
          </div>
      );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link to="/student/recordings" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Recordings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          {/* Player */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
            <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
              <img src={recording.ThumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} alt={recording.Title} className="w-full h-full object-cover opacity-40" />
              
              {/* Center Play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={() => setPlaying(p => !p)}
                  className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-2xl">
                  {playing ? <Pause className="w-7 h-7 text-violet-700" /> : <Play className="w-7 h-7 text-violet-700 ml-1" fill="currentColor" />}
                </button>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress */}
                <div className="mb-3">
                  <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                    className="w-full h-1 accent-violet-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-white/60 mt-1">
                    <span>00:00</span>
                    <span>{recording.Duration}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button className="text-white/80 hover:text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
                  <button onClick={() => setPlaying(p => !p)} className="text-white hover:text-violet-300 transition-colors">
                    {playing ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-0.5" fill="currentColor" />}
                  </button>
                  <button className="text-white/80 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>

                  <div className="flex items-center gap-1.5 ml-2">
                    <Volume2 className="w-4 h-4 text-white/60" />
                    <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-20 h-1 accent-violet-400 cursor-pointer" />
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-transparent text-white/80 text-xs border border-white/20 rounded px-1 py-0.5 focus:outline-none">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                    <button className="text-white/80 hover:text-white transition-colors"><Maximize className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-bold text-slate-900">{recording.Title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recording.Duration}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {recording.Subject}</span>
                  <span className="text-slate-400">{new Date(recording.CreatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Download className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">{recording.Description}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">My Notes</h3>
            <div className="space-y-2 mb-3">
              {savedNotes.map((n, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-mono text-violet-600 font-semibold flex-shrink-0 mt-0.5">{n.time}</span>
                  <p className="text-sm text-slate-700">{n.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Add a note..." className="flex-1 text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              <button onClick={addNote} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Chapters Sidebar (Placeholder for demo) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
              <h3 className="font-semibold text-slate-800 mb-2">About this Session</h3>
              <p className="text-xs text-slate-500">Booking ID: #{recording.BookingId}</p>
              <p className="text-xs text-slate-500">Tutor ID: {recording.TutorId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
