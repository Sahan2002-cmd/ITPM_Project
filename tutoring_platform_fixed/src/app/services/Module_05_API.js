/**
 * Module_05_API.js — Service Layer
 * Module 5: Session Recording, Meetings & Moderation (Member 5)
 * Backend: Node.js Express (port 4000)
 *          Routes: /api/recordings, /api/meetings, /api/moderation/reports
 *
 * Covers CRUD:
 *   Recording   → Create (upload), Read, Delete (tutor own / admin hard)
 *   Meeting     → Create, Read, Update (status / isLive)
 *   Moderation  → Create (flag), Read (admin all), Update (flag/restore/hard-delete)
 */

const BASE_URL = "http://localhost:4000/api";

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return {
    "Content-Type": "application/json",
    "x-user-role": user.role || "student",
    "x-user-name": user.name || "Guest User",
    "x-user-email": user.email || "",
    "x-user-avatar": user.avatar || "",
  };
};

const getAuthHeadersNoContentType = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return {
    "x-user-role": user.role || "student",
    "x-user-name": user.name || "Guest User",
    "x-user-email": user.email || "",
    "x-user-avatar": user.avatar || "",
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.Message || data.message || `HTTP ${res.status}`);
  return data.data !== undefined ? data.data : data;
};

// ══════════════════════════════════════════════════════════
// RECORDING UPLOAD & MANAGEMENT
// Pages: UploadRecording.tsx, RecordingsList.tsx, RecordingPlayback.tsx
// Backend routes: /api/recordings
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Upload a session recording.
 * POST /api/recordings  (multipart/form-data)
 */
export const uploadRecording = async (sessionId, tutorId, file, title, subject, description = "", visibility = "enrolled", tags = []) => {
  const formData = new FormData();
  formData.append("video", file);
  if (sessionId) formData.append("sessionId", sessionId);
  if (tutorId) formData.append("tutorId", tutorId);
  formData.append("title", title);
  formData.append("subject", subject);
  formData.append("description", description);
  formData.append("visibility", visibility);
  tags.forEach((tag) => formData.append("tags[]", tag));

  const res = await fetch(`${BASE_URL}/recordings`, {
    method: "POST",
    headers: getAuthHeadersNoContentType(),
    body: formData,
  });
  return handleResponse(res);
};

export const createRecordingFromMedia = uploadRecording;

// ── READ ──────────────────────────────────────────────────

/**
 * Get a single recording by its ID.
 * GET /api/recordings/:id
 */
export const getRecordingById = async (recordingId) => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getRecordingBySession = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/recordings/session/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getRecordingStreamUrl = async (recordingId) => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}/stream`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * List all recordings (with optional query filters).
 * GET /api/recordings?search=&subject=&tutorEmail=
 */
export const listRecordings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${BASE_URL}/recordings?${params}` : `${BASE_URL}/recordings`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
};

/**
 * Get all recordings accessible to a specific student.
 */
export const getRecordingsByStudent = async (studentId, subject = "", search = "") => {
  const params = new URLSearchParams({ subject, search }).toString();
  const res = await fetch(`${BASE_URL}/recordings?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all recordings uploaded by a tutor.
 */
export const getRecordingsByTutor = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/recordings?tutorEmail=${encodeURIComponent(tutorId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get ALL recordings across the platform.
 */
export const getAllRecordingsAdmin = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/recordings?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Delete a recording.
 * DELETE /api/recordings/:id
 */
export const deleteTutorRecording = async (recordingId, tutorId) => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tutorId }),
  });
  return handleResponse(res);
};

// ── VIEWS ────────────────────────────────────────────────

/**
 * Increment recording views.
 * PATCH /api/recordings/:id/views
 */
export const incrementRecordingViews = async (recordingId, increment = 1) => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}/views`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ increment }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// MEETINGS
// Pages: TutorMeetings.tsx, StudentMeetings.tsx
// Backend routes: /api/meetings
// ══════════════════════════════════════════════════════════

/**
 * List all meetings (optionally filtered by status).
 * GET /api/meetings?status=pending
 *
 * @param {Object} [filters] - { status?: "pending"|"confirmed"|"cancelled"|"completed" }
 * @returns {Promise<Meeting[]>}
 */
export const listMeetings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/meetings?${qs}` : `${BASE_URL}/meetings`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
};

/**
 * Get a single meeting by ID.
 * GET /api/meetings/:id
 *
 * @param {string} meetingId
 * @returns {Promise<Meeting>}
 */
export const getMeetingById = async (meetingId) => {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getMeeting = getMeetingById;

/**
 * Create a new meeting.
 * POST /api/meetings
 *
 * @param {Object} payload
 * @param {string} payload.studentName
 * @param {string} payload.studentEmail
 * @param {boolean} [payload.isForAllStudents]
 * @param {string} payload.subject
 * @param {string} payload.scheduledFor - ISO date string
 * @param {number} [payload.durationMinutes]
 * @param {string} [payload.meetingLink]
 * @param {string} [payload.notes]
 * @returns {Promise<Meeting>}
 */
export const createMeeting = async (payload) => {
  const res = await fetch(`${BASE_URL}/meetings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * Update a meeting's status and/or fields.
 * PATCH /api/meetings/:id
 *
 * @param {string} meetingId
 * @param {string} status - "pending"|"confirmed"|"cancelled"|"completed"
 * @param {string} [notes]
 * @param {string} [meetingLink]
 * @param {boolean} [isLive]
 * @returns {Promise<Meeting>}
 */
export const updateMeetingStatus = async (meetingId, status, notes, meetingLink, isLive) => {
  const body = { status };
  if (notes !== undefined) body.notes = notes;
  if (meetingLink !== undefined) body.meetingLink = meetingLink;
  if (isLive !== undefined) body.isLive = isLive;

  const res = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// ADMIN MODERATION
// Pages: AdminModeration.tsx
// Backend routes: /api/moderation/reports
// ══════════════════════════════════════════════════════════

/**
 * Get all moderation reports/flags for admin review.
 * GET /api/moderation/reports?status=pending
 */
export const getModerationReports = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${BASE_URL}/moderation/reports?${params}` : `${BASE_URL}/moderation/reports`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
};

/**
 * Create a new moderation report (flag).
 * POST /api/moderation/reports
 */
export const flagRecording = async (recordingId, adminId, flagReason) => {
  const res = await fetch(`${BASE_URL}/moderation/reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      recordingId,
      reporter: adminId,
      type: "content",
      description: flagReason,
    }),
  });
  return handleResponse(res);
};

/**
 * Update a moderation report status.
 * PATCH /api/moderation/reports/:id
 */
export const updateModerationReportStatus = async (reportId, adminId, status, notes = "") => {
  const res = await fetch(`${BASE_URL}/moderation/reports/${reportId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, status, adminNote: notes }),
  });
  return handleResponse(res);
};

/**
 * Admin permanently hard-deletes a recording.
 * DELETE /api/recordings/:id
 */
export const adminHardDeleteRecording = async (recordingId, adminId, reason) => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, reason }),
  });
  return handleResponse(res);
};

export const getModerationReportById = async (reportId) => {
  const res = await fetch(`${BASE_URL}/moderation/reports/${reportId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const restoreRecording = async (recordingId, adminId, notes = "") => {
  const res = await fetch(`${BASE_URL}/recordings/${recordingId}/restore`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, adminNote: notes }),
  });
  return handleResponse(res);
};

// ── NOTE ─────────────────────────────────────────────────
// Auto-delete (recordings older than 30 days) is handled by a
// scheduled background job on the backend server — NOT a front-end API call.
