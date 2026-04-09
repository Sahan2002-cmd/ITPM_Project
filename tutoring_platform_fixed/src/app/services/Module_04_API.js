/**
 * Module_04_API.js — Service Layer
 * Module 4: Rating & Analytics Dashboard (Member 4 / Leader)
 * Backend: RatingController.cs, AnalyticsController.cs
 *          → DARating.cs, DAAnalytics.cs
 *          → PLT_RATING_PROC.sql, PLT_ANALYTICS_PROC.sql
 *          Report generation: PdfReportGenerator.cs, ReportController.cs
 *
 * Covers CRUD:
 *   Rating/Review  → Create, Read, Update (1-hr window), Delete (Admin soft-delete)
 *   Analytics      → Read ONLY (no create/edit/delete)
 *
 * Key Validation Rules (from Validation_Notes_By_Member.txt):
 *   - Stars: integer, 1–5, required
 *   - Review text: optional, max 1000 chars
 *   - Rating only allowed after session status = "Completed"
 *   - One rating per session per student (duplicates blocked)
 *   - Cannot rate a Pending or Confirmed session
 *   - Edit window: within 1 hour of submission
 *   - Student CANNOT delete their own rating
 *   - Admin CAN soft-delete any rating (must log reason)
 *   - Analytics: users cannot view another user's personal data
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

// ══════════════════════════════════════════════════════════
// RATING / REVIEW  (SessionReview.tsx)
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Submit a rating for a completed session.
 * Only allowed when booking status = "Completed".
 * One rating per session per student — backend rejects duplicates.
 * @param {Object} ratingData
 * @param {number} ratingData.sessionId      - Must be a Completed session
 * @param {number} ratingData.studentId      - The student who attended
 * @param {number} ratingData.tutorId
 * @param {number} ratingData.overallStars   - Integer 1–5
 * @param {number} [ratingData.knowledgeStars]
 * @param {number} [ratingData.communicationStars]
 * @param {number} [ratingData.patienceStars]
 * @param {number} [ratingData.materialsStars]
 * @param {string} [ratingData.reviewText]   - Max 1000 chars
 * @param {string[]} [ratingData.tags]       - e.g. ["Excellent explanations", "On time"]
 * @param {boolean} [ratingData.wouldRecommend]
 */
export const submitRating = async (ratingData) => {
  const res = await fetch(`${BASE_URL}/rating`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ratingData),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get a single rating by its ID.
 * @param {number} ratingId
 */
export const getRatingById = async (ratingId) => {
  const res = await fetch(`${BASE_URL}/rating/${ratingId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get the rating for a specific session (if submitted).
 * @param {number} sessionId
 */
export const getRatingBySession = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/rating/session/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all ratings submitted for a specific tutor.
 * Used on TutorProfile.tsx to show the reviews list.
 * Returns only non-soft-deleted, public ratings.
 * @param {number} tutorId
 * @param {number} [page]   - Pagination
 * @param {number} [limit]  - Ratings per page (default 10)
 */
export const getRatingsByTutor = async (tutorId, page = 1, limit = 10) => {
  const res = await fetch(
    `${BASE_URL}/rating/tutor/${tutorId}?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * Get all ratings submitted by a specific student.
 * @param {number} studentId
 */
export const getRatingsByStudent = async (studentId) => {
  const res = await fetch(`${BASE_URL}/rating/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get all ratings on the platform (including soft-deleted).
 * @param {Object} filters - { tutorId?, studentId?, minStars?, maxStars?, isDeleted? }
 */
export const getAllRatingsAdmin = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/rating/admin/all?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── UPDATE ────────────────────────────────────────────────

/**
 * Edit a submitted rating.
 * Only allowed within 1 hour of submission — backend enforces and returns 403 if expired.
 * Only the submitting student can edit their own rating.
 * @param {number} ratingId
 * @param {number} studentId - For authorization
 * @param {Object} updateData
 * @param {number} [updateData.overallStars]
 * @param {number} [updateData.knowledgeStars]
 * @param {number} [updateData.communicationStars]
 * @param {number} [updateData.patienceStars]
 * @param {number} [updateData.materialsStars]
 * @param {string} [updateData.reviewText]       - Max 1000 chars
 * @param {string[]} [updateData.tags]
 * @param {boolean} [updateData.wouldRecommend]
 */
export const updateRating = async (ratingId, studentId, updateData) => {
  const res = await fetch(`${BASE_URL}/rating/${ratingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, ...updateData }),
  });
  return handleResponse(res);
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Admin soft-delete a rating (hidden from public, kept in DB).
 * Students CANNOT delete their own ratings.
 * Admin must provide a logged reason for the deletion.
 * @param {number} ratingId
 * @param {number} adminId  - For authorization (must be Admin role)
 * @param {string} reason   - Required — reason is logged in the DB
 */
export const adminDeleteRating = async (ratingId, adminId, reason) => {
  const res = await fetch(`${BASE_URL}/rating/${ratingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminId, reason }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD  (AdminAnalytics.tsx, StudentDashboard.tsx, TutorDashboard.tsx)
// READ ONLY — no create, update, or delete
// No user can view another user's personal analytics data
// ══════════════════════════════════════════════════════════

/**
 * Get analytics data for a specific tutor (their own data only).
 * Returns: sessions completed, earnings, average rating, top subjects, monthly trends.
 * @param {number} tutorId
 * @param {Object} [filters] - { startDate?, endDate? }
 */
export const getTutorAnalytics = async (tutorId, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/analytics/tutor/${tutorId}?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get analytics data for a specific student (their own data only).
 * Returns: sessions attended, money spent, most-booked tutors, subjects breakdown.
 * @param {number} studentId
 * @param {Object} [filters] - { startDate?, endDate? }
 */
export const getStudentAnalytics = async (studentId, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/analytics/student/${studentId}?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get platform-wide analytics.
 * Returns: all users, all sessions, revenue, user growth, subject distribution.
 * @param {Object} [filters] - { startDate?, endDate?, month? }
 */
export const getAdminAnalytics = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/analytics/admin?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Download an analytics report as a PDF.
 * Generated by PdfReportGenerator.cs via ReportController.cs.
 * @param {"tutor" | "student" | "admin"} reportType
 * @param {number} userId - The ID of the user requesting (admin uses own ID)
 * @param {Object} [filters] - { startDate?, endDate? }
 */
export const downloadAnalyticsReport = async (reportType, userId, filters = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({ ...filters, userId, reportType }).toString();
  const res = await fetch(`${BASE_URL}/report/analytics?${params}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`Failed to download report: HTTP ${res.status}`);
  return await res.blob();
};
