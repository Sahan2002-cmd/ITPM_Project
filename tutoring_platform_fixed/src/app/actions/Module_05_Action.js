/**
 * Module_05_Action.js — Action Layer
 * Module 5: Session Recording & Moderation (Member 5)
 * Pages: UploadRecording.tsx, RecordingsList.tsx, RecordingPlayback.tsx, AdminModeration.tsx
 *
 * Validation Rules Enforced:
 *   - Upload: only the tutor of that specific session
 *   - Timing: only after session status = "Completed"
 *   - File types: MP4, MOV, WEBM, MP3, WAV only
 *   - Max file size: 100 MB
 *   - One active recording per session (reject if already exists)
 *   - Status on upload: "Active"
 *   - Students: only view recordings from their OWN sessions
 *   - Admin flag → status = "Flagged" → hidden from student immediately
 *   - Admin restore → status = "Active"
 *   - Admin hard-delete: mandatory moderation reason required
 *   - Auto-delete after 30 days: handled by backend scheduled job
 */

import {
  uploadRecording,
  getRecordingById,
  getRecordingBySession,
  getRecordingsByStudent,
  getRecordingsByTutor,
  getAllRecordingsAdmin,
  getRecordingStreamUrl,
  deleteTutorRecording,
  flagRecording,
  getModerationReports,
  getModerationReportById,
  restoreRecording,
  updateModerationReportStatus,
  adminHardDeleteRecording,
} from "../services/Module_05_API";

// ── Validation Helpers ────────────────────────────────────────────────────────

const MAX_RECORDING_MB = 100;
const MAX_RECORDING_BYTES = MAX_RECORDING_MB * 1024 * 1024;
const ALLOWED_RECORDING_TYPES = ["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav"];
const ALLOWED_RECORDING_EXTENSIONS = [".mp4", ".mov", ".webm", ".mp3", ".wav"];

const validateRecordingFile = (file) => {
  if (!file) return "Please select a recording file.";
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_RECORDING_EXTENSIONS.includes(ext))
    return "Only MP4, MOV, WEBM, MP3, and WAV files are allowed.";
  if (file.size > MAX_RECORDING_BYTES)
    return `Recording file must not exceed ${MAX_RECORDING_MB} MB.`;
  return null;
};

// ── RECORDING ACTIONS ─────────────────────────────────────────────────────────

/**
 * uploadRecordingAction
 * Upload a session recording from UploadRecording.tsx.
 * Validates: file type, file size, title required, sessionId and tutorId valid.
 * One active recording per session — backend rejects duplicates.
 *
 * @param {number} sessionId
 * @param {number} tutorId
 * @param {File} file
 * @param {Object} metadata - { title, subject, description, visibility, tags }
 * @returns {{ success: boolean, recording?: Object, errors?: Object }}
 */
export const uploadRecordingAction = async (sessionId, tutorId, file, metadata) => {
  const errors = {};

  const fileErr = validateRecordingFile(file);
  if (fileErr) errors.file = fileErr;

  if (!metadata.title?.trim()) errors.title = "Recording title is required.";
  if (!metadata.subject?.trim()) errors.subject = "Subject is required.";
  if (!sessionId) errors.session = "Session ID is required.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await uploadRecording(
      sessionId,
      tutorId,
      file,
      metadata.title.trim(),
      metadata.subject.trim(),
      metadata.description || "",
      metadata.visibility || "enrolled",
      metadata.tags || []
    );
    return { success: true, recording: response.recording };
  } catch (err) {
    if (err.message?.toLowerCase().includes("already exists"))
      return {
        success: false,
        errors: { general: "A recording already exists for this session. Delete it first to upload a new one." },
      };
    if (err.message?.toLowerCase().includes("not completed"))
      return {
        success: false,
        errors: { general: "You can only upload a recording after the session is completed." },
      };
    return { success: false, errors: { general: err.message || "Upload failed." } };
  }
};

/**
 * getRecordingAction
 * Fetch a single recording (with access control validation).
 * Students can only access recordings from their own sessions.
 * @param {number} recordingId
 * @param {number} requesterId - studentId or tutorId
 * @returns {{ success: boolean, recording?: Object, error?: string }}
 */
export const getRecordingAction = async (recordingId, requesterId) => {
  try {
    const recording = await getRecordingById(recordingId, requesterId);
    return { success: true, recording };
  } catch (err) {
    if (err.message?.includes("403"))
      return { success: false, error: "Access denied. You can only view recordings from your own sessions." };
    return { success: false, error: err.message };
  }
};

/**
 * getSessionRecordingAction
 * Get the recording for a specific session (for RecordingPlayback.tsx).
 * @param {number} sessionId
 * @param {number} requesterId
 * @returns {{ success: boolean, recording?: Object, error?: string }}
 */
export const getSessionRecordingAction = async (sessionId, requesterId) => {
  try {
    const recording = await getRecordingBySession(sessionId, requesterId);
    return { success: true, recording };
  } catch (err) {
    if (err.message?.includes("403"))
      return { success: false, error: "You are not authorized to view this recording." };
    if (err.message?.includes("404"))
      return { success: true, recording: null }; // No recording yet
    return { success: false, error: err.message };
  }
};

/**
 * getStudentRecordingsAction
 * Fetch all recordings accessible to a student (their own sessions only).
 * Used on RecordingsList.tsx.
 * @param {number} studentId
 * @param {string} [subject]
 * @param {string} [search]
 * @returns {{ success: boolean, recordings?: Array, error?: string }}
 */
export const getStudentRecordingsAction = async (studentId, subject = "", search = "") => {
  try {
    const data = await getRecordingsByStudent(studentId, subject, search);
    return { success: true, recordings: data.recordings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getTutorRecordingsAction
 * Fetch all recordings uploaded by a tutor (for their dashboard).
 * @param {number} tutorId
 * @returns {{ success: boolean, recordings?: Array, error?: string }}
 */
export const getTutorRecordingsAction = async (tutorId) => {
  try {
    const data = await getRecordingsByTutor(tutorId);
    return { success: true, recordings: data.recordings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getRecordingStreamAction
 * Get the playback/stream URL for a recording.
 * @param {number} recordingId
 * @param {number} requesterId
 * @returns {{ success: boolean, streamUrl?: string, error?: string }}
 */
export const getRecordingStreamAction = async (recordingId, requesterId) => {
  try {
    const data = await getRecordingStreamUrl(recordingId, requesterId);
    return { success: true, streamUrl: data.streamUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * deleteTutorRecordingAction
 * Tutor deletes their own recording (to re-upload a corrected version).
 * Removes file from server + sets DB record to "Deleted".
 * @param {number} recordingId
 * @param {number} tutorId
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteTutorRecordingAction = async (recordingId, tutorId) => {
  try {
    await deleteTutorRecording(recordingId, tutorId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete recording." };
  }
};

// ── ADMIN MODERATION ACTIONS ──────────────────────────────────────────────────

/**
 * getModerationReportsAction
 * Admin: Get all moderation reports for AdminModeration.tsx.
 * @param {Object} [filters] - { status? }
 * @returns {{ success: boolean, reports?: Array, counts?: Object, error?: string }}
 */
export const getModerationReportsAction = async (filters = {}) => {
  try {
    const data = await getModerationReports(filters);
    const reports = data.reports || data;
    const counts = {
      pending:   reports.filter((r) => r.status === "pending").length,
      reviewing: reports.filter((r) => r.status === "reviewing").length,
      resolved:  reports.filter((r) => r.status === "resolved").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
    };
    return { success: true, reports, counts };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAllRecordingsAdminAction
 * Admin: Get all recordings platform-wide (including Flagged and Deleted).
 * @param {Object} [filters]
 * @returns {{ success: boolean, recordings?: Array, error?: string }}
 */
export const getAllRecordingsAdminAction = async (filters = {}) => {
  try {
    const data = await getAllRecordingsAdmin(filters);
    return { success: true, recordings: data.recordings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * flagRecordingAction
 * Admin flags a recording → status = "Flagged" → immediately hidden from student.
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} flagReason
 * @returns {{ success: boolean, error?: string }}
 */
export const flagRecordingAction = async (recordingId, adminId, flagReason) => {
  if (!flagReason?.trim())
    return { success: false, error: "A reason is required when flagging a recording." };

  try {
    await flagRecording(recordingId, adminId, flagReason.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * restoreRecordingAction
 * Admin restores a flagged recording → status = "Active".
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} [notes]
 * @returns {{ success: boolean, error?: string }}
 */
export const restoreRecordingAction = async (recordingId, adminId, notes = "") => {
  try {
    await restoreRecording(recordingId, adminId, notes);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * updateModerationStatusAction
 * Admin updates the status of a moderation report.
 * @param {string} reportId
 * @param {number} adminId
 * @param {"reviewing" | "resolved" | "dismissed"} status
 * @param {string} [notes]
 * @returns {{ success: boolean, error?: string }}
 */
export const updateModerationStatusAction = async (reportId, adminId, status, notes = "") => {
  try {
    await updateModerationReportStatus(reportId, adminId, status, notes);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * adminHardDeleteRecordingAction
 * Admin permanently deletes a recording from server and DB.
 * Moderation reason is MANDATORY and logged.
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} reason - Required
 * @returns {{ success: boolean, error?: string }}
 */
export const adminHardDeleteRecordingAction = async (recordingId, adminId, reason) => {
  if (!reason?.trim())
    return { success: false, error: "A moderation reason is required for permanent deletion." };

  try {
    await adminHardDeleteRecording(recordingId, adminId, reason.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── NOTE ─────────────────────────────────────────────────────────────────────
// Auto-delete of recordings older than 30 days is handled by a
// server-side scheduled background job. This file does NOT include
// a frontend trigger for auto-delete — it is fully automatic.
