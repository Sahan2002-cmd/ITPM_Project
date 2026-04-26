/**
 * UserAPI.js — Service Layer
 * Module: User Account Management (Shared / Week 1 Base)
 * Backend: UserController.cs → DAUser.cs → PLT_USER_PROC.sql
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  METHOD   ENDPOINT                          AUTH          DESCRIPTION
 * ─────────────────────────────────────────────────────────────────────────────
 *  POST     /user/register                    None          Register + OTP to email & SMS
 *  POST     /user/verify-otp                  None          Verify OTP after registration
 *  POST     /user/login                       None          Login → returns JWT
 *  POST     /user/google-login                None          Google OAuth ID token
 *  GET      /user/all                         Admin         Get all users
 *  GET      /user/{id}                        Admin/Owner   Get user by ID
 *  GET      /user/tutors                      Any logged-in Get all active tutors
 *  GET      /user/my-students                 Tutor/Admin   Students of this tutor
 *  POST     /user/edit-request-otp            Logged-in     Request OTP before editing
 *  PUT      /user/edit                        Logged-in     Edit profile (requires OTP)
 *  DELETE   /user/delete/{id}                 Admin         Soft delete user
 *  PUT      /user/approve                     Admin         Change user status
 *  POST     /user/forgot-password/request     None          Request reset OTP
 *  POST     /user/forgot-password/verify      None          Verify reset OTP
 *  POST     /user/forgot-password/reset       None          Set new password
 * ─────────────────────────────────────────────────────────────────────────────
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
// REGISTRATION & OTP VERIFICATION
// ══════════════════════════════════════════════════════════

/**
 * POST /user/register
 * Register a new user. Backend sends OTP to both email AND SMS phone.
 * Account stays Pending until OTP is verified via /user/verify-otp.
 * roleId: 1 = Admin (only via Admin Dashboard), 2 = Tutor, 3 = Student.
 *
 * Sample body:
 * { "fullName": "John Doe", "email": "john@example.com",
 *   "phoneNumber": "+1234567890", "password": "Pass@123", "roleId": 3 }
 */
export const registerUser = async ({ fullName, email, phoneNumber, password, roleId, profileImage }) => {
  const res = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, phoneNumber, password, roleId, profileImage }),
  });
  return handleResponse(res);
};

/**
 * POST /user/verify-otp
 * Verify the 6-digit OTP sent to email & SMS after registration.
 * Account becomes Active after successful verification.
 *
 * Sample body:
 * { "email": "john@example.com", "otpCode": "123456" }
 */
export const verifyOtp = async ({ email, otpCode }) => {
  const res = await fetch(`${BASE_URL}/user/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════

/**
 * POST /user/login
 * Authenticate with email & password. Returns JWT on success.
 * Store the returned token in localStorage for all subsequent requests.
 *
 * Sample body:
 * { "email": "john@example.com", "password": "Pass@123" }
 */
export const loginUser = async ({ email, password }) => {
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

/**
 * POST /user/google-login
 * Sign in via Google OAuth. Pass the ID token from Google Sign-In SDK.
 * Backend validates the token and returns a platform JWT.
 *
 * Sample body:
 * { "googleToken": "ID_TOKEN_FROM_GOOGLE" }
 */
export const googleLogin = async ({ googleToken }) => {
  const res = await fetch(`${BASE_URL}/user/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ googleToken }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// READ — GET USERS
// ══════════════════════════════════════════════════════════

/**
 * GET /user/all
 * Admin only: Fetch every user on the platform (all roles, all statuses).
 */
export const getAllUsers = async () => {
  const res = await fetch(`${BASE_URL}/user/all`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /user/{id}
 * Get a single user by their ID.
 * Accessible by Admin or the account owner only.
 *
 * @param {number} id
 */
export const getUserById = async (id) => {
  const res = await fetch(`${BASE_URL}/user/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /user/tutors
 * Get all Active (verified) tutors on the platform.
 * Any logged-in user can call this — used on BrowseTutors.tsx.
 */
export const getAllActiveTutors = async () => {
  const res = await fetch(`${BASE_URL}/user/tutors`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /user/my-students
 * Get students who have booked sessions with the currently logged-in tutor.
 * Accessible by Tutor or Admin (Admin sees all tutor-student relationships).
 */
export const getMyStudents = async () => {
  const res = await fetch(`${BASE_URL}/user/my-students`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// EDIT PROFILE  (OTP-gated two-step flow)
// ══════════════════════════════════════════════════════════

/**
 * POST /user/edit-request-otp
 * Step 1 of profile edit: Triggers an OTP sent to the user's registered
 * email & phone number. Must be called before /user/edit.
 * Any logged-in user can request this.
 */
export const requestEditOtp = async () => {
  const res = await fetch(`${BASE_URL}/user/edit-request-otp`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * PUT /user/edit
 * Step 2 of profile edit: Submit updated fields + OTP received in Step 1.
 * Any logged-in user can call this.
 *
 * Sample body:
 * { "userId": 5, "fullName": "New Name", "otpCode": "123456" }
 *
 * @param {Object} body
 * @param {number} body.userId
 * @param {string} body.fullName
 * @param {string} body.otpCode
 * @param {string} [body.phoneNumber]
 * @param {string} [body.bio]             - Max 500 chars (Tutor)
 * @param {number} [body.hourlyRate]      - Rs. 100–5000 (Tutor)
 * @param {string[]} [body.subjects]      - (Tutor)
 */
export const editUserProfile = async (body) => {
  const res = await fetch(`${BASE_URL}/user/edit`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// ADMIN OPERATIONS
// ══════════════════════════════════════════════════════════

/**
 * DELETE /user/delete/{id}
 * Admin only: Soft-delete a user (sets status = "Inactive").
 * Hard delete is NEVER performed — past session records must be preserved.
 *
 * @param {number} id
 */
export const deleteUser = async (id) => {
  const res = await fetch(`${BASE_URL}/user/delete/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * PUT /user/approve
 * Admin only: Change a user's account status.
 * Commonly used to approve a Tutor (Pending Verification → Active)
 * or suspend a user (Active → Suspended).
 *
 * Sample body:
 * { "userId": 5, "status": "Active" }
 *
 * @param {Object} body
 * @param {number} body.userId
 * @param {string} body.status  - "Active" | "Suspended" | "Pending"
 */
export const approveUser = async ({ userId, status }) => {
  const res = await fetch(`${BASE_URL}/user/approve`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, status }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// FORGOT PASSWORD  (three-step OTP flow)
// ══════════════════════════════════════════════════════════

/**
 * POST /user/forgot-password/request
 * Step 1: Request a password-reset OTP by email.
 * No auth token required.
 *
 * Sample body:
 * { "email": "john@example.com" }
 */
export const requestForgotPasswordOtp = async ({ email }) => {
  const res = await fetch(`${BASE_URL}/user/forgot-password/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
};

/**
 * POST /user/forgot-password/verify
 * Step 2: Confirm the OTP received in Step 1.
 * No auth token required.
 *
 * Sample body:
 * { "email": "john@example.com", "otpCode": "123456" }
 */
export const verifyForgotPasswordOtp = async ({ email, otpCode }) => {
  const res = await fetch(`${BASE_URL}/user/forgot-password/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode }),
  });
  return handleResponse(res);
};

/**
 * POST /user/forgot-password/reset
 * Step 3: Set a new password after OTP is verified.
 * No auth token required.
 *
 * Sample body:
 * { "email": "john@example.com", "otpCode": "123456", "newPassword": "New@123" }
 */
export const resetPassword = async ({ email, otpCode, newPassword }) => {
  const res = await fetch(`${BASE_URL}/user/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode, newPassword }),
  });
  return handleResponse(res);
};

// ══════════════════════════════════════════════════════════
// TUTOR APPROVAL WORKFLOW
// ══════════════════════════════════════════════════════════

/**
 * GET /user/pending-tutors
 * Admin only: Fetch tutor user accounts with Status == "PendingApproval".
 * Returns user records (no password hashes).
 */
export const getPendingTutorSignups = async () => {
  const res = await fetch(`${BASE_URL}/user/pending-tutors`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * PUT /user/expire-registration/{userId}
 * Called by the frontend when a tutor's 7-day registration window expires.
 * Admin or the tutor themselves can call this.
 *
 * @param {number} userId
 */
export const expireRegistration = async (userId) => {
  const res = await fetch(`${BASE_URL}/user/expire-registration/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
