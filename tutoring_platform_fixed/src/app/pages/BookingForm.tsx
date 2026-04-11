import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, User, Check, Plus, Trash2, AlertCircle, Loader2, BadgeCheck } from "lucide-react";
import { getTutorProfileById, getAvailabilityByTutor } from "../services/Module_01_API";
import { createBooking } from "../services/Module_02_API";
import { useAuth } from "../contexts/AuthContext";

interface TutorProfile {
  Id: string;
  UserId: number;
  FullName: string;
  SubjectsTaught: string[];
  HourlyRate: number;
  Bio: string;
  YearsOfExperience: number;
  IsVerified: boolean;
}

interface AvailabilitySlot {
  Id: string;
  TutorProfileId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Status: string;
}

/** Convert a UTC datetime string to SLST (UTC+5:30) "HH:MM AM/PM" */
function toSlstTime(utcStr: string): string {
  return new Date(utcStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: "Asia/Colombo",
  });
}

/** Return SLST date as "YYYY-MM-DD" from a UTC datetime string */
function toSlstDateKey(utcStr: string): string {
  return new Date(utcStr).toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

const INDIVIDUAL_PRICE = 2000;
const GROUP_PRICE = 3500;
const STUDENT_ID_REGEX = /^ST\d{6}$/i;
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

type GroupMember = { id: string; name: string; studentId: string };
type FieldErrors = Record<string, string>;

export default function BookingForm() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [sessionType, setSessionType] = useState<"individual" | "group">("individual");
  const [notes, setNotes] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([{ id: "member-1", name: "", studentId: "" }]);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!tutorId) return;
    getTutorProfileById(tutorId)
      .then((res: any) => setTutor(res.Data ?? res ?? null))
      .catch(() => {})
      .finally(() => setLoadingTutor(false));
    getAvailabilityByTutor(tutorId)
      .then((res: any) => setSlots((res.Data ?? res ?? []).filter((s: AvailabilitySlot) => s.Status === "Free")))
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [tutorId]);

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const calDayKey = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const daysWithFreeSlots = new Set(slots.map(s => toSlstDateKey(s.Date)));

  const slotsForDay = selectedDay
    ? slots.filter(s => toSlstDateKey(s.Date) === calDayKey(selectedDay))
    : [];

  const step = !selectedDay ? 1 : !selectedSlot ? 2 : 3;
  const price = sessionType === "individual" ? INDIVIDUAL_PRICE : GROUP_PRICE;

  const addMember = () => {
    if (groupMembers.length >= 10) return;
    setGroupMembers(m => [...m, { id: `member-${Date.now()}`, name: "", studentId: "" }]);
  };
  const removeMember = (id: string) => setGroupMembers(m => m.filter(mem => mem.id !== id));
  const updateMember = (id: string, field: "name" | "studentId", value: string) => {
    setGroupMembers(m => m.map(mem => mem.id === id ? { ...mem, [field]: value } : mem));
    setErrors(e => { const next = { ...e }; delete next[`${id}-${field}`]; return next; });
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!selectedSlot) errs.time = "Please select a time slot.";
    if (notes.length > 500) errs.notes = "Notes must be 500 characters or fewer.";
    if (sessionType === "group") {
      if (groupMembers.length < 1) errs.groupGeneral = "At least one group member is required.";
      const seenIds = new Set<string>();
      groupMembers.forEach(mem => {
        const nameKey = `${mem.id}-name`;
        const idKey = `${mem.id}-studentId`;
        if (!mem.name.trim()) errs[nameKey] = "Member name is required.";
        else if (mem.name.trim().length < 2 || mem.name.trim().length > 50) errs[nameKey] = "Name must be 2â€“50 characters.";
        if (!mem.studentId.trim()) errs[idKey] = "Student ID is required.";
        else if (!STUDENT_ID_REGEX.test(mem.studentId.trim())) errs[idKey] = "Student ID must follow format ST123456.";
        else if (seenIds.has(mem.studentId.trim().toUpperCase())) errs[idKey] = "Duplicate Student ID.";
        else seenIds.add(mem.studentId.trim().toUpperCase());
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate() || !tutor || !selectedSlot || !user?.userId) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await createBooking({
        AvailabilityId: selectedSlot.Id,
        TutorProfileId: tutor.Id,
        TutorId: tutor.UserId,
        StudentId: user.userId,
      });
      const slstDate = new Date(new Date(selectedSlot.Date).getTime() + 5.5 * 60 * 60 * 1000)
        .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const durationMinutes = Math.round(
        (new Date(selectedSlot.EndTime).getTime() - new Date(selectedSlot.StartTime).getTime()) / 60000
      );
      navigate("/student/booking-confirmation", {
        state: {
          bookingId: res?.Data?.BookingId ?? null,
          tutorName: tutor.FullName,
          subjects: tutor.SubjectsTaught ?? [],
          sessionDate: slstDate,
          startTime: toSlstTime(selectedSlot.StartTime),
          endTime: toSlstTime(selectedSlot.EndTime),
          sessionType,
          price,
          durationMinutes,
        },
      });
    } catch (err: any) {
      setSubmitError(err.message || "Booking failed. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loadingTutor) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!tutor) {
    return <div className="p-6 max-w-5xl mx-auto text-center py-20 text-rose-600">Tutor not found.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* â”€â”€ Left: Booking Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Select Date", "Choose Slot", "Confirm Details"].map((label, i) => (
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
                const hasSlots = daysWithFreeSlots.has(calDayKey(day));
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    disabled={isPast || (!loadingSlots && !hasSlots)}
                    onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                    className={`aspect-square rounded-xl text-sm font-medium transition-all relative ${
                      isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : isPast ? "text-slate-300 cursor-not-allowed"
                      : hasSlots ? "hover:bg-violet-50 text-slate-700 hover:text-violet-700 ring-1 ring-violet-200"
                      : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {day}
                    {!isPast && hasSlots && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            {loadingSlots && (
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading availability...
              </p>
            )}
            {!loadingSlots && slots.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-3">No available slots for this tutor.</p>
            )}
          </div>

          {/* Time Slots */}
          {selectedDay && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-violet-600" /> Choose Time Slot</h2>
              {errors.time && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mb-3"><AlertCircle className="w-3.5 h-3.5" />{errors.time}</p>
              )}
              {slotsForDay.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No available slots on this date. Please choose another day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slotsForDay.map(slot => {
                    const isSelected = selectedSlot?.Id === slot.Id;
                    return (
                      <button
                        key={slot.Id}
                        onClick={() => { setSelectedSlot(slot); setErrors(e => { const n = { ...e }; delete n.time; return n; }); }}
                        className={`py-3 px-2 rounded-xl text-xs font-medium transition-all border ${
                          isSelected
                            ? "bg-violet-600 text-white border-violet-600 shadow-md"
                            : "bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-700 border-slate-200"
                        }`}
                      >
                        <div>{toSlstTime(slot.StartTime)}</div>
                        <div className="text-[10px] opacity-70">â†’ {toSlstTime(slot.EndTime)}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">SLST</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Session Details */}
          {selectedSlot && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              <h2 className="font-semibold text-slate-800">Session Details</h2>

              {/* Session Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Session Type <span className="text-rose-500">*</span></label>
                <div className="flex gap-3">
                  {[
                    { id: "individual" as const, icon: User, label: "Individual", price: INDIVIDUAL_PRICE },
                    { id: "group" as const, icon: Users, label: "Group", price: GROUP_PRICE },
                  ].map(({ id, icon: Icon, label, price: p }) => (
                    <button
                      key={id}
                      onClick={() => setSessionType(id)}
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

        {/* â”€â”€ Right: Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="space-y-5">
          {/* Tutor Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="w-full h-20 bg-violet-100 rounded-xl flex items-center justify-center mb-4 text-4xl font-bold text-violet-700">
              {tutor.FullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-900">{tutor.FullName}</h3>
              {tutor.IsVerified && <BadgeCheck className="w-4 h-4 text-violet-500" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">{tutor.YearsOfExperience} yr{tutor.YearsOfExperience !== 1 ? "s" : ""} experience</p>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {(tutor.SubjectsTaught ?? []).map(s => <span key={s} className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs">{s}</span>)}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Booking Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800">
                  {selectedDay ? `${monthName} ${selectedDay}, ${currentYear}` : "â€”"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time (SLST)</span>
                <span className="font-medium text-slate-800">
                  {selectedSlot ? `${toSlstTime(selectedSlot.StartTime)} â€“ ${toSlstTime(selectedSlot.EndTime)}` : "â€”"}
                </span>
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
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">Session Fee</span>
                  <span className="font-bold text-violet-600 text-base">Rs. {price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {submitError && (
              <p className="mt-3 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {submitError}
              </p>
            )}

            <button
              onClick={handleConfirm}
              disabled={!selectedDay || !selectedSlot || submitLoading}
              className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 flex items-center justify-center gap-2"
            >
              {submitLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : "Confirm Booking"}
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">Free cancellation up to 2 hours before</p>
          </div>
        </div>
      </div>
    </div>
  );
}


