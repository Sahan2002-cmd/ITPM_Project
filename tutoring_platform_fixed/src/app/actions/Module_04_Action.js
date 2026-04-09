/**
 * Module_04_Action.js — Action Layer
 * Module 4: Rating & Analytics Dashboard (Member 4 / Leader)
 * Pages: SessionReview.tsx, AdminAnalytics.tsx, StudentDashboard.tsx, TutorDashboard.tsx
 *
 * Validation Rules Enforced:
 *   - Stars: integer 1–5, required for overall rating
 *   - Review text: optional, max 1000 chars
 *   - Rating only after session status = "Completed"
 *   - One rating per session per student (duplicate blocked by backend)
 *   - Cannot rate a Pending or Confirmed session
 *   - Edit window: within 1 hour of submission
 *   - Student CANNOT delete their own rating
 *   - Admin CAN soft-delete with a logged reason
 *   - Analytics: READ ONLY — no create/edit/delete
 *   - No user can view another user's personal analytics
 */

import {
  submitRating,
  getRatingById,
  getRatingBySession,
  getRatingsByTutor,
  getRatingsByStudent,
  getAllRatingsAdmin,
  updateRating,
  adminDeleteRating,
  getTutorAnalytics,
  getStudentAnalytics,
  getAdminAnalytics,
  downloadAnalyticsReport,
} from "../services/Module_04_API";

// ── Validation Helpers ────────────────────────────────────────────────────────

const validateStarRating = (stars) => {
  if (stars === null || stars === undefined || stars === 0)
    return "A star rating is required.";
  if (!Number.isInteger(stars) || stars < 1 || stars > 5)
    return "Rating must be a whole number between 1 and 5.";
  return null;
};

// ── RATING ACTIONS ────────────────────────────────────────────────────────────

/**
 * submitRatingAction
 * Submit a rating after a completed session.
 * Validates stars (1–5 int), review text length, session completion status.
 * @param {Object} ratingData
 * @param {number} ratingData.sessionId
 * @param {number} ratingData.studentId
 * @param {number} ratingData.tutorId
 * @param {Object} ratingData.ratings      - { overall, knowledge, communication, patience, materials }
 * @param {string} [ratingData.reviewText] - Max 1000 chars
 * @param {string[]} [ratingData.tags]
 * @param {boolean} [ratingData.wouldRecommend]
 * @returns {{ success: boolean, rating?: Object, errors?: Object }}
 */
export const submitRatingAction = async (ratingData) => {
  const errors = {};

  const overallErr = validateStarRating(ratingData.ratings?.overall);
  if (overallErr) errors.overall = overallErr;

  if (ratingData.reviewText && ratingData.reviewText.length > 1000)
    errors.reviewText = "Review text must not exceed 1,000 characters.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  // Map multi-criteria ratings to API payload
  const payload = {
    sessionId: ratingData.sessionId,
    studentId: ratingData.studentId,
    tutorId: ratingData.tutorId,
    overallStars: ratingData.ratings.overall,
    knowledgeStars: ratingData.ratings.knowledge || null,
    communicationStars: ratingData.ratings.communication || null,
    patienceStars: ratingData.ratings.patience || null,
    materialsStars: ratingData.ratings.materials || null,
    reviewText: ratingData.reviewText?.trim() || null,
    tags: ratingData.tags || [],
    wouldRecommend: ratingData.wouldRecommend ?? null,
  };

  try {
    const response = await submitRating(payload);
    return { success: true, rating: response.rating };
  } catch (err) {
    // Handle specific error cases
    if (err.message?.toLowerCase().includes("already submitted"))
      return { success: false, errors: { general: "You have already submitted a rating for this session." } };
    if (err.message?.toLowerCase().includes("not completed"))
      return { success: false, errors: { general: "You can only rate a session after it has been completed." } };
    return { success: false, errors: { general: err.message || "Failed to submit rating." } };
  }
};

/**
 * getSessionRatingAction
 * Get the existing rating for a session (to check if already submitted).
 * @param {number} sessionId
 * @returns {{ success: boolean, rating?: Object | null, error?: string }}
 */
export const getSessionRatingAction = async (sessionId) => {
  try {
    const rating = await getRatingBySession(sessionId);
    return { success: true, rating };
  } catch (err) {
    // 404 means no rating yet — that's fine
    if (err.message?.includes("404")) return { success: true, rating: null };
    return { success: false, error: err.message };
  }
};

/**
 * getTutorRatingsAction
 * Get all public ratings for a tutor profile page.
 * @param {number} tutorId
 * @param {number} [page]
 * @param {number} [limit]
 * @returns {{ success: boolean, ratings?: Array, averageRating?: number, totalCount?: number, error?: string }}
 */
export const getTutorRatingsAction = async (tutorId, page = 1, limit = 10) => {
  try {
    const data = await getRatingsByTutor(tutorId, page, limit);
    const ratings = data.ratings || data;
    const averageRating = ratings.length
      ? (ratings.reduce((sum, r) => sum + r.overallStars, 0) / ratings.length).toFixed(1)
      : "—";
    return { success: true, ratings, averageRating, totalCount: data.totalCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getStudentRatingsAction
 * Get all ratings submitted by a student.
 * @param {number} studentId
 * @returns {{ success: boolean, ratings?: Array, error?: string }}
 */
export const getStudentRatingsAction = async (studentId) => {
  try {
    const data = await getRatingsByStudent(studentId);
    return { success: true, ratings: data.ratings || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * editRatingAction
 * Edit a submitted rating within the 1-hour window.
 * Only the submitting student can edit.
 * @param {number} ratingId
 * @param {number} studentId
 * @param {Object} updateData - { ratings?: {...}, reviewText?, tags?, wouldRecommend? }
 * @returns {{ success: boolean, errors?: Object }}
 */
export const editRatingAction = async (ratingId, studentId, updateData) => {
  const errors = {};

  if (updateData.ratings?.overall !== undefined) {
    const starErr = validateStarRating(updateData.ratings.overall);
    if (starErr) errors.overall = starErr;
  }

  if (updateData.reviewText && updateData.reviewText.length > 1000)
    errors.reviewText = "Review must not exceed 1,000 characters.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const payload = {
    ...(updateData.ratings?.overall !== undefined && { overallStars: updateData.ratings.overall }),
    ...(updateData.ratings?.knowledge !== undefined && { knowledgeStars: updateData.ratings.knowledge }),
    ...(updateData.ratings?.communication !== undefined && { communicationStars: updateData.ratings.communication }),
    ...(updateData.ratings?.patience !== undefined && { patienceStars: updateData.ratings.patience }),
    ...(updateData.ratings?.materials !== undefined && { materialsStars: updateData.ratings.materials }),
    reviewText: updateData.reviewText?.trim() ?? undefined,
    tags: updateData.tags ?? undefined,
    wouldRecommend: updateData.wouldRecommend ?? undefined,
  };

  try {
    await updateRating(ratingId, studentId, payload);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      errors: {
        general: err.message?.includes("403")
          ? "Edit window has expired. Ratings can only be edited within 1 hour of submission."
          : err.message,
      },
    };
  }
};

/**
 * adminDeleteRatingAction
 * Admin soft-deletes a rating with a mandatory logged reason.
 * Students CANNOT delete ratings — this is admin-only.
 * @param {number} ratingId
 * @param {number} adminId
 * @param {string} reason  - Required
 * @returns {{ success: boolean, error?: string }}
 */
export const adminDeleteRatingAction = async (ratingId, adminId, reason) => {
  if (!reason?.trim())
    return { success: false, error: "A reason must be provided for deleting a rating." };

  try {
    await adminDeleteRating(ratingId, adminId, reason.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── ANALYTICS ACTIONS (READ ONLY) ─────────────────────────────────────────────

/**
 * getTutorAnalyticsAction
 * Fetch analytics for a tutor (their own data only).
 * Shows: earnings, sessions, avg rating, top subjects.
 * @param {number} tutorId
 * @param {Object} [filters] - { startDate?, endDate? }
 * @returns {{ success: boolean, analytics?: Object, error?: string }}
 */
export const getTutorAnalyticsAction = async (tutorId, filters = {}) => {
  try {
    const analytics = await getTutorAnalytics(tutorId, filters);
    return { success: true, analytics };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getStudentAnalyticsAction
 * Fetch analytics for a student (their own data only).
 * Shows: sessions attended, money spent, most-booked tutors.
 * @param {number} studentId
 * @param {Object} [filters]
 * @returns {{ success: boolean, analytics?: Object, error?: string }}
 */
export const getStudentAnalyticsAction = async (studentId, filters = {}) => {
  try {
    const analytics = await getStudentAnalytics(studentId, filters);
    return { success: true, analytics };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAdminAnalyticsAction
 * Fetch platform-wide analytics (admin only).
 * Shows: all users, sessions, revenue, user growth, subject distribution.
 * Used on AdminAnalytics.tsx.
 * @param {Object} [filters] - { startDate?, endDate?, month? }
 * @returns {{ success: boolean, analytics?: Object, error?: string }}
 */
export const getAdminAnalyticsAction = async (filters = {}) => {
  try {
    const analytics = await getAdminAnalytics(filters);
    return { success: true, analytics };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * downloadAnalyticsReportAction
 * Download a PDF analytics report and trigger browser download.
 * @param {"tutor" | "student" | "admin"} reportType
 * @param {number} userId
 * @param {Object} [filters]
 * @param {string} [filename]
 * @returns {{ success: boolean, error?: string }}
 */
export const downloadAnalyticsReportAction = async (reportType, userId, filters = {}, filename = "analytics-report.pdf") => {
  try {
    const blob = await downloadAnalyticsReport(reportType, userId, filters);
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
