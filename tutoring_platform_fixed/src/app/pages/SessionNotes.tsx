import { useState } from "react";
import { FileText, Bold, Italic, List, Link, Save, Check, Clock, BookOpen, Tag } from "lucide-react";
import { tutors, TUTOR_IMAGES } from "../data/mockData";

export default function SessionNotes() {
  const [title, setTitle] = useState("Calculus Session — Chain Rule & Derivatives");
  const [content, setContent] = useState(`## Session Summary

Today we covered the Chain Rule in calculus and applied it to several practice problems.

## Key Concepts Covered
- Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)
- Implicit differentiation
- Related rates problems

## Practice Problems
1. Find d/dx of sin(x²) → Answer: 2x·cos(x²)
2. Find d/dx of e^(3x) → Answer: 3e^(3x)
3. Find d/dx of ln(x²+1) → Answer: 2x/(x²+1)

## Homework
- Complete exercises 4.3 problems 15-25
- Review implicit differentiation examples

## Next Session Topics
- Integration by substitution
- Definite integrals`);
  const [tags, setTags] = useState(["Calculus", "Chain Rule", "Derivatives"]);
  const [newTag, setNewTag] = useState("");
  const [saved, setSaved] = useState(false);
  const [visibility, setVisibility] = useState("student");

  const tutor = tutors[0];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(t => [...t, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session Notes</h1>
          <p className="text-slate-500 mt-1">Document session progress and key takeaways</p>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Notes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Session Info Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <img src={tutor.avatar} alt={tutor.name} className="w-10 h-10 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{tutor.name}</p>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Mar 3, 2026 — 10:00 AM</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Calculus · 60 min</span>
              </p>
            </div>
            <select value={visibility} onChange={e => setVisibility(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
              <option value="private">Private</option>
              <option value="student">Share with student</option>
              <option value="both">Visible to both</option>
            </select>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Session title..."
              className="w-full px-5 py-4 text-lg font-semibold text-slate-900 border-b border-slate-100 focus:outline-none focus:bg-slate-50 transition-colors"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50">
              {[
                { icon: Bold, label: "Bold" },
                { icon: Italic, label: "Italic" },
                { icon: List, label: "List" },
                { icon: Link, label: "Link" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} title={label} className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <div className="w-px h-5 bg-slate-200 mx-1" />
              {["H1", "H2", "H3"].map(h => (
                <button key={h} className="px-2 py-1 hover:bg-white rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">{h}</button>
              ))}
            </div>

            {/* Editor */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your session notes here... Use markdown formatting."
              className="w-full px-5 py-4 text-sm text-slate-700 focus:outline-none resize-none leading-relaxed min-h-80 font-mono"
              style={{ minHeight: "360px" }}
            />

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{content.length} characters · ~{Math.ceil(content.split(" ").length / 200)} min read</span>
              <span className="text-xs text-slate-400">Markdown supported</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-violet-600" /> Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">
                  {tag}
                  <button onClick={() => setTags(t => t.filter(x => x !== tag))} className="hover:text-violet-900">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()}
                placeholder="Add tag..." className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              <button onClick={addTag} className="px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-xs hover:bg-violet-700 transition-colors">Add</button>
            </div>
          </div>

          {/* Session Rating */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Session Progress</h3>
            <div className="space-y-3">
              {[
                { label: "Understanding", value: 85 },
                { label: "Participation", value: 90 },
                { label: "Homework Ready", value: 70 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Homework */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Assign Homework</h3>
            <textarea rows={3} placeholder="Describe homework assignment..." className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
            <div className="mt-2">
              <label className="text-xs text-slate-600">Due Date</label>
              <input type="date" className="w-full mt-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>

          {/* Actions */}
          <button onClick={handleSave} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save & Share</>}
          </button>
        </div>
      </div>
    </div>
  );
}
