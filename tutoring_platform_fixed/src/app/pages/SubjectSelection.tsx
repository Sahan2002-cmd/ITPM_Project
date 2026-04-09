import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Check, X, BookOpen, ChevronRight } from "lucide-react";
import { subjects } from "../data/mockData";

const CATEGORIES = [
  { name: "Mathematics & Sciences", color: "bg-violet-100 text-violet-700 border-violet-200", items: ["Mathematics", "Calculus", "Statistics", "Algebra", "Geometry", "Physics", "Chemistry", "Biology", "Science"] },
  { name: "Languages & Humanities", color: "bg-blue-100 text-blue-700 border-blue-200", items: ["English", "Writing", "Literature", "Grammar", "History", "Geography", "Philosophy"] },
  { name: "Technology", color: "bg-emerald-100 text-emerald-700 border-emerald-200", items: ["Programming", "Python", "JavaScript", "Web Dev", "Data Science"] },
  { name: "Business & Economics", color: "bg-amber-100 text-amber-700 border-amber-200", items: ["Economics"] },
  { name: "Languages", color: "bg-rose-100 text-rose-700 border-rose-200", items: ["Spanish", "French", "Mandarin", "German"] },
  { name: "Arts & Creative", color: "bg-pink-100 text-pink-700 border-pink-200", items: ["Music", "Art", "Design"] },
];

export default function SubjectSelection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(["Mathematics", "Calculus", "Statistics"]);
  const [proficiency, setProficiency] = useState<Record<string, string>>({
    Mathematics: "Expert", Calculus: "Expert", Statistics: "Intermediate",
  });

  const toggle = (sub: string) => {
    if (selected.includes(sub)) {
      setSelected(s => s.filter(x => x !== sub));
      const p = { ...proficiency };
      delete p[sub];
      setProficiency(p);
    } else {
      setSelected(s => [...s, sub]);
      setProficiency(p => ({ ...p, [sub]: "Intermediate" }));
    }
  };

  const filteredCats = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(i => i.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subjects & Expertise</h1>
        <p className="text-slate-500 mt-1">Select the subjects you can teach and set your proficiency level</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Subject Picker */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
          </div>

          {filteredCats.map(cat => (
            <div key={cat.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" /> {cat.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(sub => {
                  const isSelected = selected.includes(sub);
                  return (
                    <button key={sub} onClick={() => toggle(sub)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${isSelected ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Selected Subjects */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Selected Subjects ({selected.length})</h3>
            {selected.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No subjects selected yet</p>
            ) : (
              <div className="space-y-3">
                {selected.map(sub => (
                  <div key={sub} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{sub}</span>
                        <button onClick={() => toggle(sub)} className="p-0.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={proficiency[sub] || "Intermediate"}
                        onChange={e => setProficiency(p => ({ ...p, [sub]: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <p className="text-xs text-violet-700 font-medium mb-1">💡 Pro Tip</p>
            <p className="text-xs text-violet-600">Tutors with 3-5 specific subjects get 40% more bookings than those with too many or too few.</p>
          </div>

          <button onClick={() => navigate("/tutor/availability")}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
            Save & Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
