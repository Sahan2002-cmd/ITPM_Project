import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  MonitorPlay,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createMeeting, listMeetings, updateMeetingStatus } from "../services/Module_05_API";
import type { Meeting, MeetingStatus } from "../types/module5";

const statusOptions: Array<{ value: "all" | MeetingStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
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

export default function TutorMeetings() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isForAllStudents, setIsForAllStudents] = useState(false);
  const [subject, setSubject] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | MeetingStatus>("all");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const items = await listMeetings(statusFilter === "all" ? undefined : { status: statusFilter });
      setMeetings(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, [statusFilter]);

  const createMeetingHandler = async () => {
    const missingSingleStudent = !isForAllStudents && (!studentName.trim() || !studentEmail.trim());

    if (missingSingleStudent || !subject.trim() || !scheduledFor) {
      toast.error("Please fill required fields");
      return;
    }

    setCreating(true);
    try {
      await createMeeting({
        studentName: isForAllStudents ? "All Students" : studentName.trim(),
        studentEmail: isForAllStudents ? "all.students@peerlearn.local" : studentEmail.trim(),
        isForAllStudents,
        subject: subject.trim(),
        scheduledFor,
        durationMinutes,
        meetingLink: meetingLink.trim(),
        notes: notes.trim(),
      });

      toast.success("Meeting arranged successfully");
      setStudentName("");
      setStudentEmail("");
      setIsForAllStudents(false);
      setSubject("");
      setScheduledFor("");
      setDurationMinutes(60);
      setMeetingLink("");
      setNotes("");
      await loadMeetings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create meeting");
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (id: string, status: MeetingStatus) => {
    setUpdatingId(id);
    try {
      const updated = await updateMeetingStatus(id, status);
      setMeetings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(`Meeting marked as ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update meeting");
    } finally {
      setUpdatingId(null);
    }
  };

  const startMeeting = async (meeting: Meeting) => {
    if (meeting.status === "cancelled" || meeting.status === "completed") {
      toast.error("This meeting cannot be started");
      return;
    }

    setUpdatingId(meeting.id);
    try {
      const updated = await updateMeetingStatus(
        meeting.id,
        "confirmed",
        meeting.notes || "",
        meeting.meetingLink || "",
        true
      );
      setMeetings((prev) => prev.map((item) => (item.id === meeting.id ? updated : item)));

      navigate(`/tutor/meetings/${meeting.id}/live`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start meeting");
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      pending: meetings.filter((item) => item.status === "pending").length,
      confirmed: meetings.filter((item) => item.status === "confirmed").length,
      completed: meetings.filter((item) => item.status === "completed").length,
    }),
    [meetings]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-emerald-600" /> Arrange Meetings
          </h1>
          <p className="text-slate-500 mt-1">Tutor workflow: create and manage upcoming session meetings.</p>
        </div>
        <button
          onClick={() => void loadMeetings()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Create Meeting</h2>

          <label className="flex items-start gap-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50">
            <input
              type="checkbox"
              checked={isForAllStudents}
              onChange={(event) => setIsForAllStudents(event.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              <span className="font-medium">Arrange for all students</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                When enabled, this meeting appears in every student account.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder={isForAllStudents ? "All Students" : "Student name *"}
              disabled={isForAllStudents}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              value={studentEmail}
              onChange={(event) => setStudentEmail(event.target.value)}
              placeholder={isForAllStudents ? "all.students@peerlearn.local" : "Student email *"}
              disabled={isForAllStudents}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject *"
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              placeholder="Duration (minutes)"
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="Meeting link (Zoom/Meet)"
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {!isForAllStudents && (
            <p className="text-xs text-slate-500">
              For single-student meetings, the email must match that student's login email.
            </p>
          )}

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Notes for this meeting"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />

          <button
            onClick={() => void createMeetingHandler()}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <CalendarPlus className="w-4 h-4" /> {creating ? "Creating..." : "Arrange Meeting"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{counts.confirmed}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{counts.completed}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-slate-800">Scheduled Meetings</h2>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | MeetingStatus)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading meetings...</p>}

        {!loading && meetings.length === 0 && <p className="text-sm text-slate-500">No meetings found.</p>}

        {!loading && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{meeting.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                      {meeting.isForAllStudents ? <Users className="w-3.5 h-3.5" /> : null}
                      Student:{" "}
                      {meeting.isForAllStudents
                        ? "All Students"
                        : `${meeting.studentName} (${meeting.studentEmail})`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {formatDateTime(meeting.scheduledFor)} | {meeting.durationMinutes} min
                    </p>
                    {meeting.meetingLink && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 break-all">
                        <LinkIcon className="w-3.5 h-3.5" /> {meeting.meetingLink}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {meeting.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {meeting.status !== "cancelled" && meeting.status !== "completed" && (
                    <button
                      onClick={() => void startMeeting(meeting)}
                      disabled={updatingId === meeting.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs hover:bg-violet-700 disabled:opacity-50"
                    >
                      <MonitorPlay className="w-3.5 h-3.5" /> Start Meeting
                    </button>
                  )}
                  {meeting.status !== "confirmed" && (
                    <button
                      onClick={() => void changeStatus(meeting.id, "confirmed")}
                      disabled={updatingId === meeting.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}
                  {meeting.status !== "completed" && (
                    <button
                      onClick={() => void changeStatus(meeting.id, "completed")}
                      disabled={updatingId === meeting.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </button>
                  )}
                  {meeting.status !== "cancelled" && (
                    <button
                      onClick={() => void changeStatus(meeting.id, "cancelled")}
                      disabled={updatingId === meeting.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
