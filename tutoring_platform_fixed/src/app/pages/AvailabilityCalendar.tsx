import { useState, useEffect } from "react";
import { Check, Save, Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getTutorProfileByUserId, createAvailabilitySlot, getAvailabilityByTutor, deleteAvailabilitySlot } from "../services/Module_01_API";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
});

const DAY_TO_DOW: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

// Returns the next 4 calendar dates (including today) for a given day name
function getNextFourOccurrences(dayName: string): Date[] {
  const targetDow = DAY_TO_DOW[dayName];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = (targetDow - today.getDay() + 7) % 7;
  const first = new Date(today);
  first.setDate(today.getDate() + daysUntil);
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    return d;
  });
}

// Sri Lanka Standard Time offset (UTC+5:30)
const SLST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Combine a base date and a time string like "9:00 AM" into a UTC Date,
// treating the time as Sri Lanka time (SLST = UTC+5:30).
function buildDateTime(date: Date, timeStr: string): Date {
  const [rawTime, period] = timeStr.split(" ");
  let [h, m] = rawTime.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  // Interpret this hour:minute as SLST and return the equivalent UTC instant
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0) - SLST_OFFSET_MS;
  return new Date(utcMs);
}

// Convert a time string like "9:00 AM" to minutes from midnight for comparison
function toMinutes(time: string): number {
  const [rawTime, period] = time.split(" ");
  let [h, m] = rawTime.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

type Slot = { start: string; end: string };
type Schedule = Record<string, Slot[]>;
type SlotErrors = Record<string, string>; // key: `${day}-${idx}` → error message

const defaultSchedule: Schedule = {
  Monday: [{ start: "9:00 AM", end: "12:00 PM" }, { start: "2:00 PM", end: "6:00 PM" }],
  Tuesday: [{ start: "9:00 AM", end: "5:00 PM" }],
  Wednesday: [{ start: "10:00 AM", end: "4:00 PM" }],
  Thursday: [{ start: "9:00 AM", end: "5:00 PM" }],
  Friday: [{ start: "9:00 AM", end: "12:00 PM" }],
  Saturday: [],
  Sunday: [],
};

// ── Validation helpers ─────────────────────────────────────────────────────────
function validateSlots(day: string, slots: Slot[]): SlotErrors {
  const errs: SlotErrors = {};

  slots.forEach((slot, idx) => {
    const key = `${day}-${idx}`;
    const startMin = toMinutes(slot.start);
    const endMin = toMinutes(slot.end);

    if (startMin >= endMin) {
      errs[key] = "Start time must be earlier than end time.";
      return;
    }

    // Check overlap with every other slot in the same day
    for (let j = 0; j < slots.length; j++) {
      if (j === idx) continue;
      const otherStart = toMinutes(slots[j].start);
      const otherEnd = toMinutes(slots[j].end);
      if (startMin < otherEnd && endMin > otherStart) {
        errs[key] = `Overlaps with slot ${j + 1} (${slots[j].start} – ${slots[j].end}).`;
        break;
      }
    }
  });

  return errs;
}

function validateAllSchedule(schedule: Schedule, enabled: Record<string, boolean>): SlotErrors {
  let all: SlotErrors = {};
  DAYS.forEach(day => {
    if (enabled[day] && schedule[day]?.length) {
      all = { ...all, ...validateSlots(day, schedule[day]) };
    }
  });
  return all;
}

export default function AvailabilityCalendar() {
  const { user } = useAuth();
  const [tutorProfileId, setTutorProfileId] = useState<string>("");
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [slotErrors, setSlotErrors] = useState<SlotErrors>({});
  const [saveError, setSaveError] = useState("");

  // Fetch the tutor's MongoDB profile ID so we can create availability slots
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId) return;
      try {
        const res = await getTutorProfileByUserId(user.userId);
        if (res?.StatusCode === 1 && res.Data?.Id) {
          setTutorProfileId(res.Data.Id);
        }
      } catch { /* non-critical; save button will show an error */ }
    };
    fetchProfile();
  }, [user?.userId]);

  const toggleDay = (day: string) => {
    setEnabled(e => ({ ...e, [day]: !e[day] }));
    if (!enabled[day] && schedule[day].length === 0) {
      setSchedule(s => ({ ...s, [day]: [{ start: "9:00 AM", end: "5:00 PM" }] }));
    }
    // Clear errors for this day
    setSlotErrors(e => {
      const next = { ...e };
      Object.keys(next).filter(k => k.startsWith(`${day}-`)).forEach(k => delete next[k]);
      return next;
    });
  };

  const addSlot = (day: string) => {
    setSchedule(s => ({ ...s, [day]: [...(s[day] || []), { start: "9:00 AM", end: "11:00 AM" }] }));
  };

  const removeSlot = (day: string, idx: number) => {
    setSchedule(s => {
      const updated = s[day].filter((_, i) => i !== idx);
      // Re-validate remaining slots for this day
      const errs = validateSlots(day, updated);
      setSlotErrors(prev => {
        const next = { ...prev };
        Object.keys(next).filter(k => k.startsWith(`${day}-`)).forEach(k => delete next[k]);
        return { ...next, ...errs };
      });
      return { ...s, [day]: updated };
    });
  };

  const updateSlot = (day: string, idx: number, field: "start" | "end", val: string) => {
    setSchedule(s => {
      const slots = [...s[day]];
      slots[idx] = { ...slots[idx], [field]: val };

      // Validate this day's slots on every change
      const errs = validateSlots(day, slots);
      setSlotErrors(prev => {
        const next = { ...prev };
        Object.keys(next).filter(k => k.startsWith(`${day}-`)).forEach(k => delete next[k]);
        return { ...next, ...errs };
      });

      return { ...s, [day]: slots };
    });
  };

  // Reset: delete all existing Free slots for this tutor, then re-save fresh
  const handleReset = async () => {
    if (!tutorProfileId) {
      setSaveError("Could not find your tutor profile. Please refresh and try again.");
      return;
    }
    setSaveError("");
    setResetting(true);

    // Fetch existing Free slots and delete them all
    try {
      const existingRes = await getAvailabilityByTutor(tutorProfileId as any);
      const existing: { Id: string; Status: string }[] = existingRes?.StatusCode === 1 && Array.isArray(existingRes.Data)
        ? existingRes.Data
        : [];
      const freeSlots = existing.filter(s => s.Status === "Free");
      await Promise.allSettled(freeSlots.map(s => deleteAvailabilitySlot(s.Id as any)));
    } catch { /* non-critical — proceed to re-save */ }

    setResetting(false);
    // Now save a fresh schedule (existing slots are gone, so no duplicates)
    await handleSave();
  };

  const handleSave = async () => {
    setSaveError("");
    const allErrs = validateAllSchedule(schedule, enabled);
    if (Object.keys(allErrs).length > 0) {
      setSlotErrors(allErrs);
      setSaveError("Please fix the highlighted errors before saving.");
      return;
    }
    if (!tutorProfileId) {
      setSaveError("Could not find your tutor profile. Please refresh and try again.");
      return;
    }

    setSaving(true);

    // ── 1. Fetch currently saved slots so we can skip duplicates ──────────
    let existingSlots: { StartTime: string }[] = [];
    try {
      const existingRes = await getAvailabilityByTutor(tutorProfileId as any);
      if (existingRes?.StatusCode === 1 && Array.isArray(existingRes.Data)) {
        existingSlots = existingRes.Data;
      }
    } catch { /* non-critical — proceed and let backend overlap check handle it */ }

    const isAlreadySaved = (startIso: string): boolean => {
      const ms = new Date(startIso).getTime();
      return existingSlots.some(s => Math.abs(new Date(s.StartTime).getTime() - ms) < 60_000);
    };

    // ── 2. Build the candidate list ───────────────────────────────────────
    const now = new Date();
    const slotsToCreate: { TutorProfileId: string; Date: string; StartTime: string; EndTime: string }[] = [];

    for (const day of DAYS) {
      if (!enabled[day] || !schedule[day]?.length) continue;
      for (const occurrence of getNextFourOccurrences(day)) {
        for (const slot of schedule[day]) {
          const startTime = buildDateTime(occurrence, slot.start);
          const endTime = buildDateTime(occurrence, slot.end);
          if (startTime <= now) continue; // already in the past
          if (isAlreadySaved(startTime.toISOString())) continue; // already in DB
          slotsToCreate.push({
            TutorProfileId: tutorProfileId,
            Date: occurrence.toISOString(),
            StartTime: startTime.toISOString(),
            EndTime: endTime.toISOString(),
          });
        }
      }
    }

    if (slotsToCreate.length === 0) {
      setSaveError("Schedule is already up to date. No new slots to create.");
      setSaving(false);
      return;
    }

    // ── 3. POST only the new slots ─────────────────────────────────────────
    let created = 0;
    let failed = 0;
    let authError = false;

    for (const slot of slotsToCreate) {
      try {
        const res = await createAvailabilitySlot(slot);
        if (res?.StatusCode === 1) created++;
        else failed++;
      } catch (err: any) {
        const msg: string = err?.message ?? "";
        if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
          authError = true;
        }
        failed++;
      }
    }

    setSaving(false);

    if (authError) {
      setSaveError("Permission denied (403). Please log out and log back in as a tutor, then try again.");
      return;
    }

    if (created > 0) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (failed > 0) setSaveError(`${created} new slot(s) saved. ${failed} could not be created (overlap or error).`);
    } else {
      setSaveError(`All ${slotsToCreate.length} new slot(s) failed. Please log out and log back in, then retry.`);
    }
  };

  const totalSlots = Object.values(schedule).flat().length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability Calendar</h1>
          <p className="text-slate-500 mt-1">Set your weekly availability for tutoring sessions</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={saving || resetting}
              title="Delete all existing slots and re-save with current schedule (fixes wrong times)"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${resetting ? "bg-rose-100 text-rose-400 border-rose-200 cursor-not-allowed" : "border-rose-300 text-rose-600 hover:bg-rose-50"}`}
            >
              {resetting ? <><Clock className="w-4 h-4 animate-spin" /> Resetting...</> : <><Trash2 className="w-4 h-4" /> Reset & Resave</>}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || resetting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : saving ? "bg-violet-400 text-white cursor-not-allowed" : "bg-violet-600 text-white hover:bg-violet-700"}`}
            >
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? <><Clock className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Schedule</>}
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {saveError}
            </p>
          )}
        </div>
      </div>

      {/* Stats & Timezone */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Days Available</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{Object.values(enabled).filter(Boolean).length}</p>
          <p className="text-xs text-slate-400">per week</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Slots</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalSlots}</p>
          <p className="text-xs text-slate-400">time slots set</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500 mb-2">Timezone</p>
          <p className="text-sm font-semibold text-slate-800">Sri Lanka (SLST)</p>
          <p className="text-xs text-slate-400 mt-0.5">GMT+5:30 — all times are SLST</p>
        </div>
      </div>

      {/* Validation summary banner */}
      {Object.keys(slotErrors).length > 0 && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-700">There are slot conflicts to fix:</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(slotErrors).map(([key, msg]) => {
                const [day, idx] = key.split("-");
                return (
                  <li key={key} className="text-xs text-rose-600">{day} · Slot {Number(idx) + 1}: {msg}</li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-3">
        {DAYS.map(day => (
          <div key={day} className={`bg-white rounded-2xl border transition-all ${enabled[day] ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60"}`}>
            <div className="flex items-start gap-4 p-4">
              {/* Toggle */}
              <button onClick={() => toggleDay(day)} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${enabled[day] ? "bg-violet-600" : "bg-slate-200"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled[day] ? "translate-x-6" : "translate-x-1"}`} />
              </button>

              <span className={`w-24 text-sm font-semibold flex-shrink-0 mt-1 ${enabled[day] ? "text-slate-800" : "text-slate-400"}`}>{day}</span>

              {enabled[day] ? (
                <div className="flex-1 space-y-2">
                  {(schedule[day] || []).map((slot, idx) => {
                    const errKey = `${day}-${idx}`;
                    const hasError = !!slotErrors[errKey];
                    return (
                      <div key={idx}>
                        <div className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${hasError ? "bg-rose-50 border border-rose-200" : ""}`}>
                          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${hasError ? "text-rose-400" : "text-violet-400"}`} />
                          <select
                            value={slot.start}
                            onChange={e => updateSlot(day, idx, "start", e.target.value)}
                            className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-slate-50 ${hasError ? "border-rose-300" : "border-slate-200"}`}
                          >
                            {HOURS.map(h => <option key={h}>{h}</option>)}
                          </select>
                          <span className="text-xs text-slate-400 flex-shrink-0">to</span>
                          <select
                            value={slot.end}
                            onChange={e => updateSlot(day, idx, "end", e.target.value)}
                            className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-slate-50 ${hasError ? "border-rose-300" : "border-slate-200"}`}
                          >
                            {HOURS.map(h => <option key={h}>{h}</option>)}
                          </select>
                          <button onClick={() => removeSlot(day, idx)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {hasError && (
                          <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 ml-6">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {slotErrors[errKey]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={() => addSlot(day)} className="flex items-center gap-1.5 text-xs text-violet-600 font-medium hover:text-violet-800 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add time slot
                  </button>
                </div>
              ) : (
                <span className="text-sm text-slate-400 mt-1">Not available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Session Preferences */}
      <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-600" /> Session Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Buffer Between Sessions</label>
            <select className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white">
              <option>No buffer</option>
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>30 minutes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Sessions Per Day</label>
            <select className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white">
              <option>No limit</option>
              <option>2 sessions</option>
              <option>3 sessions</option>
              <option>4 sessions</option>
              <option>5 sessions</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
