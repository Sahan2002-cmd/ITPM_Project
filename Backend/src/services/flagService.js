import { Flag } from "../models/Flag.js";
import { Recording } from "../models/Recording.js";
import { toDisplayDate } from "../utils/validators.js";

function toFlagDto(flag) {
  return {
    id: flag._id.toString(),
    recordingId: flag.recording.toString(),
    recordingTitle: flag.recordingTitle,
    type: flag.type,
    title: flag.title,
    reporter: flag.reporterName,
    reported: flag.reportedTutorName,
    reportedAvatar: flag.reportedTutorAvatar,
    date: toDisplayDate(flag.createdAt),
    status: flag.status,
    priority: flag.priority,
    description: flag.description,
    sessionId: flag.sessionId,
    adminNote: flag.adminNote,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  };
}

export async function listFlags({ search = "", status = "" } = {}) {
  const query = {};

  if (status && status.toLowerCase() !== "all") {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { reporterName: { $regex: search, $options: "i" } },
      { reportedTutorName: { $regex: search, $options: "i" } },
      { recordingTitle: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const flags = await Flag.find(query).sort({ createdAt: -1 }).lean(false);
  return flags.map(toFlagDto);
}

export async function createFlag(payload, user) {
  const recording = await Recording.findById(payload.recordingId);
  if (!recording) {
    const error = new Error("Recording not found for report");
    error.statusCode = 404;
    throw error;
  }

  const flag = await Flag.create({
    recording: recording._id,
    recordingTitle: recording.title,
    type: payload.type,
    title: String(payload.title || `Flag for recording: ${recording.title}`).trim(),
    reporterName: String(payload.reporter || user?.name || "Student Reporter").trim(),
    reporterEmail: String(user?.email || "").toLowerCase(),
    reportedTutorName: recording.tutorName,
    reportedTutorAvatar: recording.tutorAvatar,
    priority: String(payload.priority || "medium"),
    description: String(payload.description || "").trim(),
    status: "pending",
    sessionId: `#REC-${recording._id.toString().slice(-6)}`,
  });

  return toFlagDto(flag);
}

export async function updateFlagStatus(id, payload) {
  const flag = await Flag.findById(id);
  if (!flag) return null;

  flag.status = String(payload.status || flag.status);
  if (payload.adminNote !== undefined) {
    flag.adminNote = String(payload.adminNote || "").trim();
  }

  await flag.save();
  return toFlagDto(flag);
}
