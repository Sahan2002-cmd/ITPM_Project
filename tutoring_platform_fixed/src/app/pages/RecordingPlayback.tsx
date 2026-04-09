import { useState } from "react";
import { useParams, Link } from "react-router";
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, ChevronLeft, Download, MessageSquare, BookOpen, Clock, Star } from "lucide-react";
import { recordings } from "../data/mockData";

const chapters = [
  { time: "0:00", label: "Introduction & Overview", duration: "8:30" },
  { time: "8:30", label: "Chain Rule Fundamentals", duration: "15:45" },
  { time: "24:15", label: "Practice Problems - Part 1", duration: "12:20" },
  { time: "36:35", label: "Integration Techniques", duration: "14:10" },
  { time: "50:45", label: "Summary & Homework", duration: "7:45" },
];

const notes = [
  { time: "8:42", text: "Chain rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)" },
  { time: "15:30", text: "Remember to identify the outer and inner functions first" },
  { time: "28:10", text: "Practice problem 3 answer: 2x·cos(x²)" },
];

export default function RecordingPlayback() {
  const { id } = useParams();
  const recording = recordings.find(r => r.id === id) || recordings[0];
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(23);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [activeChapter, setActiveChapter] = useState(0);
  const [note, setNote] = useState("");
  const [savedNotes, setSavedNotes] = useState(notes);

  const addNote = () => {
    if (note.trim()) {
      setSavedNotes(n => [...n, { time: "23:14", text: note.trim() }]);
      setNote("");
    }
  };

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
              <img src={recording.thumbnail} alt={recording.title} className="w-full h-full object-cover opacity-40" />
              
              {/* Center Play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={() => setPlaying(p => !p)}
                  className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-2xl">
                  {playing ? <Pause className="w-7 h-7 text-violet-700" /> : <Play className="w-7 h-7 text-violet-700 ml-1" fill="currentColor" />}
                </button>
              </div>

              {/* Chapter Indicator */}
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg">
                {chapters[activeChapter].label}
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress */}
                <div className="mb-3">
                  <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                    className="w-full h-1 accent-violet-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-white/60 mt-1">
                    <span>23:14</span>
                    <span>58:30</span>
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
                <h1 className="font-bold text-slate-900">{recording.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recording.duration}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {recording.subject}</span>
                  <span className="text-slate-400">{recording.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Download className="w-4 h-4" /> Save
                </button>
                <Link to="/chat" className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-100 transition-colors">
                  <MessageSquare className="w-4 h-4" /> Ask Tutor
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
              <img src={recording.avatar} alt={recording.tutor} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium text-slate-800">{recording.tutor}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs text-slate-400 ml-1">4.9 · 128 reviews</span>
                </div>
              </div>
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
                placeholder="Add a note at current timestamp..." className="flex-1 text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              <button onClick={addNote} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Chapters Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Chapters</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {chapters.map((ch, i) => (
                <button key={i} onClick={() => setActiveChapter(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors ${activeChapter === i ? "bg-violet-50 border-l-2 border-l-violet-600" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${activeChapter === i ? "bg-violet-600" : "bg-slate-100"}`}>
                    <Play className={`w-4 h-4 ${activeChapter === i ? "text-white" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${activeChapter === i ? "text-violet-700" : "text-slate-700"}`}>{ch.label}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-mono">{ch.time}</span>
                      <span>·</span>
                      <span>{ch.duration}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Other Recordings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Other Recordings</h3>
            <div className="space-y-3">
              {recordings.filter(r => r.id !== recording.id).map(r => (
                <Link key={r.id} to={`/student/recordings/${r.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition-colors">
                  <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">{r.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
