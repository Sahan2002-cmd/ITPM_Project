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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subjects & Expertise</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Select the subjects you teach. Updates require admin approval.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 text-sm ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-400"}`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 text-slate-900 dark:text-white transition-colors" />
          </div>

          {filteredCats.map(cat => (
            <div key={cat.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" /> {cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(sub => {
                  const isSelected = selected.includes(sub);
                  return (
                    <button key={sub} onClick={() => toggle(sub)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${isSelected ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100 dark:shadow-none" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />} {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Selected Subjects ({selected.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? <p className="text-sm text-slate-400 dark:text-slate-600 py-2">No subjects selected</p> : selected.map(s => (
                <span key={s} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-violet-100 dark:border-violet-800/50">
                  {s} <button onClick={() => toggle(s)}><X className="w-3 h-3 hover:text-rose-500 dark:hover:text-rose-400" /></button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 dark:shadow-none disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save & Continue <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
