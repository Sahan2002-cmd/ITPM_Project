/**
 * Module_01_Action.js — Action Layer
 * Module 1: Tutor Profile & Availability (Member 1)
 * Pages: TutorRegister.tsx, TutorProfile.tsx, AvailabilityCalendar.tsx,
 *        BrowseTutors.tsx, SubjectSelection.tsx
 *
 * Validation Rules Enforced:
 *   - Full Name: required, min 3 chars, letters & spaces only
 *   - Student ID: SLIIT format IT23XXXXXX
 *   - Email: must end with @sliit.lk
 *   - Subjects: at least 1 required
 *   - Bio: max 500 chars
 *   - Hourly Rate: Rs. 100 – Rs. 5,000 (numeric)
 *   - Status on create: always "Pending Verification" (enforced by backend)
 *   - Availability date: cannot be in the past
 *   - End time must be after start time, minimum 30-minute slot
 *   - Overlap check: new slot must not overlap with existing slots for same tutor
 *   - TutorProfile DELETE: soft only → status = "Inactive"
 *   - Availability DELETE: hard delete allowed
 */

import {
  createTutorProfile,
  getTutorProfileById,
  getAllTutors,
  getTutorsBySubject,
  getAllTutorsAdmin,
  getTutorSubjects,
  updateTutorProfile,
  updateTutorStatus,
  deleteTutorProfile,
  createAvailabilitySlots,
  getAvailabilityByTutor,
  getFreeSlotsByTutor,
  getAvailabilitySlotById,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
} from "../services/Module_01_API";

// ── Validation Helpers ────────────────────────────────────────────────────────

const STUDENT_ID_REGEX = /^IT\d{2}[A-Z0-9]{6}$/i;
const NAME_REGEX = /^[a-zA-Z\s]+$/;

const toMinutes = (timeStr) => {
  const [rawTime, period] = timeStr.split(" ");
  let [h, m] = rawTime.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

// ── TUTOR PROFILE ACTIONS ─────────────────────────────────────────────────────

/**
 * registerTutorAction
 * Validate and submit a new tutor profile registration.
 * Status will always be "Pending Verification" — never "Active" on self-register.
 * @param {Object} formData - from TutorRegister.tsx multi-step form
 * @returns {{ success: boolean, profile?: Object, errors?: Object }}
 */
export const registerTutorAction = async (formData) => {
  const errors = {};

  // Step 0 – Personal Info
  const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
  if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
  else if (formData.firstName.trim().length < 2) errors.firstName = "Must be at least 2 characters.";
  if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";
  else if (formData.lastName.trim().length < 2) errors.lastName = "Must be at least 2 characters.";
  if (!NAME_REGEX.test(fullName)) errors.fullName = "Name must contain letters and spaces only.";

  if (!formData.email?.trim()) errors.email = "Email is required.";
  else if (!formData.email.endsWith("@sliit.lk"))
    errors.email = "Tutor email must end with @sliit.lk.";

  if (!formData.phone?.trim()) errors.phone = "Phone number is required.";
  else if (!/^\+?[\d\s\-().]{7,20}$/.test(formData.phone.trim()))
    errors.phone = "Enter a valid phone number.";

  // Step 1 – Education & Expertise
  if (!formData.degree?.trim()) errors.degree = "Degree/Qualification is required.";
  if (!formData.institution?.trim()) errors.institution = "Institution name is required.";

  if (!formData.graduationYear?.trim()) {
    errors.graduationYear = "Graduation year is required.";
  } else {
    const yr = Number(formData.graduationYear);
    if (!Number.isInteger(yr) || yr < 1950 || yr > new Date().getFullYear() + 5)
      errors.graduationYear = `Enter a valid year (1950 – ${new Date().getFullYear() + 5}).`;
  }

  if (!formData.hourlyRate?.toString().trim()) {
    errors.hourlyRate = "Hourly rate is required.";
  } else {
    const rate = Number(formData.hourlyRate);
    if (isNaN(rate) || rate < 100 || rate > 5000)
      errors.hourlyRate = "Hourly rate must be between Rs. 100 and Rs. 5,000.";
  }

  // Step 2 – Profile & Bio
  const bioLen = formData.bio?.trim().length || 0;
  if (bioLen < 50) errors.bio = `Bio must be at least 50 characters (currently ${bioLen}).`;
  else if (bioLen > 500) errors.bio = "Bio must not exceed 500 characters.";

  if (!formData.languages || formData.languages.length === 0)
    errors.languages = "Select at least one language.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await createTutorProfile({ ...formData, fullName });
    return { success: true, profile: response.profile };
  } catch (err) {
    return { success: false, errors: { general: err.message || "Registration failed." } };
  }
};

/**
 * getTutorProfileAction
 * Fetch a tutor's profile (for TutorProfile.tsx display page).
 * @param {number} tutorId
 * @returns {{ success: boolean, profile?: Object, error?: string }}
 */
export const getTutorProfileAction = async (tutorId) => {
  try {
    const profile = await getTutorProfileById(tutorId);
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * browseTutorsAction
 * Get all verified tutors for the BrowseTutors page.
 * Optionally filter by subject.
 * @param {string} [subject]  - Optional subject filter
 * @returns {{ success: boolean, tutors?: Array, error?: string }}
 */
export const browseTutorsAction = async (subject = "") => {
  try {
    const tutors = subject
      ? await getTutorsBySubject(subject)
      : await getAllTutors();
    return { success: true, tutors };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAllTutorsAdminAction
 * Admin: Get all tutors regardless of status.
 * @returns {{ success: boolean, tutors?: Array, error?: string }}
 */
export const getAllTutorsAdminAction = async () => {
  try {
    const tutors = await getAllTutorsAdmin();
    return { success: true, tutors };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * updateTutorProfileAction
 * Update tutor profile fields. Validates hourly rate and bio limits.
 * @param {number} tutorId
 * @param {Object} updateData
 * @returns {{ success: boolean, profile?: Object, errors?: Object }}
 */
export const updateTutorProfileAction = async (tutorId, updateData) => {
  const errors = {};

  if (updateData.hourlyRate !== undefined) {
    const rate = Number(updateData.hourlyRate);
    if (isNaN(rate) || rate < 100 || rate > 5000)
      errors.hourlyRate = "Hourly rate must be between Rs. 100 and Rs. 5,000.";
  }

  if (updateData.bio !== undefined) {
    const bioLen = updateData.bio.trim().length;
    if (bioLen > 500) errors.bio = "Bio must not exceed 500 characters.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await updateTutorProfile(tutorId, updateData);
    return { success: true, profile: response.profile };
  } catch (err) {
    return { success: false, errors: { general: err.message } };
  }
};

/**
 * adminUpdateTutorStatusAction
 * Admin changes tutor verification status.
 * @param {number} tutorId
 * @param {"Active" | "Pending Verification" | "Suspended"} status
 * @returns {{ success: boolean, error?: string }}
 */
export const adminUpdateTutorStatusAction = async (tutorId, status) => {
  try {
    await updateTutorStatus(tutorId, status);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * deleteTutorProfileAction
 * Soft-delete a tutor profile. Status → "Inactive".
 * Hard delete is never permitted.
 * @param {number} tutorId
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteTutorProfileAction = async (tutorId) => {
  try {
    await deleteTutorProfile(tutorId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── AVAILABILITY ACTIONS ──────────────────────────────────────────────────────

/**
 * saveAvailabilityAction
 * Save/update a tutor's weekly availability schedule from AvailabilityCalendar.tsx.
 * Validates: no past dates, end > start, min 30-min slot, no overlaps.
 * @param {number} tutorId
 * @param {Object} schedule - { Monday: [{start, end}], Tuesday: [...], ... }
 * @param {Object} enabled  - { Monday: true, Tuesday: false, ... }
 * @returns {{ success: boolean, errors?: Object }}
 */
export const saveAvailabilityAction = async (tutorId, schedule, enabled) => {
  const errors = {};
  const slotsToSubmit = [];
  const now = new Date();

  Object.entries(schedule).forEach(([day, slots]) => {
    if (!enabled[day] || !slots?.length) return;

    slots.forEach((slot, idx) => {
      const key = `${day}-${idx}`;
      const startMin = toMinutes(slot.start);
      const endMin = toMinutes(slot.end);

      if (startMin >= endMin) {
        errors[key] = "Start time must be before end time.";
        return;
      }

      if (endMin - startMin < 30) {
        errors[key] = "Minimum slot duration is 30 minutes.";
        return;
      }

      // Overlap check within same day
      for (let j = 0; j < slots.length; j++) {
        if (j === idx) continue;
        const otherStart = toMinutes(slots[j].start);
        const otherEnd = toMinutes(slots[j].end);
        if (startMin < otherEnd && endMin > otherStart) {
          errors[key] = `Overlaps with slot ${j + 1} (${slots[j].start} – ${slots[j].end}).`;
          break;
        }
      }

      slotsToSubmit.push({ day, startTime: slot.start, endTime: slot.end });
    });
  });

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    await createAvailabilitySlots(tutorId, slotsToSubmit);
    return { success: true };
  } catch (err) {
    return { success: false, errors: { general: err.message } };
  }
};

/**
 * getAvailabilityAction
 * Fetch all slots for a tutor (used on AvailabilityCalendar & BookingForm).
 * @param {number} tutorId
 * @param {boolean} [freeOnly] - If true, returns only "Free" slots
 * @param {string} [month]     - Optional month filter "2026-04"
 * @returns {{ success: boolean, slots?: Array, error?: string }}
 */
export const getAvailabilityAction = async (tutorId, freeOnly = false, month = "") => {
  try {
    const slots = freeOnly
      ? await getFreeSlotsByTutor(tutorId, month)
      : await getAvailabilityByTutor(tutorId);
    return { success: true, slots };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * updateAvailabilitySlotAction
 * Update a single availability slot time.
 * @param {number} slotId
 * @param {Object} slotData - { startTime, endTime, date }
 * @returns {{ success: boolean, error?: string }}
 */
export const updateAvailabilitySlotAction = async (slotId, slotData) => {
  const startMin = toMinutes(slotData.startTime);
  const endMin = toMinutes(slotData.endTime);

  if (startMin >= endMin)
    return { success: false, error: "Start time must be before end time." };
  if (endMin - startMin < 30)
    return { success: false, error: "Minimum slot duration is 30 minutes." };

  try {
    await updateAvailabilitySlot(slotId, slotData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * deleteAvailabilitySlotAction
 * Hard-delete an availability slot (only "Free" slots allowed).
 * @param {number} slotId
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteAvailabilitySlotAction = async (slotId) => {
  try {
    await deleteAvailabilitySlot(slotId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
