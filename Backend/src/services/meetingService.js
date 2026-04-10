import { Meeting } from "../models/Meeting.js";

const ALL_STUDENTS_MARKER_EMAIL = "all.students@peerlearn.local";

function isAllStudentsMeeting(record) {
  const markerEmail = String(record?.studentEmail || "").toLowerCase();
  return Boolean(record?.isForAllStudents) || markerEmail === ALL_STUDENTS_MARKER_EMAIL;
}

function toMeetingDto(meeting) {
  return {
    id: meeting._id.toString(),
    tutorName: meeting.tutorName,
    tutorEmail: meeting.tutorEmail,
    tutorAvatar: meeting.tutorAvatar,
    studentName: meeting.studentName,
    studentEmail: meeting.studentEmail,
    studentAvatar: meeting.studentAvatar,
    isForAllStudents: isAllStudentsMeeting(meeting),
    subject: meeting.subject,
    scheduledFor: meeting.scheduledFor,
    durationMinutes: meeting.durationMinutes,
    meetingLink: meeting.meetingLink,
    isLive: Boolean(meeting.isLive),
    status: meeting.status,
    notes: meeting.notes,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

export async function listMeetings({ role = "student", email = "", status = "" } = {}) {
  const query = {};
  const cleanEmail = String(email || "").toLowerCase();

  if (role === "tutor") {
    query.tutorEmail = cleanEmail;
  }
  // For student/admin role, return all meetings (Module 5 behavior).

  if (status && status.toLowerCase() !== "all") {
    query.status = status;
  }

  const meetings = await Meeting.find(query).sort({ scheduledFor: 1 }).lean(false);
  return meetings.map(toMeetingDto);
}

export async function getMeetingById(id) {
  const meeting = await Meeting.findById(id).lean(false);
  if (!meeting) return null;
  return toMeetingDto(meeting);
}

export async function createMeeting(payload, user) {
  const isForAllStudents =
    payload.isForAllStudents === true ||
    String(payload.isForAllStudents || "").toLowerCase() === "true";

  const meeting = await Meeting.create({
    tutorName: String(user?.name || payload.tutorName || "Tutor").trim(),
    tutorEmail: String(user?.email || payload.tutorEmail || "").toLowerCase().trim(),
    tutorAvatar: String(user?.avatar || payload.tutorAvatar || "").trim(),
    studentName: isForAllStudents ? "All Students" : String(payload.studentName || "").trim(),
    studentEmail: isForAllStudents
      ? ALL_STUDENTS_MARKER_EMAIL
      : String(payload.studentEmail || "").toLowerCase().trim(),
    studentAvatar: isForAllStudents ? "" : String(payload.studentAvatar || "").trim(),
    isForAllStudents,
    subject: String(payload.subject || "").trim(),
    scheduledFor: new Date(payload.scheduledFor),
    durationMinutes: Number(payload.durationMinutes || 60),
    meetingLink: String(payload.meetingLink || "").trim(),
    isLive: false,
    notes: String(payload.notes || "").trim(),
    status: String(payload.status || "pending"),
  });

  return toMeetingDto(meeting);
}

export async function updateMeeting(id, payload) {
  const meeting = await Meeting.findById(id);
  if (!meeting) return null;

  if (payload.status !== undefined) meeting.status = String(payload.status);
  if (payload.notes !== undefined) meeting.notes = String(payload.notes || "").trim();
  if (payload.meetingLink !== undefined) meeting.meetingLink = String(payload.meetingLink || "").trim();
  if (payload.isLive !== undefined) {
    meeting.isLive =
      payload.isLive === true || String(payload.isLive || "").toLowerCase() === "true";
  }

  if (meeting.status === "cancelled" || meeting.status === "completed") {
    meeting.isLive = false;
  }

  await meeting.save();
  return toMeetingDto(meeting);
}
