/**
 * Module_01_API.js — Service Layer
 * Module 1: Tutor Profile & Availability (Member 1)
 * Backend: TutorProfileController.cs, AvailabilityController.cs
 *          → DATutorProfile.cs, DAAvailability.cs
 *          → PLT_TUTOR_PROFILE_PROC.sql, PLT_AVAILABILITY_PROC.sql
 *
 * Covers CRUD:
 *   TutorProfile   → Create, Read, Update, Delete (soft)
 *   Availability   → Create, Read, Update, Delete (hard)
 *
 * Key Validation Rules (from Validation_Notes_By_Member.txt):
 *   - Email must end with @sliit.lk
 *   - Student ID must match SLIIT format (IT23XXXXXX)
 *   - Hourly Rate: Rs. 100 – Rs. 5,000
 *   - Bio: max 500 characters
 *   - Status on register: always "Pending Verification" (never "Active")
 *   - Availability: no past dates, end > start, min 30-min slot, no overlaps
 *   - TutorProfile DELETE: soft only (status = "Inactive")
 *   - Availability DELETE: hard delete allowed
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
// TUTOR PROFILE
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Register a new Tutor profile.
 * Status is always set to "Pending Verification" by the backend — never "Active".
 * @param {Object} profileData
 * @param {string} profileData.fullName       - Required, min 3 chars, letters & spaces only
 * @param {string} profileData.studentId      - SLIIT format: IT23XXXXXX
 * @param {string} profileData.email          - Must end with @sliit.lk
 * @param {string[]} profileData.subjects     - At least 1 subject required
 * @param {string} profileData.bio            - Max 500 characters
 * @param {number} profileData.hourlyRate     - Rs. 100 – Rs. 5,000
 * @param {string} profileData.degree
 * @param {string} profileData.institution
 * @param {string} profileData.graduationYear
 * @param {string[]} profileData.languages
 */
export const createTutorProfile = async (profileData) => {
  const res = await fetch(`${BASE_URL}/tutorprofile`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get a single tutor profile by tutor user ID.
 * @param {number} tutorId
 */
export const getTutorProfileById = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/${tutorId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all active (verified) tutor profiles for the Browse Tutors page.
 * Only returns profiles with status = "Active".
 */
export const getAllTutors = async () => {
  const res = await fetch(`${BASE_URL}/tutorprofile/all`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get tutor profiles filtered by subject.
 * Used on the BrowseTutors and SubjectSelection pages.
 * @param {string} subject
 */
export const getTutorsBySubject = async (subject) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/subject/${encodeURIComponent(subject)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Get all tutor profiles regardless of status
 * (includes Pending, Active, Inactive).
 */
export const getAllTutorsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/tutorprofile/admin/all`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get all subjects offered by a specific tutor.
 * Reads from TutorSubjectModel linked to the tutor.
 * @param {number} tutorId
 */
export const getTutorSubjects = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/${tutorId}/subjects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── UPDATE ────────────────────────────────────────────────

/**
 * Update an existing tutor profile.
 * Hourly rate changes must still fall within Rs. 100 – Rs. 5,000.
 * Bio must not exceed 500 characters.
 * @param {number} tutorId
 * @param {Object} updateData - Partial fields: bio, hourlyRate, subjects, etc.
 */
export const updateTutorProfile = async (tutorId, updateData) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/${tutorId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res);
};

/**
 * Admin-only: Update the verification status of a tutor profile.
 * @param {number} tutorId
 * @param {"Active" | "Pending Verification" | "Suspended"} status
 */
export const updateTutorStatus = async (tutorId, status) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/${tutorId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Soft-delete a tutor profile (sets status = "Inactive").
 * Hard delete is NOT allowed — past session records must remain intact.
 * @param {number} tutorId
 */
export const deleteTutorProfile = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/tutorprofile/${tutorId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// AVAILABILITY SLOTS
// ══════════════════════════════════════════════════════════

// ── CREATE ────────────────────────────────────────────────

/**
 * Create one or more availability slots for a tutor.
 * Rules enforced: no past dates, end > start, min 30-min gap, no overlaps.
 * Default status on creation is "Free".
 * @param {number} tutorId
 * @param {Array<{date: string, startTime: string, endTime: string, day: string}>} slots
 */
export const createAvailabilitySlots = async (tutorId, slots) => {
  const res = await fetch(`${BASE_URL}/availability`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tutorId, slots }),
  });
  return handleResponse(res);
};

// ── READ ──────────────────────────────────────────────────

/**
 * Get all availability slots for a specific tutor.
 * Returns both "Free" and "Booked" slots.
 * @param {number} tutorId
 */
export const getAvailabilityByTutor = async (tutorId) => {
  const res = await fetch(`${BASE_URL}/availability/tutor/${tutorId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get only the free (bookable) slots for a tutor.
 * Used on the BookingForm calendar.
 * @param {number} tutorId
 * @param {string} [month]  - Optional filter: "2026-04"
 */
export const getFreeSlotsByTutor = async (tutorId, month = "") => {
  const params = month ? `?month=${month}` : "";
  const res = await fetch(`${BASE_URL}/availability/tutor/${tutorId}/free${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * Get a single availability slot by its ID.
 * @param {number} slotId
 */
export const getAvailabilitySlotById = async (slotId) => {
  const res = await fetch(`${BASE_URL}/availability/${slotId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ── UPDATE ────────────────────────────────────────────────

/**
 * Update an existing availability slot (time change, etc.).
 * Overlap validation still applies on update.
 * @param {number} slotId
 * @param {Object} slotData - { startTime, endTime, date }
 */
export const updateAvailabilitySlot = async (slotId, slotData) => {
  const res = await fetch(`${BASE_URL}/availability/${slotId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(slotData),
  });
  return handleResponse(res);
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Hard-delete an availability slot.
 * Only "Free" slots may be deleted — "Booked" slots cannot be removed.
 * @param {number} slotId
 */
export const deleteAvailabilitySlot = async (slotId) => {
  const res = await fetch(`${BASE_URL}/availability/${slotId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
