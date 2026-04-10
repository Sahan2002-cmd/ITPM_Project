/**
 * UserAction.js — Action Layer
 * Module: User Account Management (Shared / Week 1 Base)
 * Pages: Auth.tsx, Login.tsx, UserProfile.tsx, AdminAnalytics.tsx
 *
 * Sits between React components and UserAPI.js.
 * Each action: validates input → calls API → processes response → handles errors.
 *
 * Roles  : Student (roleId 3) | Tutor (roleId 2) | Admin (roleId 1)
 * Credentials (dev):
 *   Student : it23837676@my.sliit.lk  /  Student@123
 *   Tutor   : randeer.p@sliit.lk      /  Tutor@123
 *   Admin   : gamage.admin@sliit.lk   /  Admin@123
 */

import {
  registerUser,
  verifyOtp,
  loginUser,
  googleLogin,
  getAllUsers,
  getUserById,
  getAllActiveTutors,
  getMyStudents,
  requestEditOtp,
  editUserProfile,
  deleteUser,
  approveUser,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../services/UserAPI";

// ── Validation helpers ────────────────────────────────────────────────────────

const validatePassword = (password) => {
  if (!password)                               return "Password is required.";
  if (password.length < 8)                     return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))                 return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password))                 return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password))                 return "Must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Must contain at least one special character.";
  return null;
};

const validateSliitEmail = (email, roleId) => {
  if (!email?.trim()) return "Email is required.";
  // roleId 3 = Student → @my.sliit.lk
  if (roleId === 3 && !email.endsWith("@my.sliit.lk"))
    return "Student email must end with @my.sliit.lk.";
  // roleId 2 = Tutor → @sliit.lk (but NOT @my.sliit.lk)
  if (roleId === 2 && !email.endsWith("@sliit.lk"))
    return "Tutor email must end with @sliit.lk.";
  return null;
};

const validatePhone = (phone) => {
  if (!phone?.trim()) return "Phone number is required.";
  if (!/^\+?[\d\s\-().]{7,20}$/.test(phone.trim()))
    return "Enter a valid phone number (e.g. +1234567890).";
  return null;
};

// ── Utility ───────────────────────────────────────────────────────────────────

const triggerPdfDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ══════════════════════════════════════════════════════════
// REGISTRATION FLOW  (two-step: register → verify OTP)
// ══════════════════════════════════════════════════════════

/**
 * registerAction
 * Validate and register a new Student or Tutor.
 * On success the backend sends an OTP to the user's email AND phone.
 * Account stays Pending until verifyOtpAction is called.
 *
 * NOTE: Admin accounts are created from inside the Admin Dashboard only.
 *
 * @param {Object} form
 * @param {string} form.fullName
 * @param {string} form.email
 * @param {string} form.phoneNumber
 * @param {string} form.password
 * @param {string} form.confirmPassword
 * @param {number} form.roleId          - 2 = Tutor, 3 = Student
 * @returns {{ success: boolean, errors?: Object }}
 */
// In registerAction, add validation for center, semester (if student), confirmDetails
export const registerAction = async (form) => {
  const errors = {};
if (!form.fullName?.trim() || form.fullName.trim().length < 3)
    errors.fullName = "Full name must be at least 3 characters.";

  const emailErr = validateSliitEmail(form.email, form.roleId);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validatePhone(form.phoneNumber);
  if (phoneErr) errors.phoneNumber = phoneErr;

  const passErr = validatePassword(form.password);
  if (passErr) errors.password = passErr;

  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";

  if (![2, 3].includes(form.roleId))
    errors.roleId = "Invalid role. Must be Student (3) or Tutor (2).";

  // New validations
  if (!form.center) errors.center = "Please select your SLIIT center.";
  if (!form.confirmDetails) errors.confirmDetails = "You must confirm that the details are correct.";
  if (form.roleId === 3 && !form.semester) errors.semester = "Please select your semester.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    await registerUser({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      roleId: form.roleId,
      center: form.center,
      semester: form.semester,
      confirmDetails: form.confirmDetails,
      profileImage: form.profileImage || null,
    });
    return { success: true };
  } catch (err) {
    return { success: false, errors: { general: err.message || "Registration failed." } };
  }
};

/**
 * verifyOtpAction
 * Submit the OTP received after registration to activate the account.
 *
 * @param {string} email
 * @param {string} otpCode  - 6-digit code
 * @returns {{ success: boolean, errors?: Object }}
 */
export const verifyOtpAction = async (email, otpCode) => {
  const errors = {};

  if (!email?.trim()) errors.email = "Email is required.";
  if (!otpCode?.trim() || otpCode.trim().length !== 6)
    errors.otpCode = "OTP must be a 6-digit code.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    await verifyOtp({ email: email.trim(), otpCode: otpCode.trim() });
    return { success: true };
  } catch (err) {
    return { success: false, errors: { general: err.message || "OTP verification failed." } };
  }
};

// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════

/**
 * loginAction
 * Authenticate with email & password.
 * Stores JWT and user object in localStorage on success.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, user?: Object, role?: string, errors?: Object }}
 */
export const loginAction = async (email, password) => {
  const errors = {};
  if (!email?.trim()) errors.email = "Email is required.";
  if (!password) errors.password = "Password is required.";
  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const userData = await loginUser({ email: email.trim(), password });
    // userData now contains: { token, UserId, FullName, Email, RoleName, RoleId }

    if (userData.token) {
      // Determine roleName from RoleId (uppercase)
      let roleName = "Student";
      if (userData.RoleId === 1) roleName = "Admin";
      else if (userData.RoleId === 2) roleName = "Tutor";

      // Normalize to camelCase for consistent use in the frontend
      const normalizedUser = {
        token: userData.token,
        userId: userData.UserId,
        fullName: userData.FullName,
        email: userData.Email,
        roleId: userData.RoleId,
        roleName: roleName,
      };

      localStorage.setItem("token", normalizedUser.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      return { success: true, user: normalizedUser, role: roleName.toLowerCase() };
    }
    throw new Error("Invalid response from server");
  } catch (err) {
    return {
      success: false,
      errors: { general: err.message || "Login failed. Check your credentials." },
    };
  }
};
   

/**
 * googleLoginAction
 * Sign in via Google OAuth. Pass the ID token from the Google Sign-In SDK.
 * Stores JWT and user on success.
 *
 * @param {string} googleToken  - ID token from Google Sign-In
 * @returns {{ success: boolean, user?: Object, role?: string, error?: string }}
 */
export const googleLoginAction = async (googleToken) => {
  if (!googleToken) return { success: false, error: "Google token is missing." };

  try {
    const response = await googleLogin({ googleToken });

    if (response.token) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("user",  JSON.stringify(response.user));
    }

    return { success: true, user: response.user, role: response.user?.role };
  } catch (err) {
    return { success: false, error: err.message || "Google login failed." };
  }
};

/**
 * logoutAction
 * Clear all stored session data.
 */
export const logoutAction = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ══════════════════════════════════════════════════════════
// READ — GET USERS
// ══════════════════════════════════════════════════════════

/**
 * getAllUsersAction
 * Admin only: Fetch all platform users.
 *
 * @returns {{ success: boolean, users?: Array, error?: string }}
 */
export const getAllUsersAction = async () => {
  try {
    const data = await getAllUsers();
    return { success: true, users: data.users || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getUserAction
 * Fetch a single user's profile by ID.
 *
 * @param {number} id
 * @returns {{ success: boolean, user?: Object, error?: string }}
 */
export const getUserAction = async (id) => {
  try {
    const user = await getUserById(id);
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getAllActiveTutorsAction
 * Get all verified tutors — used on BrowseTutors.tsx.
 *
 * @returns {{ success: boolean, tutors?: Array, error?: string }}
 */
export const getAllActiveTutorsAction = async () => {
  try {
    const data = await getAllActiveTutors();
    return { success: true, tutors: data.tutors || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * getMyStudentsAction
 * Tutor / Admin: Get students who have booked sessions with this tutor.
 *
 * @returns {{ success: boolean, students?: Array, error?: string }}
 */
export const getMyStudentsAction = async () => {
  try {
    const data = await getMyStudents();
    return { success: true, students: data.students || data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
// EDIT PROFILE  (OTP-gated two-step flow)
// ══════════════════════════════════════════════════════════

/**
 * requestEditOtpAction
 * Step 1: Trigger OTP to be sent before profile edit.
 *
 * @returns {{ success: boolean, error?: string }}
 */
export const requestEditOtpAction = async () => {
  try {
    await requestEditOtp();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * editProfileAction
 * Step 2: Submit profile updates with the OTP from Step 1.
 * Validates fullName length; hourly rate range if provided (tutor-only).
 *
 * @param {Object} form
 * @param {number} form.userId
 * @param {string} form.fullName
 * @param {string} form.otpCode
 * @param {string} [form.phoneNumber]
 * @param {string} [form.bio]          - Max 500 chars
 * @param {number} [form.hourlyRate]   - Rs. 100–5000, Tutor only
 * @param {string[]} [form.subjects]   - Tutor only
 * @returns {{ success: boolean, user?: Object, errors?: Object }}
 */
export const editProfileAction = async (form) => {
  const errors = {};

  if (!form.fullName?.trim() || form.fullName.trim().length < 3)
    errors.fullName = "Full name must be at least 3 characters.";

  if (!form.otpCode?.trim() || form.otpCode.trim().length !== 6)
    errors.otpCode = "OTP must be a 6-digit code.";

  if (form.bio !== undefined && form.bio.trim().length > 500)
    errors.bio = "Bio must not exceed 500 characters.";

  if (form.hourlyRate !== undefined) {
    const rate = Number(form.hourlyRate);
    if (isNaN(rate) || rate < 100 || rate > 5000)
      errors.hourlyRate = "Hourly rate must be between Rs. 100 and Rs. 5,000.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    const response = await editUserProfile(form);
    localStorage.setItem("user", JSON.stringify(response.user));
    return { success: true, user: response.user };
  } catch (err) {
    return {
      success: false,
      errors: {
        general: err.message?.includes("403")
          ? "Invalid or expired OTP. Please request a new one."
          : err.message || "Update failed.",
      },
    };
  }
};

// ══════════════════════════════════════════════════════════
// ADMIN OPERATIONS
// ══════════════════════════════════════════════════════════

/**
 * deleteUserAction
 * Admin only: Soft-delete a user account (status → "Inactive").
 * Hard delete is never performed.
 *
 * @param {number} id
 * @returns {{ success: boolean, error?: string }}
 */
export const deleteUserAction = async (id) => {
  try {
    await deleteUser(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * approveUserAction
 * Admin only: Change a user's status.
 * Most commonly used to approve a Tutor (Pending Verification → Active).
 *
 * @param {number} userId
 * @param {"Active" | "Suspended" | "Pending"} status
 * @returns {{ success: boolean, error?: string }}
 */
export const approveUserAction = async (userId, status) => {
  if (!userId)  return { success: false, error: "User ID is required." };
  if (!status)  return { success: false, error: "Status is required." };

  try {
    await approveUser({ userId, status });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════
// FORGOT PASSWORD  (three-step OTP flow)
// ══════════════════════════════════════════════════════════

/**
 * forgotPasswordRequestAction
 * Step 1: Send reset OTP to email.
 *
 * @param {string} email
 * @returns {{ success: boolean, error?: string }}
 */
export const forgotPasswordRequestAction = async (email) => {
  if (!email?.trim()) return { success: false, error: "Email is required." };

  try {
    await requestForgotPasswordOtp({ email: email.trim() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Could not send OTP." };
  }
};

/**
 * forgotPasswordVerifyAction
 * Step 2: Verify the reset OTP.
 *
 * @param {string} email
 * @param {string} otpCode
 * @returns {{ success: boolean, error?: string }}
 */
export const forgotPasswordVerifyAction = async (email, otpCode) => {
  if (!email?.trim())   return { success: false, error: "Email is required." };
  if (!otpCode?.trim()) return { success: false, error: "OTP is required." };

  try {
    await verifyForgotPasswordOtp({ email: email.trim(), otpCode: otpCode.trim() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "OTP verification failed." };
  }
};

/**
 * forgotPasswordResetAction
 * Step 3: Set a new password after OTP is verified.
 *
 * @param {string} email
 * @param {string} otpCode
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @returns {{ success: boolean, errors?: Object }}
 */
export const forgotPasswordResetAction = async (email, otpCode, newPassword, confirmPassword) => {
  const errors = {};

  if (!email?.trim())   errors.email = "Email is required.";
  if (!otpCode?.trim()) errors.otpCode = "OTP is required.";

  const passErr = validatePassword(newPassword);
  if (passErr) errors.newPassword = passErr;

  if (newPassword !== confirmPassword)
    errors.confirmPassword = "Passwords do not match.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  try {
    await resetPassword({ email: email.trim(), otpCode: otpCode.trim(), newPassword });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      errors: { general: err.message || "Password reset failed." },
    };
  }
};
