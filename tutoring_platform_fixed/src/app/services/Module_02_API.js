/**
 * Module_02_API.js — Service Layer
 * Module 2: Session Booking & Scheduling (Member 2)
 * Backend: BookingController.cs, NotificationController.cs
 *          → DABooking.cs, DANotification.cs
 *          → PLT_BOOKING_PROC.sql, PLT_NOTIFICATION_PROC.sql
 *
 * Covers CRUD:
 *   Booking      → Create, Read, Update (status), no Delete (records kept permanently)
 *   Notification → Create (system-generated), Read
 *
 * Key Validation Rules (from Validation_Notes_By_Member.txt):
 *   - Subject must be one of the tutor's listed subjects
 *   - Slot must have status = "Free" before booking
 *   - No past-date bookings
 *   - No overlapping bookings for same student + tutor
 *   - Status on create: always "Pending"
 *   - Tutor accept → "Confirmed"; slot → "Booked"
 *   - Tutor decline → "Declined"; slot → "Free"
 *   - Cancel allowed only if > 2 hours before session start
 *   - On cancel: booking → "Cancelled"; slot → "Free"
 *   - Booking records are NEVER hard-deleted
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
  if (!res.ok) throw new Error(data.Message || data.message || `HTTP ${res.status}`);
  return data;
};

// ══════════════════════════════════════════════════════════
// BOOKING
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Create a new session booking request.
 * Status is always set to "Pending" by the backend.
 * @param {Object} bookingData
 * @param {number} bookingData.studentId
 * @param {number} bookingData.tutorId
 * @param {number} bookingData.availabilitySlotId  - Must have status = "Free"
 * @param {string} bookingData.subject             - Must be one of tutor's subjects
 * @param {"individual" | "group"} bookingData.sessionType
 * @param {string} [bookingData.notes]
 * @param {Array<{name: string, studentId: string}>} [bookingData.groupMembers]
 */
export const createBooking = async (bookingData) => {
  const res = await fetch(`${BASE_URL}/booking/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(bookingData),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get a booking by its ID.
 * @param {number} bookingId
 */
export const getBookingById = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/booking/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all bookings for a specific student (their booking history).
 * Used on StudentHistory and StudentDashboard pages.
 * @param {number} studentId
 * @param {"Pending" | "Confirmed" | "Completed" | "Cancelled" | "Declined"} [status]
 */
export const getBookingsByStudent = async (studentId, status = "") => {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE_URL}/booking/student/${studentId}${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all bookings assigned to a specific tutor.
 * Used on TutorDashboard page.
 * @param {number} tutorId
 * @param {"Pending" | "Confirmed" | "Completed" | "Cancelled" | "Declined"} [status]
 */
export const getBookingsByTutor = async (tutorId, status = "") => {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE_URL}/booking/tutor/${tutorId}${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get all bookings across the platform.
 * @param {Object} filters - { status?, startDate?, endDate? }
 */
export const getAllBookings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/booking/all?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── UPDATE ────────────────────────────────────────────────

/**
 * Tutor accepts a pending booking.
 * Booking → "Confirmed"; availability slot → "Booked".
 * Only the assigned tutor can call this.
 * @param {number} bookingId
 * @param {number} tutorId - For authorization check
 */
export const acceptBooking = async (bookingId, tutorId) => {
  const res = await fetch(`${BASE_URL}/booking/accept/${bookingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tutorId }),
  });
  return handleResponse(res);
};

/**
 * Tutor declines a pending booking.
 * Booking → "Declined"; slot remains "Free".
 * Only the assigned tutor can call this.
 * @param {number} bookingId
 * @param {number} tutorId - For authorization check
 * @param {string} [reason]
 */
export const declineBooking = async (bookingId, tutorId, reason = "") => {
  const res = await fetch(`${BASE_URL}/booking/decline/${bookingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tutorId, reason }),
  });
  return handleResponse(res);
};

/**
 * Cancel a booking.
 * Allowed only if cancellation is > 2 hours before session start.
 * On success: booking → "Cancelled"; slot → "Free".
 * @param {number} bookingId
 * @param {number} requesterId - Student or Tutor user ID
 */
export const cancelBooking = async (bookingId, requesterId) => {
  const res = await fetch(`${BASE_URL}/booking/cancel/${bookingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ requesterId }),
  });
  return handleResponse(res);
};

/**
 * Mark a booking as Completed (after session ends).
 * This enables rating submission for that session.
 * Typically triggered by the backend scheduler, but can be called manually by Admin.
 * @param {number} bookingId
 */
export const completeBooking = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/booking/complete/${bookingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── NOTE ─────────────────────────────────────────────────
// Booking records are NEVER hard-deleted.
// They are always kept for history and reporting purposes.

// ══════════════════════════════════════════════════════════
// NOTIFICATION
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Create a new notification for a user.
 * In most cases, notifications are created by the backend automatically
 * (e.g., on booking confirmation, cancellation, rating received).
 * This endpoint is used when front-end needs to trigger a manual notification.
 * @param {Object} notificationData
 * @param {number} notificationData.userId
 * @param {string} notificationData.type  - e.g. "BookingConfirmed", "SessionCancelled"
 * @param {string} notificationData.message
 * @param {number} [notificationData.relatedBookingId]
 */
export const createNotification = async (notificationData) => {
  const res = await fetch(`${BASE_URL}/notification`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(notificationData),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get all notifications for a user.
 * @param {number} userId
 * @param {boolean} [unreadOnly] - If true, returns only unread notifications
 */
export const getNotificationsByUser = async (userId, unreadOnly = false) => {
  const params = unreadOnly ? "?unread=true" : "";
  const res = await fetch(`${BASE_URL}/notification/user/${userId}${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get unread notification count for a user.
 * Used for the notification badge in the nav.
 * @param {number} userId
 */
export const getUnreadNotificationCount = async (userId) => {
  const res = await fetch(`${BASE_URL}/notification/user/${userId}/unread-count`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Mark a single notification as read.
 * @param {number} notificationId
 */
export const markNotificationRead = async (notificationId) => {
  const res = await fetch(`${BASE_URL}/notification/read/${notificationId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Mark all notifications for a user as read.
 * @param {number} userId
 */
export const markAllNotificationsRead = async (userId) => {
  const res = await fetch(`${BASE_URL}/notification/user/${userId}/read-all`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
