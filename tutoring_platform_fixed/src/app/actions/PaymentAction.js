/**
 * PaymentAction.js — Action Layer
 * Module: Payment Management (Shared)
 * Integrates with: StripePaymentHelper.cs (backend), Stripe.js (frontend)
 *
 * Action layer handles: input validation → API call → response processing → error handling.
 */

import {
  initiatePayment,
  confirmPayment,
  getPaymentById,
  getPaymentByBooking,
  getPaymentsByStudent,
  getPaymentsByTutor,
  getAllPayments,
  updatePaymentStatus,
  processRefund,
  downloadReceipt,
} from "../services/PaymentAPI";

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * initiatePaymentAction
 * Start a Stripe payment for a booking.
 * Returns a client secret for Stripe.js to complete the card payment on the frontend.
 * @param {number} bookingId
 * @param {number} studentId
 * @param {number} amount     - Total amount in LKR (e.g. 2000 for Rs. 2,000)
 * @returns {{ success: boolean, clientSecret?: string, paymentId?: number, error?: string }}
 */
export const initiatePaymentAction = async (bookingId, studentId, amount) => {
  try {
    if (!bookingId) return { success: false, error: "Booking ID is required." };
    if (!studentId) return { success: false, error: "Student ID is required." };
    if (!amount || amount <= 0) return { success: false, error: "Invalid payment amount." };

    const response = await initiatePayment({
      bookingId,
      studentId,
      amount: amount * 100,   // Convert to cents for Stripe
      currency: "LKR",
      paymentMethod: "card",
    });

    return {
      success: true,
      clientSecret: response.clientSecret,
      paymentId: response.paymentId,
    };
  } catch (err) {
    return { success: false, error: err.message || "Failed to initiate payment." };
  }
};

/**
 * confirmPaymentAction
 * Called after Stripe.js completes card processing on the client.
 * Tells the backend to mark the payment as Completed.
 * @param {string} stripePaymentIntentId
 * @param {number} bookingId
 * @returns {{ success: boolean, payment?: Object, error?: string }}
 */
export const confirmPaymentAction = async (stripePaymentIntentId, bookingId) => {
  try {
    const response = await confirmPayment({ stripePaymentIntentId, bookingId });
    return { success: true, payment: response.payment };
  } catch (err) {
    return { success: false, error: err.message || "Payment confirmation failed." };
  }
};

/**
 * getPaymentDetailsAction
 * Fetch details of a single payment.
 * @param {number} paymentId
 * @returns {{ success: boolean, payment?: Object, error?: string }}
 */
export const getPaymentDetailsAction = async (paymentId) => {
  try {
    const payment = await getPaymentById(paymentId);
    return { success: true, payment };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getBookingPaymentAction
 * Get payment details for a specific booking (shown on BookingConfirmation.tsx).
 * @param {number} bookingId
 * @returns {{ success: boolean, payment?: Object, error?: string }}
 */
export const getBookingPaymentAction = async (bookingId) => {
  try {
    const payment = await getPaymentByBooking(bookingId);
    return { success: true, payment };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getStudentPaymentsAction
 * Fetch all payment history for a student.
 * Used on StudentDashboard and StudentHistory pages.
 * @param {number} studentId
 * @returns {{ success: boolean, payments?: Array, totalSpent?: number, error?: string }}
 */
export const getStudentPaymentsAction = async (studentId) => {
  try {
    const data = await getPaymentsByStudent(studentId);
    const totalSpent = (data.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return { success: true, payments: data.payments, totalSpent };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getTutorPaymentsAction
 * Fetch all payout history for a tutor.
 * Used on TutorDashboard.
 * @param {number} tutorId
 * @returns {{ success: boolean, payments?: Array, totalEarned?: number, error?: string }}
 */
export const getTutorPaymentsAction = async (tutorId) => {
  try {
    const data = await getPaymentsByTutor(tutorId);
    const totalEarned = (data.payments || []).reduce((sum, p) => sum + (p.tutorPayout || 0), 0);
    return { success: true, payments: data.payments, totalEarned };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAllPaymentsAction
 * Admin-only: Get all payments for the platform.
 * Used on AdminAnalytics.tsx for revenue data.
 * @param {Object} [filters] - { startDate?, endDate?, status? }
 * @returns {{ success: boolean, payments?: Array, totalRevenue?: number, error?: string }}
 */
export const getAllPaymentsAction = async (filters = {}) => {
  try {
    const data = await getAllPayments(filters);
    const totalRevenue = (data.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return { success: true, payments: data.payments, totalRevenue };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * processRefundAction
 * Process a refund when a booking is cancelled.
 * Typically triggered automatically when cancelBookingAction succeeds.
 * @param {number} paymentId
 * @param {number} bookingId
 * @param {string} reason
 * @returns {{ success: boolean, refund?: Object, error?: string }}
 */
export const processRefundAction = async (paymentId, bookingId, reason) => {
  try {
    const response = await processRefund(paymentId, bookingId, reason);
    return { success: true, refund: response.refund };
  } catch (err) {
    return { success: false, error: err.message || "Refund processing failed." };
  }
};

/**
 * adminUpdatePaymentStatusAction
 * Admin manually updates payment status (e.g., override to Refunded).
 * @param {number} paymentId
 * @param {"Completed" | "Failed" | "Refunded" | "Pending"} status
 * @param {string} [reason]
 * @returns {{ success: boolean, error?: string }}
 */
export const adminUpdatePaymentStatusAction = async (paymentId, status, reason = "") => {
  try {
    await updatePaymentStatus(paymentId, status, reason);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * downloadReceiptAction
 * Download a payment receipt PDF and trigger browser download.
 * @param {number} paymentId
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadReceiptAction = async (paymentId, filename = "receipt.pdf") => {
  try {
    const blob = await downloadReceipt(paymentId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
