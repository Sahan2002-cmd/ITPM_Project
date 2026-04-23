import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Check, X, BookOpen, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getTutorProfileByUserId, updateTutorProfile } from "../services/Module_01_API";

const CATEGORIES = [
  { name: "Mathematics & Sciences", items: ["Mathematics", "Physics", "Chemistry", "Biology", "Science", "Calculus", "Statistics", "Algebra", "Geometry"] },
  { name: "Languages & Humanities", items: ["English", "Literature", "History", "Geography", "Philosophy", "Writing", "Grammar"] },
  { name: "Technology", items: ["Computer Science", "Programming", "Python", "JavaScript", "Web Dev", "Data Science"] },
  { name: "Business & Economics", items: ["Economics", "Accounting", "Business Studies"] },
  { name: "Arts & Creative", items: ["Music", "Art", "Design"] },
];

export default function SubjectSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    const uid = user.userId;
    (async () => {
      try {
        const res = await getTutorProfileByUserId(uid);
        if (res?.StatusCode === 1 && res.Data) {
          setProfileId(res.Data.Id);
          setSelected(res.Data.SubjectsTaught || []);
        }
      } catch (err) { /* No profile yet */ }
      setLoading(false);
    })();
  }, [user?.userId]);

  const toggle = (sub: string) => {
    setSelected(s => s.includes(sub) ? s.filter(x => x !== sub) : [...s, sub]);
  };

  const handleSave = async () => {
    if (!profileId || !user?.userId) {
      setMessage({ type: "error", text: "Please complete your main registration first." });
      return;
    }
    const uid = user.userId;
    setSaving(true);
    setMessage(null);
    try {
      // Need to fetch full profile to avoid overwriting other fields
      const res = await getTutorProfileByUserId(uid);
      if (res?.StatusCode === 1 && res.Data) {
        const p = res.Data;
        await updateTutorProfile(profileId, {
          fullName: p.FullName,
          email: p.Email,
          bio: p.Bio,
          hourlyRate: p.HourlyRate,
          degree: p.Qualifications?.[0] || "",
          institution: p.Qualifications?.[1] || "",
          graduationYear: p.Qualifications?.[2] || "",
          languages: p.Languages || [],
          subjects: selected, // Updated subjects
        });
        setMessage({ type: "success", text: "Subjects updated! Changes pending admin approval." });
        setTimeout(() => navigate("/tutor/availability"), 1500);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-violet-600 animate-spin" /></div>;

  const filteredCats = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(i => i.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subjects & Expertise</h1>
        <p className="text-slate-500 mt-1">Select the subjects you teach. Updates require admin approval.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 text-sm ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
          </div>

          {filteredCats.map(cat => (
            <div key={cat.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600" /> {cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(sub => {
                  const isSelected = selected.includes(sub);
                  return (
                    <button key={sub} onClick={() => toggle(sub)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${isSelected ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100" : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />} {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Selected Subjects ({selected.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? <p className="text-sm text-slate-400 py-2">No subjects selected</p> : selected.map(s => (
                <span key={s} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-violet-100">
                  {s} <button onClick={() => toggle(s)}><X className="w-3 h-3 hover:text-rose-500" /></button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save & Continue <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
