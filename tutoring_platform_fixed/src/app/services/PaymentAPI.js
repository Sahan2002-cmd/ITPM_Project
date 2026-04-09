/**
 * PaymentAPI.js — Service Layer
 * Module: Payment Management (Shared)
 * Backend: PaymentController.cs → DAPayment.cs → PLT_PAYMENT_PROC.sql
 * Business Logic: StripePaymentHelper.cs, PdfReportGenerator.cs
 *
 * Covers CRUD:
 *   CREATE  → Initiate a payment for a booking
 *   READ    → Get payment by ID, by user, all payments (Admin)
 *   UPDATE  → Update payment status (confirmed / failed / refunded)
 *   DELETE  → Payments are never hard or soft deleted (audit trail)
 */

const BASE_URL = "http://localhost:5000/api";

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

// ── CREATE ────────────────────────────────────────────────────────────────────

/**
 * Initiate a payment for a confirmed booking via Stripe.
 * Returns a Stripe PaymentIntent client secret for the frontend to complete payment.
 * @param {Object} paymentData
 * @param {number} paymentData.bookingId
 * @param {number} paymentData.studentId
 * @param {number} paymentData.amount        - Amount in LKR cents
 * @param {string} paymentData.currency      - e.g. "LKR"
 * @param {string} paymentData.paymentMethod - e.g. "card"
 */
export const initiatePayment = async (paymentData) => {
  const res = await fetch(`${BASE_URL}/payment/initiate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData),
  });
  return handleResponse(res);
};

/**
 * Confirm a payment after Stripe processing is complete.
 * @param {Object} confirmData
 * @param {string} confirmData.stripePaymentIntentId
 * @param {number} confirmData.bookingId
 */
export const confirmPayment = async (confirmData) => {
  const res = await fetch(`${BASE_URL}/payment/confirm`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(confirmData),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────────────────────────

/**
 * Get a single payment record by payment ID.
 * @param {number} paymentId
 */
export const getPaymentById = async (paymentId) => {
  const res = await fetch(`${BASE_URL}/payment/${paymentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get the payment linked to a specific booking.
 * @param {number} bookingId
 */
export const getPaymentByBooking = async (bookingId) => {
  const res = await fetch(`${BASE_URL}/payment/booking/${bookingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all payments made by a specific student.
 * @param {number} studentId
 */
export const getPaymentsByStudent = async (studentId) => {
  const res = await fetch(`${BASE_URL}/payment/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all payouts received by a specific tutor.
 * @param {number} tutorId
 */
export const getPaymentsByTutor = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/payment/tutor/${tutorId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get all payment records platform-wide.
 * @param {Object} filters - { startDate?, endDate?, status? }
 */
export const getAllPayments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/payment/all?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Download a payment receipt PDF for a specific payment.
 * Uses PdfReportGenerator.cs on the backend.
 * @param {number} paymentId
 */
export const downloadReceipt = async (paymentId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/payment/${paymentId}/receipt`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`Failed to download receipt: HTTP ${res.status}`);
  const blob = await res.blob();
  return blob;
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

/**
 * Update the status of a payment (e.g., mark as Refunded).
 * Only Admin can change status manually.
 * @param {number} paymentId
 * @param {"Completed" | "Failed" | "Refunded" | "Pending"} status
 * @param {string} [reason] - Required for Refunded status
 */
export const updatePaymentStatus = async (paymentId, status, reason = "") => {
  const res = await fetch(`${BASE_URL}/payment/${paymentId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, reason }),
  });
  return handleResponse(res);
};

/**
 * Process a refund for a cancelled booking.
 * Triggered automatically when a booking is cancelled within refund policy window.
 * @param {number} paymentId
 * @param {number} bookingId
 * @param {string} reason
 */
export const processRefund = async (paymentId, bookingId, reason) => {
  const res = await fetch(`${BASE_URL}/payment/${paymentId}/refund`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookingId, reason }),
  });
  return handleResponse(res);
};

// ── NOTE ─────────────────────────────────────────────────────────────────────
// Payment records are NEVER deleted (hard or soft).
// They form the permanent financial audit trail for the platform.
