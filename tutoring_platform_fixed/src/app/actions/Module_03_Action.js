/**
 * Module_03_Action.js — Action Layer
 * Module 3: Real-time Chat & Resource Sharing (Member 3)
 * Pages: Chat.tsx, FileUpload.tsx, MaterialsLibrary.tsx, SessionNotes.tsx,
 *        AdminAnalytics.tsx (report downloads)
 *
 * Validation Rules Enforced Here:
 *   Messages   : required, not whitespace, max 2000 chars
 *   In-session edit  : 5-min window (403 from backend if expired)
 *   Out-session edit : 30-min window (403 from backend if expired)
 *   File type  : PDF, DOCX, JPG, PNG only (no executables)
 *   File size  : max 20 MB
 *   File name  : display name max 100 chars
 *   Session note topicsCovered : required, min 10 chars
 *   Session note edit  : tutor only, within 24 hours of session end
 *   Session note delete: Admin ONLY (with logged reason)
 *   Admin-delete reason: always required
 */

import {
  // File resource
  getFileResourcesByBooking,
  uploadFileResource,
  renameFileResource,
  deleteFileResource,
  // In-session message
  getInSessionMessages,
  sendInSessionMessage,
  editInSessionMessage,
  deleteInSessionMessage,
  // Out-session message
  getOutSessionMessages,
  sendOutSessionMessage,
  editOutSessionMessage,
  deleteOutSessionMessage,
  adminDeleteOutSessionMessage,
  markOutSessionMessagesRead,
  // Session note
  getSessionNote,
  submitSessionNote,
  editSessionNote,
  adminDeleteSessionNote,
  downloadSessionNotesReport,
  // Admin reports
  getAdminStudentsReport,
  getAdminTutorsReport,
  getAdminInSessionReport,
  getAdminOutSessionReport,
  getAdminResourcesReport,
  getAdminSessionNotesReport,
  downloadStudentsReportPdf,
  downloadTutorsReportPdf,
  downloadSessionNotesPdf,
} from "../services/Module_03_API";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_MSG_CHARS   = 2000;
const MAX_FILE_MB     = 20;
const MAX_FILE_BYTES  = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

const validateMessage = (text) => {
  if (!text || !text.trim()) return "Message cannot be empty.";
  if (text.trim().length > MAX_MSG_CHARS)
    return `Message must not exceed ${MAX_MSG_CHARS} characters.`;
  return null;
};

const validateFile = (file) => {
  if (!file) return "No file selected.";
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext))
    return "Only PDF, DOCX, JPG, and PNG files are allowed.";
  if (file.size > MAX_FILE_BYTES)
    return `File size must not exceed ${MAX_FILE_MB} MB.`;
  return null;
};

const triggerPdfDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ══════════════════════════════════════════════════════════
//  FILE RESOURCE ACTIONS
//  Endpoint base: /api/fileresource
// ══════════════════════════════════════════════════════════

/**
 * getFilesForBookingAction
 * GET /fileresource/{bookingId}
 * Load all uploaded files for a booking (used on FileUpload & MaterialsLibrary pages).
 *
 * @param {number} bookingId
 * @returns {{ success: boolean, files?: Array, error?: string }}
 */
export const getFilesForBookingAction = async (bookingId) => {
  try {
    const data = await getFileResourcesByBooking(bookingId);
    return { success: true, files: data.files || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * uploadFileAction
 * POST /fileresource/upload  (form-data: file + bookingId)
 * Validates file type (PDF/DOCX/JPG/PNG) and max size (20 MB).
 *
 * @param {number} bookingId
 * @param {File}   file
 * @returns {{ success: boolean, file?: Object, error?: string }}
 */
export const uploadFileAction = async (bookingId, file) => {
  const fileErr = validateFile(file);
  if (fileErr) return { success: false, error: fileErr };

  if (!bookingId) return { success: false, error: "Booking ID is required." };

  try {
    const response = await uploadFileResource(bookingId, file);
    return { success: true, file: response.file || response };
  } catch (err) {
    return { success: false, error: err.message || "Upload failed." };
  }
};

/**
 * renameFileAction
 * PUT /fileresource/rename
 * Rename the display name of an uploaded file.
 * Only the uploader can rename; max 100 chars.
 *
 * @param {number} fileId
 * @param {string} fileName  - New display name
 * @returns {{ success: boolean, error?: string }}
 */
export const renameFileAction = async (fileId, fileName) => {
  if (!fileName?.trim())
    return { success: false, error: "File name is required." };
  if (fileName.trim().length > 100)
    return { success: false, error: "File name must not exceed 100 characters." };

  try {
    await renameFileResource(fileId, fileName.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * deleteFileAction
 * DELETE /fileresource/{id}
 * Soft-delete an uploaded file (uploader only).
 *
 * @param {number} id  - File resource ID
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteFileAction = async (id) => {
  try {
    await deleteFileResource(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
//  IN-SESSION MESSAGE ACTIONS
//  Endpoint base: /api/insessionmessage
// ══════════════════════════════════════════════════════════

/**
 * getInSessionMessagesAction
 * GET /insessionmessage/{bookingId}
 * Load all non-deleted messages for an active session.
 *
 * @param {number} bookingId
 * @returns {{ success: boolean, messages?: Array, error?: string }}
 */
export const getInSessionMessagesAction = async (bookingId) => {
  try {
    const data = await getInSessionMessages(bookingId);
    return { success: true, messages: data.messages || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * sendInSessionMessageAction
 * POST /insessionmessage/send
 * Send a message in a live session. Must link to a confirmed bookingId.
 * Text: required, not whitespace only, max 2000 chars.
 *
 * @param {number} bookingId
 * @param {number} receiverId
 * @param {string} messageText
 * @returns {{ success: boolean, message?: Object, error?: string }}
 */
export const sendInSessionMessageAction = async (bookingId, receiverId, messageText) => {
  const err = validateMessage(messageText);
  if (err) return { success: false, error: err };

  try {
    const response = await sendInSessionMessage(bookingId, receiverId, messageText.trim());
    return { success: true, message: response.message || response };
  } catch (err) {
    return { success: false, error: err.message || "Failed to send message." };
  }
};

/**
 * editInSessionMessageAction
 * PUT /insessionmessage/edit  →  body: { messageId, messageText }
 * Only the sender can edit. Backend enforces a 5-minute window.
 *
 * @param {number} messageId
 * @param {string} messageText  - Updated text, max 2000 chars
 * @returns {{ success: boolean, error?: string }}
 */
export const editInSessionMessageAction = async (messageId, messageText) => {
  const err = validateMessage(messageText);
  if (err) return { success: false, error: err };

  try {
    await editInSessionMessage(messageId, messageText.trim());
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message?.includes("403")
        ? "Edit window expired — in-session messages can only be edited within 5 minutes of sending."
        : err.message,
    };
  }
};

/**
 * deleteInSessionMessageAction
 * DELETE /insessionmessage/{id}
 * Soft-delete a message (sender only).
 *
 * @param {number} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteInSessionMessageAction = async (id) => {
  try {
    await deleteInSessionMessage(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
//  OUT-SESSION MESSAGE ACTIONS
//  Endpoint base: /api/outsessionmessage
// ══════════════════════════════════════════════════════════

/**
 * getOutSessionMessagesAction
 * GET /outsessionmessage/{bookingId}
 * Load the general chat thread for a booking.
 *
 * @param {number} bookingId
 * @returns {{ success: boolean, messages?: Array, error?: string }}
 */
export const getOutSessionMessagesAction = async (bookingId) => {
  try {
    const data = await getOutSessionMessages(bookingId);
    return { success: true, messages: data.messages || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * sendOutSessionMessageAction
 * POST /outsessionmessage/send  →  body: { bookingId, receiverId, messageText }
 * Text: required, not whitespace only, max 2000 chars.
 *
 * @param {number} bookingId
 * @param {number} receiverId
 * @param {string} messageText
 * @returns {{ success: boolean, message?: Object, error?: string }}
 */
export const sendOutSessionMessageAction = async (bookingId, receiverId, messageText) => {
  const err = validateMessage(messageText);
  if (err) return { success: false, error: err };

  try {
    const response = await sendOutSessionMessage(bookingId, receiverId, messageText.trim());
    return { success: true, message: response.message || response };
  } catch (err) {
    return { success: false, error: err.message || "Failed to send message." };
  }
};

/**
 * editOutSessionMessageAction
 * PUT /outsessionmessage/edit  →  body: { outMessageId, messageText }
 * Sender only. Backend enforces a 30-minute edit window.
 *
 * @param {number} outMessageId
 * @param {string} messageText
 * @returns {{ success: boolean, error?: string }}
 */
export const editOutSessionMessageAction = async (outMessageId, messageText) => {
  const err = validateMessage(messageText);
  if (err) return { success: false, error: err };

  try {
    await editOutSessionMessage(outMessageId, messageText.trim());
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message?.includes("403")
        ? "Edit window expired — messages can only be edited within 30 minutes of sending."
        : err.message,
    };
  }
};

/**
 * deleteOutSessionMessageAction
 * DELETE /outsessionmessage/{id}
 * Sender soft-deletes their own message (no time restriction).
 *
 * @param {number} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteOutSessionMessageAction = async (id) => {
  try {
    await deleteOutSessionMessage(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * adminDeleteOutSessionMessageAction
 * PUT /outsessionmessage/admin-delete  →  body: { outMessageId, adminDeleteReason }
 * Admin soft-deletes any out-session message. Reason is mandatory and logged in DB.
 *
 * @param {number} outMessageId
 * @param {string} adminDeleteReason  - Required
 * @returns {{ success: boolean, error?: string }}
 */
export const adminDeleteOutSessionMessageAction = async (outMessageId, adminDeleteReason) => {
  if (!adminDeleteReason?.trim())
    return { success: false, error: "A reason is required when admin-deleting a message." };

  try {
    await adminDeleteOutSessionMessage(outMessageId, adminDeleteReason.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * markOutSessionMessagesReadAction
 * PUT /outsessionmessage/mark-read/{bookingId}
 * Mark all unread messages in a booking chat as read.
 * Called when a user opens the conversation thread.
 *
 * @param {number} bookingId
 * @returns {{ success: boolean, error?: string }}
 */
export const markOutSessionMessagesReadAction = async (bookingId) => {
  try {
    await markOutSessionMessagesRead(bookingId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
//  SESSION NOTE ACTIONS
//  Endpoint base: /api/sessionnote
// ══════════════════════════════════════════════════════════

/**
 * getSessionNoteAction
 * GET /sessionnote/{bookingId}
 * Load the session note for a booking (Student or Tutor view).
 *
 * @param {number} bookingId
 * @returns {{ success: boolean, note?: Object | null, error?: string }}
 */
export const getSessionNoteAction = async (bookingId) => {
  try {
    const note = await getSessionNote(bookingId);
    return { success: true, note };
  } catch (err) {
    if (err.message?.includes("404")) return { success: true, note: null }; // none yet
    return { success: false, error: err.message };
  }
};

/**
 * submitSessionNoteAction
 * POST /sessionnote/submit  →  body: { bookingId, topicsCovered, homework, nextSteps }
 * Only the Tutor of that session can create a note.
 *
 * Validation:
 *   topicsCovered : required, min 10 chars
 *   homework      : optional
 *   nextSteps     : optional
 *
 * @param {number} bookingId
 * @param {Object} noteData - { topicsCovered, homework, nextSteps }
 * @returns {{ success: boolean, note?: Object, errors?: Object }}
 */
export const submitSessionNoteAction = async (bookingId, noteData) => {
  const errors = {};

  const topics = noteData.topicsCovered?.trim() || "";
  if (!topics)
    errors.topicsCovered = "Topics Covered is required.";
  else if (topics.length < 10)
    errors.topicsCovered = `Must be at least 10 characters (currently ${topics.length}).`;

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await submitSessionNote(
      bookingId,
      topics,
      noteData.homework?.trim() || "",
      noteData.nextSteps?.trim() || ""
    );
    return { success: true, note: response.note || response };
  } catch (err) {
    return { success: false, errors: { general: err.message || "Failed to save note." } };
  }
};

/**
 * editSessionNoteAction
 * PUT /sessionnote/edit  →  body: { noteId, topicsCovered?, homework?, nextSteps? }
 * Tutor only. Backend enforces a 24-hour edit window from session end.
 *
 * @param {number} noteId
 * @param {Object} updateData - { topicsCovered?, homework?, nextSteps? }
 * @returns {{ success: boolean, errors?: Object }}
 */
export const editSessionNoteAction = async (noteId, updateData) => {
  const errors = {};

  if (updateData.topicsCovered !== undefined) {
    const topics = updateData.topicsCovered.trim();
    if (!topics)
      errors.topicsCovered = "Topics Covered is required.";
    else if (topics.length < 10)
      errors.topicsCovered = "Must be at least 10 characters.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    await editSessionNote(noteId, updateData);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      errors: {
        general: err.message?.includes("403")
          ? "Edit window expired — session notes can only be edited within 24 hours of the session."
          : err.message || "Update failed.",
      },
    };
  }
};

/**
 * adminDeleteSessionNoteAction
 * PUT /sessionnote/admin-delete  →  body: { noteId, adminDeleteReason }
 * Admin ONLY. Tutor and Student cannot delete session notes.
 * Reason is mandatory and logged in the database.
 *
 * @param {number} noteId
 * @param {string} adminDeleteReason  - Required
 * @returns {{ success: boolean, error?: string }}
 */
export const adminDeleteSessionNoteAction = async (noteId, adminDeleteReason) => {
  if (!adminDeleteReason?.trim())
    return { success: false, error: "A reason is required when deleting a session note." };

  try {
    await adminDeleteSessionNote(noteId, adminDeleteReason.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Only admins can delete session notes." };
  }
};

/**
 * downloadSessionNotesReportAction
 * GET /sessionnote/report/download  (Admin only, returns PDF)
 * Triggers a browser file download.
 *
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadSessionNotesReportAction = async (filename = "session-notes-report.pdf") => {
  try {
    const blob = await downloadSessionNotesReport();
    triggerPdfDownload(blob, filename);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
//  ADMIN REPORT ACTIONS
//  Endpoint base: /api/admin/reports  (all require Admin JWT)
//  Used by: AdminAnalytics.tsx  (report table + PDF download buttons)
// ══════════════════════════════════════════════════════════

/**
 * getAdminStudentsReportAction
 * GET /admin/reports/students
 * Fetch the full JSON list of all students for the Admin Dashboard table.
 *
 * @returns {{ success: boolean, students?: Array, error?: string }}
 */
export const getAdminStudentsReportAction = async () => {
  try {
    const data = await getAdminStudentsReport();
    return { success: true, students: data.students || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminTutorsReportAction
 * GET /admin/reports/tutors
 * Fetch the full JSON list of all tutors for the Admin Dashboard table.
 *
 * @returns {{ success: boolean, tutors?: Array, error?: string }}
 */
export const getAdminTutorsReportAction = async () => {
  try {
    const data = await getAdminTutorsReport();
    return { success: true, tutors: data.tutors || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminInSessionReportAction
 * GET /admin/reports/insession?bookingId={id}
 * In-session messages — all records, or filtered by bookingId.
 *
 * @param {number|null} [bookingId]  - Optional filter
 * @returns {{ success: boolean, messages?: Array, error?: string }}
 */
export const getAdminInSessionReportAction = async (bookingId = null) => {
  try {
    const data = await getAdminInSessionReport(bookingId);
    return { success: true, messages: data.messages || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminOutSessionReportAction
 * GET /admin/reports/outsession?bookingId={id}
 * Out-session messages — all records, or filtered by bookingId.
 *
 * @param {number|null} [bookingId]
 * @returns {{ success: boolean, messages?: Array, error?: string }}
 */
export const getAdminOutSessionReportAction = async (bookingId = null) => {
  try {
    const data = await getAdminOutSessionReport(bookingId);
    return { success: true, messages: data.messages || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminResourcesReportAction
 * GET /admin/reports/resources?bookingId={id}
 * File resource records — all, or filtered by bookingId.
 *
 * @param {number|null} [bookingId]
 * @returns {{ success: boolean, files?: Array, error?: string }}
 */
export const getAdminResourcesReportAction = async (bookingId = null) => {
  try {
    const data = await getAdminResourcesReport(bookingId);
    return { success: true, files: data.files || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminSessionNotesReportAction
 * GET /admin/reports/sessionnotes
 * Fetch all session notes across the platform as JSON.
 *
 * @returns {{ success: boolean, notes?: Array, error?: string }}
 */
export const getAdminSessionNotesReportAction = async () => {
  try {
    const data = await getAdminSessionNotesReport();
    return { success: true, notes: data.notes || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * downloadStudentsReportPdfAction
 * GET /admin/reports/students/pdf
 * Download the students list as a PDF and trigger a browser download.
 *
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadStudentsReportPdfAction = async (filename = "students-report.pdf") => {
  try {
    const blob = await downloadStudentsReportPdf();
    triggerPdfDownload(blob, filename);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * downloadTutorsReportPdfAction
 * GET /admin/reports/tutors/pdf
 * Download the tutors list as a PDF and trigger a browser download.
 *
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadTutorsReportPdfAction = async (filename = "tutors-report.pdf") => {
  try {
    const blob = await downloadTutorsReportPdf();
    triggerPdfDownload(blob, filename);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * downloadSessionNotesPdfAction
 * GET /admin/reports/sessionnotes/pdf
 * Download all session notes as a PDF and trigger a browser download.
 *
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadSessionNotesPdfAction = async (filename = "session-notes-report.pdf") => {
  try {
    const blob = await downloadSessionNotesPdf();
    triggerPdfDownload(blob, filename);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
