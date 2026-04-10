import { Recording } from "../models/Recording.js";
import {
  defaultThumbnail,
  normalizeChapters,
  normalizeTags,
  toFileInfo,
} from "./storageService.js";
import { toDisplayDate } from "../utils/validators.js";

function toRecordingDto(recording) {
  const filePath = recording.filePath || "";

  return {
    id: recording._id.toString(),
    title: recording.title,
    tutor: recording.tutorName,
    tutorEmail: recording.tutorEmail,
    avatar: recording.tutorAvatar,
    date: toDisplayDate(recording.createdAt),
    duration: recording.duration,
    subject: recording.subject,
    thumbnail: recording.thumbnail,
    views: recording.views,
    description: recording.description,
    visibility: recording.visibility,
    tags: recording.tags,
    fileName: recording.fileName,
    filePath,
    fileSizeMB: recording.fileSizeMB,
    chapters: recording.chapters || [],
    createdAt: recording.createdAt,
    updatedAt: recording.updatedAt,
  };
}

export async function listRecordings({ search = "", subject = "", tutorEmail = "" } = {}) {
  const query = {};

  if (subject && subject.toLowerCase() !== "all") {
    query.subject = subject;
  }

  if (tutorEmail) {
    query.tutorEmail = tutorEmail.toLowerCase();
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { tutorName: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const recordings = await Recording.find(query).sort({ createdAt: -1 }).lean(false);
  return recordings.map(toRecordingDto);
}

export async function getRecordingById(id) {
  const recording = await Recording.findById(id);
  if (!recording) return null;
  return toRecordingDto(recording);
}

export async function createRecording(payload, user, file) {
  const fileInfo = toFileInfo(file);

  const recording = await Recording.create({
    title: String(payload.title).trim(),
    subject: String(payload.subject).trim(),
    description: String(payload.description || "").trim(),
    tutorName: String(payload.tutor || user?.name || "Tutor").trim(),
    tutorEmail: String(payload.tutorEmail || user?.email || "").toLowerCase().trim(),
    tutorAvatar: String(payload.avatar || user?.avatar || "").trim(),
    duration: String(payload.duration || "00:00").trim(),
    visibility: String(payload.visibility || "enrolled"),
    tags: normalizeTags(payload.tags),
    thumbnail: String(payload.thumbnail || defaultThumbnail(payload.subject)).trim(),
    fileName: fileInfo.fileName || String(payload.fileName || "").trim(),
    filePath: fileInfo.filePath,
    fileSizeMB: fileInfo.fileSizeMB || Number(payload.fileSizeMB || 0),
    chapters: normalizeChapters(payload.chapters),
  });

  return toRecordingDto(recording);
}

export async function deleteRecordingById(id, requestUser) {
  const recording = await Recording.findById(id);
  if (!recording) return null;

  const sameTutor = recording.tutorEmail === String(requestUser?.email || "").toLowerCase();
  const canDelete = requestUser?.role === "admin" || sameTutor || requestUser?.role === "tutor";

  if (!canDelete) {
    const error = new Error("Not allowed to delete this recording");
    error.statusCode = 403;
    throw error;
  }

  await recording.deleteOne();
  return { removedId: id };
}

export async function incrementRecordingViews(id, increment = 1) {
  const recording = await Recording.findById(id);
  if (!recording) return null;

  recording.views += Math.max(1, Number(increment || 1));
  await recording.save();

  return toRecordingDto(recording);
}
