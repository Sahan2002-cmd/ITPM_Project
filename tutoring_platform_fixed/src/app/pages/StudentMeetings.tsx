import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  MonitorPlay,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { listMeetings } from "../services/Module_05_API";
import type { Meeting, MeetingStatus } from "../types/module5";

const statusOptions: Array<{ value: "all" | MeetingStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentMeetings() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | MeetingStatus>("all");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMeetings = async () => {
    setLoading(true);
    setError("");

    try {
      const items = await listMeetings(statusFilter === "all" ? undefined : { status: statusFilter });
      setMeetings(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, [statusFilter]);

  const summary = useMemo(() => {
    const upcoming = meetings.filter((item) => item.status === "pending" || item.status === "confirmed").length;
    const completed = meetings.filter((item) => item.status === "completed").length;
    return { upcoming, completed, total: meetings.length };
  }, [meetings]);

  const joinMeeting = (meeting: Meeting) => {
    if (!meeting.isLive) {
      toast.error("Tutor has not started this meeting yet");
      return;
    }

    if (meeting.status === "cancelled" || meeting.status === "completed") {
      toast.error("This meeting is not available");
      return;
    }

    navigate(`/student/meetings/${meeting.id}/live`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-violet-600" /> My Meetings
          </h1>
          <p className="text-slate-500 mt-1">Join arranged meetings and enable your microphone when class starts.</p>
        </div>

        <button
          onClick={() => void loadMeetings()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Meetings</p>
          <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Upcoming</p>
          <p className="text-2xl font-bold text-violet-700">{summary.upcoming}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-700">{summary.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-800">Scheduled Meetings</h2>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | MeetingStatus)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading meetings...</p>}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <p className="text-sm text-slate-500">No meetings found.</p>
        )}

        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const canJoin =
                Boolean(meeting.isLive) &&
                meeting.status !== "cancelled" &&
                meeting.status !== "completed";

              return (
                <div key={meeting.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{meeting.subject}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Tutor: {meeting.tutorName}
                      </p>
                      {meeting.isForAllStudents && (
                        <p className="text-xs text-indigo-600 mt-1 inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Audience: All Students
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatDateTime(meeting.scheduledFor)} | {meeting.durationMinutes} min
                      </p>
                      {meeting.notes && <p className="text-xs text-slate-500 mt-1">Notes: {meeting.notes}</p>}
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {meeting.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => joinMeeting(meeting)}
                      disabled={!canJoin}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <MonitorPlay className="w-3.5 h-3.5" /> Join Meeting
                    </button>
                    {!meeting.isLive && (
                      <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        Waiting for tutor to start
                      </span>
                    )}

                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open External Link
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
