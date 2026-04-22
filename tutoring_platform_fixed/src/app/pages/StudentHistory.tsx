import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Clock, Filter, Download, MessageSquare, RotateCcw, ChevronRight, Calendar, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getBookingsByStudent, cancelBooking } from "../services/Module_02_API";
import { getAllTutors } from "../services/Module_01_API";

type Booking = {
  Id: string;
  BookingId: number;
  TutorProfileId: string;
  TutorId: number;
  StudentId: number;
  Status: string;
  SessionDate: string;
  StartTime: string;
  EndTime: string;
};

type TutorProfile = {
  Id: string;
  UserId: number;
  FullName: string;
  SubjectsTaught: string[];
  HourlyRate: number;
};

function toSlstTime(utcStr: string): string {
  if (!utcStr) return "";
  return new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z").toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo",
  });
}

function toSlstDateStr(utcStr: string): string {
  if (!utcStr) return "";
  return new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Colombo",
  });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Confirmed: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cancelled: { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
  Declined:  { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
};

const FILTER_MAP: Record<string, string[]> = {
  all:       ["Pending", "Confirmed", "Completed", "Cancelled", "Declined"],
  upcoming:  ["Confirmed", "Pending"],
  completed: ["Completed"],
  cancelled: ["Cancelled", "Declined"],
};

export default function StudentHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelError, setCancelError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    if (!user?.userId) return;
    try {
      const res = await getBookingsByStudent(user.userId);
      if (res?.StatusCode === 1) setBookings(Array.isArray(res.Data) ? res.Data : []);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.userId) return;
      try {
        const [bookRes, tutorRes] = await Promise.all([
          getBookingsByStudent(user.userId),
          getAllTutors(),
        ]);
        if (bookRes?.StatusCode === 1) setBookings(Array.isArray(bookRes.Data) ? bookRes.Data : []);
        if (tutorRes?.StatusCode === 1) setTutors(Array.isArray(tutorRes.Data) ? tutorRes.Data : []);
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.userId]);

  const tutorMap = new Map<string, TutorProfile>(tutors.map(t => [t.Id, t]));

  const filtered = bookings.filter(b => FILTER_MAP[filter]?.includes(b.Status));

  const upcomingCount = bookings.filter(b => b.Status === "Confirmed" || b.Status === "Pending").length;
  const completedCount = bookings.filter(b => b.Status === "Completed").length;

  const handleCancel = async (bookingId: number) => {
    setCancelError("");
    setCancellingId(bookingId);
    try {
      const res = await cancelBooking(bookingId, user?.userId as number);
      if (res?.StatusCode === 1) {
        await fetchBookings();
      } else {
        setCancelError(res?.Message || "Unable to cancel booking.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking History</h1>
          <p className="text-slate-500 mt-1">Track all your tutoring sessions</p>
        </div>
        <button
          onClick={() => {
            if (bookings.length === 0) return;
            const rows = [
              ["Booking ID", "Tutor", "Subject", "Date", "Start Time", "End Time", "Status"],
              ...bookings.map(b => {
                const tutor = tutorMap.get(b.TutorProfileId);
                return [
                  b.BookingId ?? b.Id ?? "",
                  tutor?.FullName ?? "Unknown Tutor",
                  tutor?.SubjectsTaught?.[0] ?? "Session",
                  toSlstDateStr(b.SessionDate),
                  toSlstTime(b.StartTime),
                  toSlstTime(b.EndTime),
                  b.Status,
                ];
              }),
            ];
            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `booking-history-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {cancelError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {cancelError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming Sessions", value: loading ? "—" : upcomingCount, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed Sessions", value: loading ? "—" : completedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Bookings", value: loading ? "—" : bookings.length, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Calendar className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "upcoming", "completed", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {f === "all" ? "All Bookings" : f}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Loading your bookings...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No bookings found</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const statusStyle = STATUS_STYLES[booking.Status] ?? STATUS_STYLES["Pending"];
            const tutor = tutorMap.get(booking.TutorProfileId);
            return (
              <div key={booking.Id ?? booking.BookingId ?? String(Math.random())} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg flex-shrink-0">
                    {tutor?.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{tutor?.FullName ?? "Tutor"}</h3>
                        <p className="text-sm text-slate-500">{tutor?.SubjectsTaught?.[0] ?? "Session"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {booking.Status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {toSlstDateStr(booking.SessionDate)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {toSlstTime(booking.StartTime)} – {toSlstTime(booking.EndTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 border-t border-slate-100 pt-4">
                  {(booking.Status === "Confirmed" || booking.Status === "Pending") && (
                    <>
                      <Link to="/student/chat" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5 text-violet-500" /> Message
                      </Link>
                      {booking.Status === "Confirmed" && (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 rounded-lg text-xs font-medium text-white hover:bg-violet-700 transition-colors">
                          Join Session <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(booking.BookingId)}
                        disabled={cancellingId === booking.BookingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors ml-auto disabled:opacity-50"
                      >
                        {cancellingId === booking.BookingId ? "Cancelling..." : "Cancel"}
                      </button>
                    </>
                  )}
                  {booking.Status === "Completed" && (
                    <>
                      <Link
                        to="/student/session/review"
                        state={{
                          bookingId: booking.BookingId,
                          tutorProfileId: booking.TutorProfileId,
                          tutorId: booking.TutorId,
                          tutorName: tutor?.FullName ?? "Tutor",
                          sessionDate: booking.SessionDate,
                          subject: tutor?.SubjectsTaught?.[0] ?? "Session",
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Rate Session
                      </Link>
                      <Link
                        to={`/student/booking/${booking.TutorProfileId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Book Again
                      </Link>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
