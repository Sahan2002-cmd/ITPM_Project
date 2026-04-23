import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, User, BookOpen, ChevronRight, Check, GraduationCap, Camera, AlertCircle, Loader2, Edit3, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createTutorProfile, getTutorProfileByUserId, updateTutorProfile } from "../services/Module_01_API";

const steps = ["Personal Info", "Education & Expertise", "Profile & Bio", "Verification"];
const LANGUAGES = ["English", "Sinhala", "Tamil", "Spanish", "French", "Mandarin", "Arabic", "German"];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English Literature", "History", "Economics", "Business Studies", "Accounting"];

type FormState = {
  firstName: string; lastName: string; email: string; phone: string;
  degree: string; institution: string; graduationYear: string;
  bio: string; hourlyRate: string; languages: string[];
  subjects: string[];
};

type ProfileData = {
  Id?: string; UserId?: number; FullName?: string; Email?: string;
  Bio?: string; HourlyRate?: number; SubjectsTaught?: string[];
  Languages?: string[]; Status?: string; IsVerified?: boolean;
  Qualifications?: string[]; CreatedAt?: string;
};

type FieldErrors = Partial<Record<keyof FormState | "general", string>>;

function validateStep0(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.firstName.trim() || form.firstName.trim().length < 2) errs.firstName = "Min 2 characters required.";
  if (!form.lastName.trim() || form.lastName.trim().length < 2) errs.lastName = "Min 2 characters required.";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Valid email required.";
  if (!form.phone.trim() || !/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim())) errs.phone = "Valid phone required.";
  return errs;
}

function validateStep1(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.degree.trim()) errs.degree = "Degree is required.";
  if (!form.institution.trim()) errs.institution = "Institution is required.";
  const yr = Number(form.graduationYear.trim());
  if (!yr || yr < 1950 || yr > new Date().getFullYear() + 5) errs.graduationYear = "Valid year required.";
  if (!form.hourlyRate.trim() || Number(form.hourlyRate) <= 0) errs.hourlyRate = "Valid rate required.";
  if (form.subjects.length === 0) errs.subjects = "Select at least one subject.";
  return errs;
}

function validateStep2(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (form.bio.trim().length < 50) errs.bio = `Min 50 chars (${form.bio.trim().length} now).`;
  if (form.bio.length > 500) errs.bio = "Max 500 characters.";
  if (form.languages.length === 0) errs.languages = "Select at least one language.";
  return errs;
}

export default function TutorRegister() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: user?.email || "", phone: "",
    degree: "", institution: "", graduationYear: "", bio: "",
    hourlyRate: "", languages: [], subjects: [],
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);

  useEffect(() => {
    if (!user?.userId) { setLoadingProfile(false); return; }
    (async () => {
      try {
        const res = await getTutorProfileByUserId(user.userId);
        if (res?.StatusCode === 1 && res.Data) {
          setExistingProfile(res.Data);
          const names = (res.Data.FullName || "").split(" ");
          setForm(f => ({
            ...f,
            firstName: names[0] || "", lastName: names.slice(1).join(" ") || "",
            email: res.Data.Email || f.email, bio: res.Data.Bio || "",
            hourlyRate: res.Data.HourlyRate?.toString() || "",
            languages: res.Data.Languages || [], subjects: res.Data.SubjectsTaught || [],
            degree: res.Data.Qualifications?.[0] || "", institution: res.Data.Qualifications?.[1] || "",
            graduationYear: res.Data.Qualifications?.[2] || "",
          }));
        }
      } catch { /* No profile yet */ }
      setLoadingProfile(false);
    })();
  }, [user?.userId]);

  const update = (key: keyof FormState, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const toggleArray = (key: "languages" | "subjects", val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));
  };

  const nextStep = async () => {
    const validators = [validateStep0, validateStep1, validateStep2];
    if (step < 3) {
      const errs = validators[step](form);
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      setErrors({});
      setStep(s => s + 1);
      return;
    }
    // Step 3 — Submit
    setSubmitting(true);
    setErrors({});
    try {
      const profileData = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        subjects: form.subjects,
        bio: form.bio.trim(),
        hourlyRate: Number(form.hourlyRate),
        degree: form.degree.trim(),
        institution: form.institution.trim(),
        graduationYear: form.graduationYear.trim(),
        languages: form.languages,
      };

      if (editMode && existingProfile?.Id) {
        await updateTutorProfile(existingProfile.Id, profileData);
        setUpdatePending(true);
        setEditMode(false);
        const res = await getTutorProfileByUserId(user!.userId!);
        if (res?.StatusCode === 1 && res.Data) setExistingProfile({ ...res.Data, Status: "Pending Verification" });
      } else {
        const res = await createTutorProfile(profileData);
        if (res?.StatusCode === 1 && res.Data) {
          setExistingProfile(res.Data);
        }
      }
    } catch (err: any) {
      setErrors({ general: err.message || "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors[field] ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;

  const FieldError = ({ field }: { field: keyof FieldErrors }) =>
    errors[field] ? <p className="text-xs text-rose-600 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" />{errors[field]}</p> : null;

  if (loadingProfile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
    </div>
  );

  // ── EXISTING PROFILE VIEW ──────────────────────────────
  if (existingProfile && !editMode) {
    const isPending = existingProfile.Status === "Pending Verification";
    const isActive = existingProfile.Status === "Active";
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Tutor Profile</h1>
        <p className="text-slate-500 mb-6">Your registered tutor profile details</p>

        {updatePending && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
            <Clock className="w-4 h-4" /> Your profile update has been submitted and is pending admin approval.
          </div>
        )}

        <div className={`bg-white rounded-2xl border shadow-sm p-6 ${isPending ? "border-amber-200" : "border-slate-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl">
                {existingProfile.FullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{existingProfile.FullName}</h2>
                <p className="text-sm text-slate-500">{existingProfile.Email}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPending ? "bg-amber-100 text-amber-700" : isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {existingProfile.Status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs font-medium text-slate-500 mb-1">Hourly Rate</p><p className="text-sm font-semibold text-slate-800">LKR {existingProfile.HourlyRate?.toLocaleString()}/hr</p></div>
            <div><p className="text-xs font-medium text-slate-500 mb-1">Qualifications</p><div className="flex flex-wrap gap-1">{(existingProfile.Qualifications || []).map((q, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs">{q}</span>)}</div></div>
            <div><p className="text-xs font-medium text-slate-500 mb-1">Subjects</p><div className="flex flex-wrap gap-1">{(existingProfile.SubjectsTaught || []).map(s => <span key={s} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg text-xs">{s}</span>)}</div></div>
            <div><p className="text-xs font-medium text-slate-500 mb-1">Languages</p><div className="flex flex-wrap gap-1">{(existingProfile.Languages || []).map(l => <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs">{l}</span>)}</div></div>
          </div>

          {existingProfile.Bio && (
            <div className="mb-6"><p className="text-xs font-medium text-slate-500 mb-1">Bio</p><p className="text-sm text-slate-700 leading-relaxed">{existingProfile.Bio}</p></div>
          )}

          <button
            onClick={() => { setEditMode(true); setStep(0); setUpdatePending(false); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile {isPending ? "" : "(Requires Admin Approval)"}
          </button>
        </div>
      </div>
    );
  }

  // ── REGISTRATION / EDIT FORM ───────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{editMode ? "Edit Tutor Profile" : "Tutor Registration"}</h1>
        <p className="text-slate-500 mt-1">{editMode ? "Update your profile — changes need admin approval" : "Set up your tutor profile to start earning"}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-violet-600 text-white ring-4 ring-violet-200" : "bg-slate-100 text-slate-400"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${i === step ? "text-violet-700" : i < step ? "text-emerald-600" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 mb-4 ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {errors.general && <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{errors.general}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-violet-600" /> Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[{l:"First Name",k:"firstName" as const,p:"Sarah"},{l:"Last Name",k:"lastName" as const,p:"Johnson"}].map(({l,k,p})=>(
                <div key={k}><label className="block text-sm font-medium text-slate-700 mb-1.5">{l} <span className="text-rose-500">*</span></label><input value={form[k]} onChange={e=>update(k,e.target.value)} placeholder={p} className={inputClass(k)} /><FieldError field={k} /></div>
              ))}
            </div>
            {[{l:"Email",k:"email" as const,t:"email",p:"sarah@example.com"},{l:"Phone",k:"phone" as const,t:"tel",p:"+94 77 123 4567"}].map(({l,k,t,p})=>(
              <div key={k}><label className="block text-sm font-medium text-slate-700 mb-1.5">{l} <span className="text-rose-500">*</span></label><input type={t} value={form[k]} onChange={e=>update(k,e.target.value)} placeholder={p} className={inputClass(k)} /><FieldError field={k} /></div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-600" /> Education & Expertise</h2>
            {[{l:"Degree / Qualification",k:"degree" as const,p:"BSc Mathematics"},{l:"Institution",k:"institution" as const,p:"University of Colombo"},{l:"Graduation Year",k:"graduationYear" as const,p:"2022"}].map(({l,k,p})=>(
              <div key={k}><label className="block text-sm font-medium text-slate-700 mb-1.5">{l} <span className="text-rose-500">*</span></label><input value={form[k]} onChange={e=>update(k,e.target.value)} placeholder={p} className={inputClass(k)} /><FieldError field={k} /></div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hourly Rate (LKR) <span className="text-rose-500">*</span></label>
              <input value={form.hourlyRate} onChange={e=>update("hourlyRate",e.target.value)} placeholder="1500" className={inputClass("hourlyRate")} />
              <FieldError field="hourlyRate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subjects <span className="text-rose-500">*</span></label>
              <div className="flex gap-2 flex-wrap">{SUBJECTS.map(s=>(
                <button key={s} onClick={()=>toggleArray("subjects",s)} className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${form.subjects.includes(s)?"bg-violet-600 text-white border-violet-600":"border-slate-200 text-slate-600 hover:border-violet-300"}`}>{s}</button>
              ))}</div>
              {errors.subjects && <p className="text-xs text-rose-600 mt-1">{errors.subjects}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600" /> Profile & Bio</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Professional Bio <span className="text-rose-500">*</span></label>
              <textarea value={form.bio} onChange={e=>update("bio",e.target.value)} rows={4} placeholder="Tell students about your teaching style... (min 50 chars)" className={`w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors.bio?"border-rose-400 bg-rose-50":"border-slate-200"}`} />
              <div className="flex justify-between mt-1"><FieldError field="bio" /><span className={`text-xs ${form.bio.length>500?"text-rose-500":form.bio.length>=50?"text-emerald-500":"text-slate-400"}`}>{form.bio.length}/500</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Languages <span className="text-rose-500">*</span></label>
              <div className="flex gap-2 flex-wrap">{LANGUAGES.map(l=>(
                <button key={l} onClick={()=>toggleArray("languages",l)} className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${form.languages.includes(l)?"bg-violet-600 text-white border-violet-600":"border-slate-200 text-slate-600 hover:border-violet-300"}`}>{l}</button>
              ))}</div>
              {errors.languages && <p className="text-xs text-rose-600 mt-1">{errors.languages}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-violet-600" /></div>
            <h2 className="font-semibold text-slate-800">{editMode ? "Confirm Changes" : "Almost Done!"}</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">{editMode ? "Your updated profile will be sent for admin approval." : "Your profile will be reviewed within 24-48 hours."}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
              <p className="font-medium mb-1">⏱ {editMode ? "Update Review" : "Review Process"}</p>
              <p>{editMode ? "Profile changes require admin approval. Your profile will show as 'Pending Verification' until approved." : "Your application will be reviewed within 24-48 hours. You'll receive an email once approved."}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
          {step > 0 && <button onClick={()=>setStep(s=>s-1)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Back</button>}
          <button onClick={nextStep} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 rounded-xl text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : step < steps.length-1 ? <>Continue<ChevronRight className="w-4 h-4" /></> : editMode ? "Submit Changes" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
