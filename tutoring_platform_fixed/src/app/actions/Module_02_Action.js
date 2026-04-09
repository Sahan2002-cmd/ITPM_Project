/**
 * Module_02_Action.js — Action Layer
 * Module 2: Session Booking & Scheduling (Member 2)
 * Pages: BookingForm.tsx, BookingConfirmation.tsx, StudentHistory.tsx,
 *        StudentDashboard.tsx, TutorDashboard.tsx
 *
 * Validation Rules Enforced:
 *   - Subject must be from tutor's listed subjects
 *   - Selected slot must have status = "Free"
 *   - Cannot book a past date
 *   - Duplicate booking check: same student + tutor + overlapping time → blocked
 *   - Status on create: always "Pending" (backend enforces)
 *   - Accept/Decline: only assigned tutor
 *   - Cancel: only if > 2 hours before session start
 *   - Booking records are NEVER deleted
 */

import {
  createBooking,
  getBookingById,
  getBookingsByStudent,
  getBookingsByTutor,
  getAllBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
  createNotification,
  getNotificationsByUser,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/Module_02_API";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const isMoreThanTwoHoursBefore = (sessionDateStr, sessionTimeStr) => {
  const sessionDateTime = new Date(`${sessionDateStr} ${sessionTimeStr}`);
  return Date.now() < sessionDateTime.getTime() - TWO_HOURS_MS;
};

// ── BOOKING ACTIONS ───────────────────────────────────────────────────────────

/**
 * createBookingAction
 * Validate and submit a new booking from BookingForm.tsx.
 * @param {Object} bookingData
 * @param {number} bookingData.studentId
 * @param {number} bookingData.tutorId
 * @param {number} bookingData.availabilitySlotId
 * @param {string} bookingData.subject
 * @param {number} bookingData.selectedYear
 * @param {number} bookingData.selectedMonth
 * @param {number} bookingData.selectedDay
 * @param {string} bookingData.selectedTime
 * @param {"individual" | "group"} bookingData.sessionType
 * @param {string} [bookingData.notes]
 * @param {Array} [bookingData.groupMembers]  - Required if sessionType = "group"
 * @returns {{ success: boolean, booking?: Object, errors?: Object }}
 */
export const createBookingAction = async (bookingData) => {
  const errors = {};

  if (!bookingData.availabilitySlotId)
    errors.slot = "Please select a time slot.";

  if (!bookingData.subject?.trim())
    errors.subject = "Subject is required.";

  if (!bookingData.selectedDay)
    errors.date = "Please select a date.";
  else {
    const selectedDate = new Date(
      bookingData.selectedYear,
      bookingData.selectedMonth,
      bookingData.selectedDay
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) errors.date = "Cannot book a session in the past.";
  }

  // Group session validation
  if (bookingData.sessionType === "group") {
    const STUDENT_ID_REGEX = /^ST\d{6}$/i;
    (bookingData.groupMembers || []).forEach((member, idx) => {
      if (!member.name?.trim())
        errors[`member_${idx}_name`] = `Member ${idx + 1}: name is required.`;
      if (!STUDENT_ID_REGEX.test(member.studentId))
        errors[`member_${idx}_id`] = `Member ${idx + 1}: invalid Student ID format (e.g. ST123456).`;
    });
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await createBooking(bookingData);
    return { success: true, booking: response.booking };
  } catch (err) {
    return { success: false, errors: { general: err.message || "Booking failed." } };
  }
};

/**
 * getBookingDetailsAction
 * Fetch a single booking (for BookingConfirmation.tsx).
 * @param {number} bookingId
 * @returns {{ success: boolean, booking?: Object, error?: string }}
 */
export const getBookingDetailsAction = async (bookingId) => {
  try {
    const booking = await getBookingById(bookingId);
    return { success: true, booking };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getStudentBookingsAction
 * Fetch all bookings for a student (StudentHistory.tsx, StudentDashboard.tsx).
 * @param {number} studentId
 * @param {string} [status] - Optional status filter
 * @returns {{ success: boolean, bookings?: Array, error?: string }}
 */
export const getStudentBookingsAction = async (studentId, status = "") => {
  try {
    const data = await getBookingsByStudent(studentId, status);
    return { success: true, bookings: data.bookings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getTutorBookingsAction
 * Fetch all bookings assigned to a tutor (TutorDashboard.tsx).
 * @param {number} tutorId
 * @param {string} [status]
 * @returns {{ success: boolean, bookings?: Array, error?: string }}
 */
export const getTutorBookingsAction = async (tutorId, status = "") => {
  try {
    const data = await getBookingsByTutor(tutorId, status);
    return { success: true, bookings: data.bookings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAllBookingsAdminAction
 * Admin: Get all bookings platform-wide.
 * @param {Object} [filters]
 * @returns {{ success: boolean, bookings?: Array, error?: string }}
 */
export const getAllBookingsAdminAction = async (filters = {}) => {
  try {
    const data = await getAllBookings(filters);
    return { success: true, bookings: data.bookings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * acceptBookingAction
 * Tutor accepts a pending booking.
 * → Booking becomes "Confirmed"; slot becomes "Booked".
 * @param {number} bookingId
 * @param {number} tutorId
 * @returns {{ success: boolean, booking?: Object, error?: string }}
 */
export const acceptBookingAction = async (bookingId, tutorId) => {
  try {
    const response = await acceptBooking(bookingId, tutorId);
    return { success: true, booking: response.booking };
  } catch (err) {
    return { success: false, error: err.message || "Failed to accept booking." };
  }
};

/**
 * declineBookingAction
 * Tutor declines a pending booking.
 * → Booking becomes "Declined"; slot returns to "Free".
 * @param {number} bookingId
 * @param {number} tutorId
 * @param {string} [reason]
 * @returns {{ success: boolean, error?: string }}
 */
export const declineBookingAction = async (bookingId, tutorId, reason = "") => {
  try {
    await declineBooking(bookingId, tutorId, reason);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to decline booking." };
  }
};

/**
 * cancelBookingAction
 * Cancel a booking — only allowed if > 2 hours before session start.
 * → Booking becomes "Cancelled"; slot returns to "Free".
 * @param {number} bookingId
 * @param {number} requesterId
 * @param {string} sessionDate  - "2026-04-10"
 * @param {string} sessionTime  - "10:00 AM"
 * @returns {{ success: boolean, error?: string }}
 */
export const cancelBookingAction = async (bookingId, requesterId, sessionDate, sessionTime) => {
  if (!isMoreThanTwoHoursBefore(sessionDate, sessionTime)) {
    return {
      success: false,
      error: "Cancellation is not allowed within 2 hours of the session start time.",
    };
  }
  try {
    await cancelBooking(bookingId, requesterId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Cancellation failed." };
  }
};

/**
 * completeBookingAction
 * Mark a booking as Completed (admin/system use).
 * Enables rating submission for the session.
 * @param {number} bookingId
 * @returns {{ success: boolean, error?: string }}
 */
export const completeBookingAction = async (bookingId) => {
  try {
    await completeBooking(bookingId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── NOTIFICATION ACTIONS ──────────────────────────────────────────────────────

/**
 * getNotificationsAction
 * Fetch all notifications for a user (for notification panel).
 * @param {number} userId
 * @param {boolean} [unreadOnly]
 * @returns {{ success: boolean, notifications?: Array, error?: string }}
 */
export const getNotificationsAction = async (userId, unreadOnly = false) => {
  try {
    const data = await getNotificationsByUser(userId, unreadOnly);
    return { success: true, notifications: data.notifications || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getUnreadCountAction
 * Get unread notification count for the nav badge.
 * @param {number} userId
 * @returns {{ success: boolean, count?: number, error?: string }}
 */
export const getUnreadCountAction = async (userId) => {
  try {
    const data = await getUnreadNotificationCount(userId);
    return { success: true, count: data.count };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * markNotificationReadAction
 * Mark a single notification as read.
 * @param {number} notificationId
 * @returns {{ success: boolean, error?: string }}
 */
export const markNotificationReadAction = async (notificationId) => {
  try {
    await markNotificationRead(notificationId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * markAllNotificationsReadAction
 * Mark all notifications as read for a user.
 * @param {number} userId
 * @returns {{ success: boolean, error?: string }}
 */
export const markAllNotificationsReadAction = async (userId) => {
  try {
    await markAllNotificationsRead(userId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
