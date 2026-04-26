/**
 * Module_03_API.js — Service Layer
 * Module 3: Real-time Chat & Resource Sharing (Member 3)
 * Backend: FileResourceController.cs, InSessionMessageController.cs,
 *          OutSessionMessageController.cs, SessionNoteController.cs
 *          → DA files → PLT_*_PROC.sql
 *          Real-time: ChatHub.cs (SignalR)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  FILE RESOURCE  (/api/fileresource)
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET     /fileresource/{bookingId}          Student/Tutor   Get files for booking
 *  POST    /fileresource/upload               Student/Tutor   Upload file (form-data)
 *  PUT     /fileresource/rename               Uploader        Rename a file
 *  DELETE  /fileresource/{id}                 Uploader        Soft delete a file
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  IN-SESSION MESSAGE  (/api/insessionmessage)
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET     /insessionmessage/{bookingId}      Student/Tutor   Get messages for booking
 *  POST    /insessionmessage/send             Student/Tutor   Send a message
 *  PUT     /insessionmessage/edit             Sender          Edit within 5-min window
 *  DELETE  /insessionmessage/{id}             Sender          Soft delete
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  OUT-SESSION MESSAGE  (/api/outsessionmessage)
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET     /outsessionmessage/{bookingId}     Student/Tutor   Get messages for booking
 *  POST    /outsessionmessage/send            Student/Tutor   Send a message
 *  PUT     /outsessionmessage/edit            Sender          Edit within 30-min window
 *  DELETE  /outsessionmessage/{id}            Sender          Soft delete (own messages)
 *  PUT     /outsessionmessage/admin-delete    Admin           Admin soft delete + reason
 *  PUT     /outsessionmessage/mark-read/{bookingId} Student/Tutor Mark all as read
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  SESSION NOTE  (/api/sessionnote)
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET     /sessionnote/{bookingId}           Student/Tutor   Get note for booking
 *  POST    /sessionnote/submit                Tutor           Create session note
 *  PUT     /sessionnote/edit                  Tutor           Edit within 24-hr window
 *  PUT     /sessionnote/admin-delete          Admin           Admin soft delete + reason
 *  GET     /sessionnote/report/download       Admin           Download all notes as PDF
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  ADMIN REPORTS  (/api/admin/reports)        All require Admin JWT
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET     /admin/reports/students            Admin           JSON list of all students
 *  GET     /admin/reports/tutors              Admin           JSON list of all tutors
 *  GET     /admin/reports/insession           Admin           In-session msgs (all or by bookingId)
 *  GET     /admin/reports/outsession          Admin           Out-session msgs (all or by bookingId)
 *  GET     /admin/reports/resources           Admin           File resources (all or by bookingId)
 *  GET     /admin/reports/sessionnotes        Admin           All session notes
 *  GET     /admin/reports/students/pdf        Admin           Students list as PDF download
 *  GET     /admin/reports/tutors/pdf          Admin           Tutors list as PDF download
 *  GET     /admin/reports/sessionnotes/pdf    Admin           Session notes as PDF download
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = "https://localhost:44331/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getAuthHeadersNoContentType = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.Message || data.message || `HTTP ${res.status}`);
  return data;
};

const handleBlobResponse = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.Message || data.message || `HTTP ${res.status}`);
  }
  return res.blob();
};

// ══════════════════════════════════════════════════════════
//  FILE RESOURCE  /api/fileresource
// ══════════════════════════════════════════════════════════

/**
 * GET /fileresource/{bookingId}
 * Get all non-deleted file resources for a booking.
 * Accessible by the Student or Tutor of that booking.
 *
 * @param {number} bookingId
 */
export const getFileResourcesByBooking = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/fileresource/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * POST /fileresource/upload
 * Upload a file resource linked to a booking.
 * Sent as multipart/form-data.
 *
 * Allowed types : PDF, DOCX, JPG, PNG (no executables)
 * Max size      : 20 MB
 * Display name  : max 100 chars
 *
 * Form fields:
 *   file      (binary)  — the actual file
 *   bookingId (text)    — associated booking ID
 *
 * @param {number} bookingId
 * @param {File}   file
 */
export const uploadFileResource = async (bookingId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bookingId", String(bookingId));

  const res = await fetch(`${BASE_URL}/fileresource/upload`, {
    method: "POST",
    headers: getAuthHeadersNoContentType(),
    body: formData,
  });
  return handleResponse(res);
};

/**
 * PUT /fileresource/rename
 * Rename a file's display name.
 * Only the uploader of that file can rename it.
 *
 * Sample body:
 * { "fileId": 12, "fileName": "new_name.pdf" }
 *
 * @param {number} fileId
 * @param {string} fileName  - New display name, max 100 chars
 */
export const renameFileResource = async (fileId, fileName) => {
  const res = await fetch(`${BASE_URL}/fileresource/rename`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ fileId, fileName }),
  });
  return handleResponse(res);
};

/**
 * DELETE /fileresource/{id}
 * Soft-delete a file resource (record kept in DB, hidden in UI).
 * Only the uploader can delete their own files.
 *
 * @param {number} id  - File resource ID
 */
export const deleteFileResource = async (id) => {
  const res = await fetch(`${BASE_URL}/fileresource/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
//  IN-SESSION MESSAGE  /api/insessionmessage
// ══════════════════════════════════════════════════════════

/**
 * GET /insessionmessage/{bookingId}
 * Get all visible (non-deleted) in-session messages for a booking.
 * Messages linked to a confirmed sessionId only.
 *
 * @param {number} bookingId
 */
export const getInSessionMessages = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/insessionmessage/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * POST /insessionmessage/send
 * Send a chat message during an active session.
 * Message must be linked to a valid confirmed bookingId.
 *
 * Validation:
 *   messageText: required, not whitespace only, max 2000 chars
 *
 * Sample body:
 * { "bookingId": 10, "receiverId": 3, "messageText": "Hello!" }
 *
 * @param {number} bookingId
 * @param {number} receiverId
 * @param {string} messageText  - Max 2000 chars
 */
export const sendInSessionMessage = async (bookingId, receiverId, messageText) => {
  const res = await fetch(`${BASE_URL}/insessionmessage/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookingId, receiverId, messageText }),
  });
  return handleResponse(res);
};

/**
 * PUT /insessionmessage/edit
 * Edit an in-session message.
 * Only the original sender can edit.
 * Backend enforces a 5-minute edit window from send time (returns 403 if expired).
 *
 * Sample body:
 * { "messageId": 55, "messageText": "Corrected" }
 *
 * @param {number} messageId
 * @param {string} messageText  - Updated text, max 2000 chars
 */
export const editInSessionMessage = async (messageId, messageText) => {
  const res = await fetch(`${BASE_URL}/insessionmessage/edit`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ messageId, messageText }),
  });
  return handleResponse(res);
};

/**
 * DELETE /insessionmessage/{id}
 * Soft-delete an in-session message (hidden in UI, kept in DB).
 * Only the original sender can delete.
 *
 * @param {number} id  - Message ID
 */
export const deleteInSessionMessage = async (id) => {
  const res = await fetch(`${BASE_URL}/insessionmessage/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
//  OUT-SESSION MESSAGE  /api/outsessionmessage
// ══════════════════════════════════════════════════════════

/**
 * GET /outsessionmessage/{bookingId}
 * Get all out-of-session messages for a booking (general chat thread).
 *
 * @param {number} bookingId
 */
export const getOutSessionMessages = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * POST /outsessionmessage/send
 * Send a general out-of-session message.
 *
 * Validation:
 *   messageText: required, not whitespace only, max 2000 chars
 *
 * Sample body:
 * { "bookingId": 10, "receiverId": 3, "messageText": "Question" }
 *
 * @param {number} bookingId
 * @param {number} receiverId
 * @param {string} messageText
 */
export const sendOutSessionMessage = async (bookingId, receiverId, messageText) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookingId, receiverId, messageText }),
  });
  return handleResponse(res);
};

/**
 * PUT /outsessionmessage/edit
 * Edit an out-session message.
 * Only the sender can edit.
 * Backend enforces a 30-minute edit window (returns 403 if expired).
 *
 * Sample body:
 * { "outMessageId": 77, "messageText": "Edited" }
 *
 * @param {number} outMessageId
 * @param {string} messageText
 */
export const editOutSessionMessage = async (outMessageId, messageText) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/edit`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ outMessageId, messageText }),
  });
  return handleResponse(res);
};

/**
 * DELETE /outsessionmessage/{id}
 * Sender soft-deletes their own out-session message.
 * No time restriction — sender can delete anytime.
 *
 * @param {number} id  - Out-session message ID
 */
export const deleteOutSessionMessage = async (id) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * PUT /outsessionmessage/admin-delete
 * Admin soft-deletes any out-session message with a logged reason.
 *
 * Sample body:
 * { "outMessageId": 77, "adminDeleteReason": "Spam" }
 *
 * @param {number} outMessageId
 * @param {string} adminDeleteReason  - Required, reason is logged in DB
 */
export const adminDeleteOutSessionMessage = async (outMessageId, adminDeleteReason) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/admin-delete`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ outMessageId, adminDeleteReason }),
  });
  return handleResponse(res);
};

/**
 * PUT /outsessionmessage/mark-read/{bookingId}
 * Mark all unread out-session messages for a booking as read.
 * Called when a user opens the chat thread.
 *
 * @param {number} bookingId
 */
export const markOutSessionMessagesRead = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/mark-read/${bookingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
//  SESSION NOTE  /api/sessionnote
// ══════════════════════════════════════════════════════════

/**
 * GET /sessionnote/{bookingId}
 * Get the session note for a specific booking.
 * Accessible by the Student or Tutor of that booking.
 *
 * @param {number} bookingId
 */
export const getSessionNote = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/sessionnote/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * POST /sessionnote/submit
 * Create a session note after a completed session.
 * Only the Tutor of that booking can submit.
 *
 * Validation:
 *   topicsCovered: required, min 10 chars
 *   homework:      optional
 *   nextSteps:     optional
 *
 * Sample body:
 * { "bookingId": 10, "topicsCovered": "Algebra", "homework": "Page 5", "nextSteps": "Test" }
 *
 * @param {number} bookingId
 * @param {string} topicsCovered  - Required, min 10 chars
 * @param {string} [homework]
 * @param {string} [nextSteps]
 */
export const submitSessionNote = async (bookingId, topicsCovered, homework = "", nextSteps = "") => {
  const res = await fetch(`${BASE_URL}/sessionnote/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookingId, topicsCovered, homework, nextSteps }),
  });
  return handleResponse(res);
};

/**
 * PUT /sessionnote/edit
 * Edit an existing session note.
 * Only the Tutor can edit, and only within 24 hours of session end.
 * Backend returns 403 if the 24-hour window has expired.
 *
 * Sample body:
 * { "noteId": 3, "topicsCovered": "Updated" }
 *
 * @param {number} noteId
 * @param {Object} updateData - { topicsCovered?, homework?, nextSteps? }
 */
export const editSessionNote = async (noteId, updateData) => {
  const res = await fetch(`${BASE_URL}/sessionnote/edit`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ noteId, ...updateData }),
  });
  return handleResponse(res);
};

/**
 * PUT /sessionnote/admin-delete
 * Admin soft-deletes a session note with a mandatory logged reason.
 * ONLY Admin can delete session notes — Tutor and Student cannot.
 *
 * Sample body:
 * { "noteId": 3, "adminDeleteReason": "Inappropriate" }
 *
 * @param {number} noteId
 * @param {string} adminDeleteReason  - Required
 */
export const adminDeleteSessionNote = async (noteId, adminDeleteReason) => {
  const res = await fetch(`${BASE_URL}/sessionnote/admin-delete`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ noteId, adminDeleteReason }),
  });
  return handleResponse(res);
};

/**
 * GET /sessionnote/report/download
 * Admin only: Download all session notes as a PDF report.
 * Returns a binary blob — trigger browser download in the action layer.
 */
export const downloadSessionNotesReport = async () => {
  const res = await fetch(`${BASE_URL}/sessionnote/report/download`, {
    headers: getAuthHeadersNoContentType(),
  });
  return handleBlobResponse(res);
};

// ══════════════════════════════════════════════════════════
//  ADMIN REPORTS  /api/admin/reports  (all require Admin JWT)
// ══════════════════════════════════════════════════════════

/**
 * GET /admin/reports/students
 * JSON list of all students on the platform.
 * Used to populate the Admin Dashboard report table.
 */
export const getAdminStudentsReport = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/students`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/tutors
 * JSON list of all tutors on the platform.
 */
export const getAdminTutorsReport = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/tutors`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/insession?bookingId={id}
 * In-session messages — all if no query param, or filtered by bookingId.
 *
 * @param {number|null} [bookingId]  - Optional filter
 */
export const getAdminInSessionReport = async (bookingId = null) => {
  const params = bookingId ? `?bookingId=${bookingId}` : "";
  const res = await fetch(`${BASE_URL}/admin/reports/insession${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/outsession?bookingId={id}
 * Out-session messages — all or filtered by bookingId.
 *
 * @param {number|null} [bookingId]
 */
export const getAdminOutSessionReport = async (bookingId = null) => {
  const params = bookingId ? `?bookingId=${bookingId}` : "";
  const res = await fetch(`${BASE_URL}/admin/reports/outsession${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/resources?bookingId={id}
 * File resources — all or filtered by bookingId.
 *
 * @param {number|null} [bookingId]
 */
export const getAdminResourcesReport = async (bookingId = null) => {
  const params = bookingId ? `?bookingId=${bookingId}` : "";
  const res = await fetch(`${BASE_URL}/admin/reports/resources${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/sessionnotes
 * JSON list of all session notes across the platform.
 */
export const getAdminSessionNotesReport = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/sessionnotes`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /admin/reports/students/pdf
 * Download the students list as a PDF file.
 * Returns a binary blob.
 */
export const downloadStudentsReportPdf = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/students/pdf`, {
    headers: getAuthHeadersNoContentType(),
  });
  return handleBlobResponse(res);
};

/**
 * GET /admin/reports/tutors/pdf
 * Download the tutors list as a PDF file.
 * Returns a binary blob.
 */
export const downloadTutorsReportPdf = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/tutors/pdf`, {
    headers: getAuthHeadersNoContentType(),
  });
  return handleBlobResponse(res);
};

/**
 * GET /admin/reports/sessionnotes/pdf
 * Download all session notes as a PDF file.
 * Returns a binary blob.
 */
export const downloadSessionNotesPdf = async () => {
  const res = await fetch(`${BASE_URL}/admin/reports/sessionnotes/pdf`, {
    headers: getAuthHeadersNoContentType(),
  });
  return handleBlobResponse(res);
};

export const getDirectMessages = async (otherUserId) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/direct/${otherUserId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const sendDirectMessage = async (receiverId, messageText) => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/direct/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId, messageText }),
  });
  return handleResponse(res);
};
export const getConversationPartners = async () => {
  const res = await fetch(`${BASE_URL}/outsessionmessage/conversations`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getUserById = async (userId) => {
  const res = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
export const getBasicUserInfo = async (userId) => {
  const res = await fetch(`${BASE_URL}/user/basic/${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};