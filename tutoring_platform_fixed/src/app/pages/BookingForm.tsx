import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Calendar, Clock, ChevronLeft, ChevronRight, Star, Users, User, Check, Plus, Trash2, AlertCircle } from "lucide-react";
import { tutors } from "../data/mockData";

const INDIVIDUAL_PRICE = 2000;
const GROUP_PRICE = 3500;

// Student ID format: "ST" followed by 6 digits, e.g. ST123456
const STUDENT_ID_REGEX = /^ST\d{6}$/i;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const times = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM",
];

// Mock booked/pending slots so the UI shows real disabled states
const bookedSlots: Record<string, string[]> = {
  "2026-4-10": ["10:00 AM", "2:00 PM"],
  "2026-4-11": ["9:00 AM"],
};
const pendingSlots: Record<string, string[]> = {
  "2026-4-10": ["3:00 PM"],
  "2026-4-12": ["11:00 AM"],
};

type SlotStatus = "available" | "booked" | "pending" | "past";

function getSlotStatus(year: number, month: number, day: number, time: string, now: Date): SlotStatus {
  const slotDate = new Date(year, month, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (slotDate < today) return "past";
  const key = `${year}-${month + 1}-${day}`;
  if (bookedSlots[key]?.includes(time)) return "booked";
  if (pendingSlots[key]?.includes(time)) return "pending";
  return "available";
}

type GroupMember = { id: string; name: string; studentId: string };
type FieldErrors = Record<string, string>;

export default function BookingForm() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const tutor = tutors.find((t) => t.id === tutorId) || tutors[0];

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"individual" | "group">("individual");
  const [notes, setNotes] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { id: "member-1", name: "", studentId: "" },
  ]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const price = sessionType === "individual" ? INDIVIDUAL_PRICE : GROUP_PRICE;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const step = !selectedDay ? 1 : !selectedTime ? 2 : 3;

  // ── Group member helpers ──────────────────────────────────────────────────
  const addMember = () => {
    if (groupMembers.length >= 10) return;
    setGroupMembers(m => [...m, { id: `member-${Date.now()}`, name: "", studentId: "" }]);
  };

  const removeMember = (id: string) => {
    setGroupMembers(m => m.filter(mem => mem.id !== id));
  };

  const updateMember = (id: string, field: "name" | "studentId", value: string) => {
    setGroupMembers(m => m.map(mem => mem.id === id ? { ...mem, [field]: value } : mem));
    setErrors(e => { const next = { ...e }; delete next[`${id}-${field}`]; return next; });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (!selectedTime) errs.time = "Please select a time slot.";
    if (!sessionType) errs.sessionType = "Please select a session type.";
    if (notes.length > 500) errs.notes = "Notes must be 500 characters or fewer.";

    if (sessionType === "group") {
      if (groupMembers.length < 1) {
        errs.groupGeneral = "At least one group member is required.";
      }
      const seenIds = new Set<string>();
      groupMembers.forEach(mem => {
        const nameKey = `${mem.id}-name`;
        const idKey = `${mem.id}-studentId`;
        if (!mem.name.trim()) {
          errs[nameKey] = "Member name is required.";
        } else if (mem.name.trim().length < 2 || mem.name.trim().length > 50) {
          errs[nameKey] = "Name must be 2–50 characters.";
        }
        if (!mem.studentId.trim()) {
          errs[idKey] = "Student ID is required.";
        } else if (!STUDENT_ID_REGEX.test(mem.studentId.trim())) {
          errs[idKey] = "Student ID must follow format ST123456.";
        } else if (seenIds.has(mem.studentId.trim().toUpperCase())) {
          errs[idKey] = "Duplicate Student ID.";
        } else {
          seenIds.add(mem.studentId.trim().toUpperCase());
        }
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    navigate("/student/booking-confirmation");
  };

  const slotStatusForDay = (time: string): SlotStatus => {
    if (!selectedDay) return "available";
    return getSlotStatus(currentYear, currentMonth, selectedDay, time, today);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slateate-800 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Booking Form ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Select Date", "Choose Time", "Confirm Details"].map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-violet-700" : "text-slate-400"}`}>{label}</span>
                {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-emerald-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-600" /> Select Date</h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium text-slate-700 w-32 text-center">{monthName} {currentYear}</span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                    className={`aspect-square rounded-xl text-sm font-medium transition-all ${isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-200" : isPast ? "text-slate-300 cursor-not-allowed" : "hover:bg-violet-50 text-slate-700 hover:text-violet-700"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDay && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-violet-600" /> Choose Time Slot</h2>
              {errors.time && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mb-3"><AlertCircle className="w-3.5 h-3.5" />{errors.time}</p>
              )}
              <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Booked</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {times.map(t => {
                  const status = slotStatusForDay(t);
                  const isSelected = selectedTime === t;
                  const isDisabled = status === "booked" || status === "pending" || status === "past";
                  return (
                    <button
                      key={t}
                      disabled={isDisabled}
                      onClick={() => { setSelectedTime(t); setErrors(e => { const n = { ...e }; delete n.time; return n; }); }}
                      title={status === "booked" ? "Already booked" : status === "pending" ? "Pending approval — unavailable" : undefined}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                        isSelected ? "bg-violet-600 text-white shadow-md"
                        : status === "booked" ? "bg-slate-100 text-slate-400 cursor-not-allowed line-through"
                        : status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-300 cursor-not-allowed"
                        : "bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200"
                      }`}
                    >
                      {t}
                      {status === "booked" && <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-slate-400 text-white rounded-full px-1 leading-4">Full</span>}
                      {status === "pending" && <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-amber-400 text-white rounded-full px-1 leading-4">Pending</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session Details */}
          {selectedTime && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              <h2 className="font-semibold text-slate-800">Session Details</h2>

              {/* Session Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Session Type <span className="text-rose-500">*</span></label>
                {errors.sessionType && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 mb-2"><AlertCircle className="w-3.5 h-3.5" />{errors.sessionType}</p>
                )}
                <div className="flex gap-3">
                  {[
                    { id: "individual" as const, icon: User, label: "Individual", price: INDIVIDUAL_PRICE },
                    { id: "group" as const, icon: Users, label: "Group", price: GROUP_PRICE },
                  ].map(({ id, icon: Icon, label, price: p }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSessionType(id);
                        setErrors(e => { const n = { ...e }; delete n.sessionType; return n; });
                      }}
                      className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl text-sm font-medium transition-all border ${sessionType === id ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-300"}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                      <span className="text-xs font-semibold text-emerald-600">Rs. {p.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Members */}
              {sessionType === "group" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-700">Group Members <span className="text-rose-500">*</span></label>
                    <span className="text-xs text-slate-400">{groupMembers.length} / 10 members</span>
                  </div>
                  {errors.groupGeneral && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mb-2"><AlertCircle className="w-3.5 h-3.5" />{errors.groupGeneral}</p>
                  )}
                  <div className="space-y-3">
                    {groupMembers.map((mem, idx) => (
                      <div key={mem.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Member {idx + 1}</span>
                          {groupMembers.length > 1 && (
                            <button onClick={() => removeMember(mem.id)} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Member Name</label>
                            <input
                              type="text"
                              value={mem.name}
                              onChange={e => updateMember(mem.id, "name", e.target.value)}
                              placeholder="Full name"
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors[`${mem.id}-name`] ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"}`}
                            />
                            {errors[`${mem.id}-name`] && <p className="text-xs text-rose-600 mt-1">{errors[`${mem.id}-name`]}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Student ID</label>
                            <input
                              type="text"
                              value={mem.studentId}
                              onChange={e => updateMember(mem.id, "studentId", e.target.value)}
                              placeholder="ST123456"
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors[`${mem.id}-studentId`] ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"}`}
                            />
                            {errors[`${mem.id}-studentId`] && <p className="text-xs text-rose-600 mt-1">{errors[`${mem.id}-studentId`]}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {groupMembers.length < 10 && (
                    <button onClick={addMember} className="mt-3 flex items-center gap-2 text-sm text-violet-600 font-medium hover:text-violet-800 transition-colors">
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Notes for Tutor <span className="text-slate-400 text-xs font-normal">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value);
                    if (e.target.value.length <= 500) setErrors(er => { const n = { ...er }; delete n.notes; return n; });
                  }}
                  placeholder="Topics you'd like to cover, your current level, specific questions..."
                  rows={3}
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none ${errors.notes ? "border-rose-400" : "border-slate-200"}`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.notes ? <p className="text-xs text-rose-600">{errors.notes}</p> : <span />}
                  <span className={`text-xs ${notes.length > 500 ? "text-rose-500 font-medium" : "text-slate-400"}`}>{notes.length} / 500</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Summary ────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <img src={tutor.avatar} alt={tutor.name} className="w-full h-36 object-cover rounded-xl mb-4" />
            <h3 className="font-semibold text-slate-900">{tutor.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm text-slate-600">{tutor.rating} ({tutor.reviews} reviews)</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {tutor.subjects.map(s => <span key={s} className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs">{s}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Booking Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800">{selectedDay ? `${monthName} ${selectedDay}, ${currentYear}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-medium text-slate-800">{selectedTime || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Type</span>
                <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${sessionType === "group" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>{sessionType}</span>
              </div>
              {sessionType === "group" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Members</span>
                  <span className="font-medium text-slate-800">{groupMembers.length}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base fee ({sessionType})</span>
                  <span>Rs. {price.toLocaleString()}</span>
                </div>
                {sessionType === "group" && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Group surcharge</span>
                    <span>+ Rs. {(GROUP_PRICE - INDIVIDUAL_PRICE).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">{sessionType === "group" ? "Group Session Fee" : "Session Fee"}</span>
                  <span className="font-bold text-violet-600 text-base">Rs. {price.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!selectedDay || !selectedTime}
              className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200"
            >
              Confirm Booking
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">Free cancellation up to 24 hours before</p>
          </div>
        </div>
      </div>
    </div>
  );
}
