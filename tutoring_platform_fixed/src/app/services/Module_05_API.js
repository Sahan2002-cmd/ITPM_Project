/**
 * Module_05_API.js — Service Layer
 * Module 5: Session Recording & Moderation (Member 5)
 * Backend: RecordingController.cs, DashboardController.cs
 *          → DARecording.cs, DADashboard.cs
 *          → PLT_RECORDING_PROC.sql, PLT_DASHBOARD_PROC.sql
 *
 * Covers CRUD:
 *   Recording   → Create (upload), Read, Delete (tutor own / admin hard)
 *   Moderation  → Create (flag), Read (admin all), Update (flag/restore/hard-delete)
 *
 * Key Validation Rules (from Validation_Notes_By_Member.txt):
 *   - Upload permission: only the tutor who conducted that specific session
 *   - Timing: only after session status = "Completed"
 *   - File types: MP4, MOV, WEBM, MP3, WAV only
 *   - Max file size: 100 MB
 *   - One active recording per session
 *   - Status on upload: "Active"
 *   - Students can only view recordings from their OWN sessions
 *   - Admin can read ALL recordings
 *   - Flag → status = "Flagged" → immediately hidden from student
 *   - Restore → status back to "Active"
 *   - Admin hard-delete must log a moderation reason
 *   - Auto-delete: recordings older than 30 days (background job — not a manual action)
 *   - Student is notified before auto-deletion
 */

const BASE_URL = "https://localhost:44331/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

// ══════════════════════════════════════════════════════════
// RECORDING UPLOAD & MANAGEMENT
// Pages: UploadRecording.tsx, RecordingsList.tsx, RecordingPlayback.tsx
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Upload a session recording.
 * Only the tutor of that specific session can upload.
 * Only allowed after session status = "Completed".
 * Only one active recording per session — reject if one already exists.
 * Status is set to "Active" on upload.
 * Allowed types: MP4, MOV, WEBM, MP3, WAV | Max: 100 MB.
 * Sent as multipart/form-data.
 *
 * @param {number} sessionId
 * @param {number} tutorId          - Authorization: must be tutor of that session
 * @param {File} file               - The recording file
 * @param {string} title            - Display title for the recording
 * @param {string} subject
 * @param {string} [description]
 * @param {string} visibility       - e.g. "enrolled" (students of this session only)
 * @param {string[]} [tags]
 */
export const uploadRecording = async (sessionId, tutorId, file, title, subject, description = "", visibility = "enrolled", tags = []) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sessionId", sessionId);
  formData.append("tutorId", tutorId);
  formData.append("title", title);
  formData.append("subject", subject);
  formData.append("description", description);
  formData.append("visibility", visibility);
  tags.forEach((tag) => formData.append("tags[]", tag));

  const res = await fetch(`${BASE_URL}/recording`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get a single recording by its ID.
 * Students can only access recordings from their OWN sessions (backend enforced).
 * @param {number} recordingId
 * @param {number} requesterId - For cross-session access validation
 */
export const getRecordingById = async (recordingId, requesterId) => {
  const res = await fetch(
    `${BASE_URL}/recording/${recordingId}?requesterId=${requesterId}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * Get the recording for a specific session.
 * @param {number} sessionId
 * @param {number} requesterId - studentId or tutorId for access validation
 */
export const getRecordingBySession = async (sessionId, requesterId) => {
  const res = await fetch(
    `${BASE_URL}/recording/session/${sessionId}?requesterId=${requesterId}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * Get all recordings accessible to a specific student (only their own sessions).
 * Returns only "Active" status recordings — "Flagged" and "Deleted" are hidden.
 * @param {number} studentId
 * @param {string} [subject]  - Optional filter
 * @param {string} [search]   - Optional text search
 */
export const getRecordingsByStudent = async (studentId, subject = "", search = "") => {
  const params = new URLSearchParams({ subject, search }).toString();
  const res = await fetch(
    `${BASE_URL}/recording/student/${studentId}?${params}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * Get all recordings uploaded by a tutor.
 * @param {number} tutorId
 */
export const getRecordingsByTutor = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/recording/tutor/${tutorId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get ALL recordings across the platform.
 * Includes Active, Flagged, and Deleted records.
 * @param {Object} [filters] - { status?, tutorId?, startDate?, endDate? }
 */
export const getAllRecordingsAdmin = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/recording/admin/all?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get the streaming URL for a recording playback.
 * Returns a presigned URL or stream endpoint.
 * @param {number} recordingId
 * @param {number} requesterId
 */
export const getRecordingStreamUrl = async (recordingId, requesterId) => {
  const res = await fetch(
    `${BASE_URL}/recording/${recordingId}/stream?requesterId=${requesterId}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Tutor deletes their own recording (to re-upload a corrected version).
 * Removes the file from the server and sets DB record status = "Deleted".
 * @param {number} recordingId
 * @param {number} tutorId - Must be the tutor who uploaded it
 */
export const deleteTutorRecording = async (recordingId, tutorId) => {
  const res = await fetch(`${BASE_URL}/recording/${recordingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tutorId }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// ADMIN MODERATION
// Pages: AdminModeration.tsx
// ══════════════════════════════════════════════════════════

// ── CREATE (Flag) ─────────────────────────────────────────

/**
 * Admin flags a recording → status = "Flagged".
 * Immediately hidden from the student view.
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} flagReason - Reason for flagging
 */
export const flagRecording = async (recordingId, adminId, flagReason) => {
  const res = await fetch(`${BASE_URL}/recording/${recordingId}/flag`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, flagReason }),
  });
  return handleResponse(res);
};

// ── READ (Admin Reports) ──────────────────────────────────

/**
 * Get all moderation reports/flags for admin review.
 * @param {Object} [filters] - { status?: "pending"|"reviewing"|"resolved"|"dismissed" }
 */
export const getModerationReports = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/recording/moderation/reports?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get a single moderation report by ID.
 * @param {string} reportId
 */
export const getModerationReportById = async (reportId) => {
  const res = await fetch(`${BASE_URL}/recording/moderation/reports/${reportId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── UPDATE (Restore / Change Moderation Status) ───────────

/**
 * Admin restores a flagged recording → status back to "Active".
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} [notes] - Admin notes on restoration
 */
export const restoreRecording = async (recordingId, adminId, notes = "") => {
  const res = await fetch(`${BASE_URL}/recording/${recordingId}/restore`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, notes }),
  });
  return handleResponse(res);
};

/**
 * Update the status of a moderation report.
 * @param {string} reportId
 * @param {number} adminId
 * @param {"reviewing" | "resolved" | "dismissed"} status
 * @param {string} [notes]
 */
export const updateModerationReportStatus = async (reportId, adminId, status, notes = "") => {
  const res = await fetch(`${BASE_URL}/recording/moderation/reports/${reportId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, status, notes }),
  });
  return handleResponse(res);
};

/**
 * Admin permanently hard-deletes a recording from the server and DB.
 * Must log a moderation reason — required field.
 * @param {number} recordingId
 * @param {number} adminId
 * @param {string} reason - Required moderation reason
 */
export const adminHardDeleteRecording = async (recordingId, adminId, reason) => {
  const res = await fetch(`${BASE_URL}/recording/${recordingId}/hard-delete`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, reason }),
  });
  return handleResponse(res);
};

// ── NOTE ─────────────────────────────────────────────────
// Auto-delete (recordings older than 30 days) is handled by a
// scheduled background job on the backend server — NOT a front-end API call.
// The backend also sends a notification to the student before deletion.
