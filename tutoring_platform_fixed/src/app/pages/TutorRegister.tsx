import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, User, BookOpen, ChevronRight, Check, GraduationCap, Camera, AlertCircle } from "lucide-react";
import { TUTOR_IMAGES } from "../data/mockData";

const steps = ["Personal Info", "Education & Expertise", "Profile & Bio", "Verification"];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  degree: string;
  institution: string;
  graduationYear: string;
  bio: string;
  hourlyRate: string;
  languages: string[];
};

type FieldErrors = Partial<Record<keyof FormState | "general", string>>;

// ── Validators ────────────────────────────────────────────────────────────────
function validateStep0(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.firstName.trim()) errs.firstName = "First name is required.";
  else if (form.firstName.trim().length < 2) errs.firstName = "Must be at least 2 characters.";

  if (!form.lastName.trim()) errs.lastName = "Last name is required.";
  else if (form.lastName.trim().length < 2) errs.lastName = "Must be at least 2 characters.";

  if (!form.email.trim()) errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address.";

  if (!form.phone.trim()) errs.phone = "Phone number is required.";
  else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim())) errs.phone = "Enter a valid phone number.";

  return errs;
}

function validateStep1(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.degree.trim()) errs.degree = "Degree / Qualification is required.";
  if (!form.institution.trim()) errs.institution = "Institution name is required.";

  if (!form.graduationYear.trim()) {
    errs.graduationYear = "Graduation year is required.";
  } else {
    const yr = Number(form.graduationYear.trim());
    if (!Number.isInteger(yr) || yr < 1950 || yr > new Date().getFullYear() + 5) {
      errs.graduationYear = `Enter a valid year (1950 – ${new Date().getFullYear() + 5}).`;
    }
  }

  if (!form.hourlyRate.trim()) {
    errs.hourlyRate = "Hourly rate is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(form.hourlyRate.trim())) {
    errs.hourlyRate = "Hourly rate must be a positive number (e.g. 45 or 45.50).";
  } else if (Number(form.hourlyRate) <= 0) {
    errs.hourlyRate = "Hourly rate must be greater than 0.";
  }

  return errs;
}

function validateStep2(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  const bioLen = form.bio.trim().length;
  if (bioLen < 50) errs.bio = `Bio must be at least 50 characters (currently ${bioLen}).`;
  else if (bioLen > 500) errs.bio = "Bio must not exceed 500 characters.";
  if (form.languages.length === 0) errs.languages = "Select at least one language.";
  return errs;
}

function validateForStep(step: number, form: FormState): FieldErrors {
  if (step === 0) return validateStep0(form);
  if (step === 1) return validateStep1(form);
  if (step === 2) return validateStep2(form);
  return {};
}

export default function TutorRegister() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", phone: "",
    degree: "", institution: "", graduationYear: "", bio: "",
    hourlyRate: "", languages: [],
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const update = (key: keyof FormState, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const nextStep = () => {
    const errs = validateForStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (step < steps.length - 1) setStep(s => s + 1);
    else navigate("/tutor/subjects");
  };

  const FieldError = ({ field }: { field: keyof FieldErrors }) =>
    errors[field] ? (
      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors[field]}
      </p>
    ) : null;

  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 ${errors[field] ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tutor Registration</h1>
        <p className="text-slate-500 mt-1">Set up your tutor profile to start earning</p>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* ── Step 0: Personal Info ─────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-violet-600" /> Personal Information</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={TUTOR_IMAGES.sarah} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Profile Photo</p>
                <p className="text-xs text-slate-500 mt-0.5">Upload a clear, professional photo</p>
                <button className="mt-2 text-xs text-violet-600 font-medium hover:underline">Choose Photo</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "First Name", key: "firstName" as const, placeholder: "Sarah" },
                { label: "Last Name", key: "lastName" as const, placeholder: "Johnson" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} <span className="text-rose-500">*</span></label>
                  <input value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} className={inputClass(key)} />
                  <FieldError field={key} />
                </div>
              ))}
            </div>

            {[
              { label: "Email Address", key: "email" as const, type: "email", placeholder: "sarah@example.com" },
              { label: "Phone Number", key: "phone" as const, type: "tel", placeholder: "+1 (555) 000-0000" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} <span className="text-rose-500">*</span></label>
                <input type={type} value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} className={inputClass(key)} />
                <FieldError field={key} />
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Education & Expertise ────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-600" /> Education & Expertise</h2>
            {[
              { label: "Degree / Qualification", key: "degree" as const, placeholder: "e.g. BSc Mathematics, PhD Physics" },
              { label: "Institution", key: "institution" as const, placeholder: "e.g. MIT, Harvard University" },
              { label: "Graduation Year", key: "graduationYear" as const, placeholder: "e.g. 2019" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} <span className="text-rose-500">*</span></label>
                <input value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} className={inputClass(key)} />
                <FieldError field={key} />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hourly Rate (USD) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  value={form.hourlyRate}
                  onChange={e => update("hourlyRate", e.target.value)}
                  placeholder="45"
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 ${errors.hourlyRate ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}
                />
              </div>
              <FieldError field="hourlyRate" />
              <p className="text-xs text-slate-400 mt-1">Enter a numeric value, e.g. 45 or 45.50</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload Certificate / Credential</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Drag & drop or <span className="text-violet-600 font-medium">browse files</span></p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Profile & Bio ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600" /> Profile & Bio</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Professional Bio <span className="text-rose-500">*</span></label>
              <textarea
                value={form.bio}
                onChange={e => update("bio", e.target.value)}
                rows={4}
                placeholder="Tell students about your teaching style, experience, and what makes you an effective tutor... (minimum 50 characters)"
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none ${errors.bio ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.bio
                  ? <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.bio}</p>
                  : <p className="text-xs text-slate-400">Minimum 50 characters</p>
                }
                <span className={`text-xs ${form.bio.length > 500 ? "text-rose-500 font-medium" : form.bio.length >= 50 ? "text-emerald-500" : "text-slate-400"}`}>
                  {form.bio.length} / 500
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Languages <span className="text-rose-500">*</span></label>
              {errors.languages && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mb-2"><AlertCircle className="w-3.5 h-3.5" />{errors.languages}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {["English", "Spanish", "French", "Mandarin", "Arabic", "German"].map(lang => (
                  <button key={lang} onClick={() => {
                    const next = form.languages.includes(lang)
                      ? form.languages.filter(l => l !== lang)
                      : [...form.languages, lang];
                    setForm(f => ({ ...f, languages: next }));
                    if (next.length > 0) setErrors(e => { const n = { ...e }; delete n.languages; return n; });
                  }} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${form.languages.includes(lang) ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 text-slate-600 hover:border-violet-300"}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teaching Style</label>
              <div className="grid grid-cols-2 gap-2">
                {["Interactive & Discussion", "Structured & Methodical", "Problem-Solving Focus", "Concept-First Approach"].map(style => (
                  <button key={style} className="p-3 border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-violet-300 hover:bg-violet-50 text-left transition-all">
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Verification ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Almost Done!</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">We need to verify your identity. Upload a government-issued ID to complete registration.</p>
            <div className="border-2 border-dashed border-violet-200 rounded-2xl p-8 bg-violet-50 cursor-pointer hover:bg-violet-100 transition-colors mx-auto max-w-xs">
              <Upload className="w-10 h-10 text-violet-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-violet-700">Upload ID Document</p>
              <p className="text-xs text-violet-500 mt-1">Passport, Driver's License, or National ID</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
              <p className="font-medium mb-1">⏱ Review Process</p>
              <p>Your application will be reviewed within 24-48 hours. You'll receive an email confirmation once approved.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Back
            </button>
          )}
          <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 rounded-xl text-sm font-medium text-white hover:bg-violet-700 transition-colors">
            {step < steps.length - 1 ? "Continue" : "Submit Application"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
