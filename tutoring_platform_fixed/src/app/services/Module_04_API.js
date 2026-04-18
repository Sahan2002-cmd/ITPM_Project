/**
 * Module_04_API.js — Service Layer
 * Module 4: Rating & Analytics Dashboard
 * Backend: RatingController.cs   → api/rating
 *          AnalyticsController.cs → api/analytics
 */

const BASE_URL = "http://localhost:55708/api";

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
// RATING  —  RatingController  (api/rating)
// ══════════════════════════════════════════════════════════

/** POST /api/rating/create — Student only.
 *  Body: { BookingId, TutorProfileId, TutorId, StudentId, Stars (1-5), Feedback } */
export const submitRating = async (body) => {
  const res = await fetch(`${BASE_URL}/rating/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

/** POST /api/rating/evaluate — Tutor only.
 *  Body: { BookingId, TutorProfileId, TutorId, StudentId,
 *          Attendance, Participation, Understanding, Behavior, AssignmentCompletion (each 1-5) } */
export const submitEvaluation = async (body) => {
  const res = await fetch(`${BASE_URL}/rating/evaluate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

/** GET /api/rating/tutor/{tutorProfileId} — Returns Approved ratings only. */
export const getRatingsByTutor = async (tutorProfileId) => {
  const res = await fetch(`${BASE_URL}/rating/tutor/${tutorProfileId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/rating/student/{studentId} */
export const getRatingsByStudent = async (studentId) => {
  const res = await fetch(`${BASE_URL}/rating/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/rating/admin/pending — Admin only. Returns ratings with FeedbackStatus = "Pending Approval". */
export const getPendingFeedback = async () => {
  const res = await fetch(`${BASE_URL}/rating/admin/pending`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/rating/admin/all — Admin only. Returns ALL ratings regardless of status. */
export const getAllRatings = async () => {
  const res = await fetch(`${BASE_URL}/rating/admin/all`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** PUT /api/rating/admin/moderate/{ratingId}?status=Approved|Rejected — Admin only. */
export const moderateFeedback = async (ratingId, status) => {
  const res = await fetch(
    `${BASE_URL}/rating/admin/moderate/${ratingId}?status=${encodeURIComponent(status)}`,
    { method: "PUT", headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/** PUT /api/rating/update/{ratingId} — Student only. Body: { Stars, Feedback }
 *  Only allowed while FeedbackStatus is "Pending Approval". */
export const updateRating = async (ratingId, body) => {
  const res = await fetch(`${BASE_URL}/rating/update/${ratingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

/** GET /api/rating/evaluation/student/{studentId} */
export const getEvaluationsByStudent = async (studentId) => {
  const res = await fetch(`${BASE_URL}/rating/evaluation/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/rating/evaluation/tutor/{tutorId} */
export const getEvaluationsByTutor = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/rating/evaluation/tutor/${tutorId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// ANALYTICS — AnalyticsController  (api/analytics)
// All routes Admin only — read only.
// ══════════════════════════════════════════════════════════

/** GET /api/analytics/summary
 *  Returns: { TotalCompletedSessions, TotalRevenue, TotalActiveStudents, TotalActiveTutors } */
export const getAnalyticsSummary = async () => {
  const res = await fetch(`${BASE_URL}/analytics/summary`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/analytics/subjects
 *  Returns: [{ Subject, BookingCount }] — subject popularity by completed booking count. */
export const getSubjectPopularity = async () => {
  const res = await fetch(`${BASE_URL}/analytics/subjects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/analytics/top-tutors?topN=
 *  Returns: [{ TutorProfileId, TutorId, FullName, AverageRating, TotalRatings, CompletedSessions }] */
export const getTopRatedTutors = async (topN = 10) => {
  const res = await fetch(`${BASE_URL}/analytics/top-tutors?topN=${topN}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/** GET /api/analytics/engagement
 *  Returns: [{ StudentId, FullName, TotalSessions, AverageHoursPerSession, TotalHours }] */
export const getStudentEngagement = async () => {
  const res = await fetch(`${BASE_URL}/analytics/engagement`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
