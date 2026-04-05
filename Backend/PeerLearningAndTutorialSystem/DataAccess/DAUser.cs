using BCrypt.Net;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data Access Layer for all User-related database operations.
    /// Every public method maps to one stored-procedure action (PLT_USER_PROC).
    /// Role constants: Admin = roleId 1 | Tutor = roleId 2 | Student = roleId 3
    /// </summary>
    public class DAUser : IUser
    {
        // ── Role ID constants (must match Roles table) ───────────────────
        private const int ROLE_ADMIN = 1;
        private const int ROLE_TUTOR = 2;
        private const int ROLE_STUDENT = 3;

        private readonly DBConnect _db = new DBConnect();

        // ════════════════════════════════════════════════════════════════
        //  PRIVATE HELPERS
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Maps a DataRow from the Users JOIN Roles result set into a UserModel.
        /// Columns expected: userId, fullName, email, password_hash, roleId, roleName,
        ///                   status, isEmailVerified, profileImage,
        ///                   created_by, created_at, updated_by, updated_at
        /// </summary>
        private UserModel MapRow(DataRow row)
        {
            return new UserModel
            {
                UserId = Convert.ToInt32(row["userId"]),
                FullName = row["fullName"].ToString(),
                Email = row["email"].ToString(),
                PasswordHash = row["password_hash"].ToString(),
                RoleId = Convert.ToInt32(row["roleId"]),
                RoleName = row["roleName"] != DBNull.Value ? row["roleName"].ToString() : "",
                Status = row["status"].ToString(),
                IsEmailVerified = Convert.ToBoolean(row["isEmailVerified"]),
                ProfileImage = row["profileImage"] != DBNull.Value ? row["profileImage"].ToString() : null,
                CreatedBy = row["created_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["created_by"]) : null,
                CreatedAt = row["created_at"] != DBNull.Value ? row["created_at"].ToString() : null,
                UpdatedBy = row["updated_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["updated_by"]) : null,
                UpdatedAt = row["updated_at"] != DBNull.Value ? row["updated_at"].ToString() : null
            };
        }

        /// <summary>
        /// Creates the two OUTPUT parameters required by every PLT_USER_PROC call.
        /// </summary>
        private (SqlParameter status, SqlParameter message) OutParams()
        {
            var pOut = new ProcedureDBModel();
            return (pOut.ResultStatusCode(), pOut.ExceptionMessage());
        }

        // ════════════════════════════════════════════════════════════════
        //  001 — GET ALL USERS  (Admin only — enforced in controller)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Returns all users with their role names, ordered newest-first.
        /// Access: Admin only.
        /// </summary>
        public Response GetAllUsers()
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "001"),
                    pStatus, pMessage
                });

                var list = new List<UserModel>();
                foreach (DataRow row in dt.Rows)
                    list.Add(MapRow(row));

                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  002 — GET USER BY ID  (Admin or own account — enforced in controller)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Returns a single user record by userId.
        /// Access: Admin (any userId) | Tutor / Student (own userId only).
        /// </summary>
        public Response GetUserById(int userId)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "002"),
                    new SqlParameter("@p_user_id",     userId),
                    pStatus, pMessage
                });

                if (dt.Rows.Count == 0)
                    return Response.Fail("User not found.");

                return Response.Success(MapRow(dt.Rows[0]));
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  003 — REGISTER
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Registers a new user (Student or Tutor).
        ///  - Hashes the password with BCrypt (work factor 12).
        ///  - New accounts land in "Pending" status, isEmailVerified = 0.
        ///  - Sends a welcome / confirmation e-mail after successful insert.
        ///  - Admin can pre-set a roleId; anonymous registration defaults to Student (3).
        /// Access: Public (anonymous).
        /// </summary>
        public Response Register(UserRequestApi request)
        {
            try
            {
                // ── Validate required fields ─────────────────────────────
                if (string.IsNullOrWhiteSpace(request.FullName) ||
                    string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Password))
                    return Response.Fail("Full name, email, and password are required.");

                // ── Hash password before storing ─────────────────────────
                string hashed = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "003"),
                    new SqlParameter("@p_full_name",   request.FullName.Trim()),
                    new SqlParameter("@p_email",       request.Email.ToLower().Trim()),
                    new SqlParameter("@p_password",    hashed),
                    new SqlParameter("@p_role_id",     (object)request.RoleId ?? DBNull.Value),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();

                if (code != 1) return Response.Fail(msg);

                // ── Fire-and-forget: welcome / confirmation e-mail ───────
                new EmailHelper().SendWelcomeEmail(request.Email, request.FullName);

                return Response.Success(null, "Registration successful. Please wait for admin approval.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  004 — EDIT USER
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Updates user profile fields.
        ///  - Admin can edit any field (fullName, email, roleId, status) for any user.
        ///  - Tutor / Student can only update their own fullName and profileImage.
        ///    They CANNOT change email, roleId, or status.
        ///  - Sends an account-update notification e-mail after a successful edit.
        /// Access: Admin (any user) | Tutor / Student (own account, restricted fields).
        /// </summary>
        /// <param name="request">Edit payload.</param>
        /// <param name="callerId">userId extracted from JWT (the person making the request).</param>
        /// <param name="callerRole">roleName from JWT ("Admin", "Tutor", "Student").</param>
        public Response EditUser(UserRequestApi request, int callerId, string callerRole)
        {
            try
            {
                int targetUserId = request.UserId ?? 0;

                if (targetUserId == 0)
                    return Response.Fail("UserId is required.");

                // ── Role-based field restrictions ────────────────────────
                string emailToSave = null;
                int? roleIdToSave = null;
                string statusToSave = null;

                if (callerRole == "Admin")
                {
                    // Admin can change everything
                    emailToSave = request.Email?.ToLower().Trim();
                    roleIdToSave = request.RoleId;
                    statusToSave = request.Status;
                }
                else
                {
                    // Tutor / Student: must be editing own account only
                    if (callerId != targetUserId)
                        return Response.Fail("You can only edit your own account.");

                    // Email, roleId, and status are locked for non-admins
                    emailToSave = null;
                    roleIdToSave = null;
                    statusToSave = null;
                }

                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "004"),
                    new SqlParameter("@p_user_id",     targetUserId),
                    new SqlParameter("@p_full_name",   (object)request.FullName?.Trim() ?? DBNull.Value),
                    new SqlParameter("@p_email",       (object)emailToSave              ?? DBNull.Value),
                    new SqlParameter("@p_role_id",     (object)roleIdToSave             ?? DBNull.Value),
                    new SqlParameter("@p_status",      (object)statusToSave             ?? DBNull.Value),
                    new SqlParameter("@p_admin_id",    callerId),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();

                if (code != 1) return Response.Fail(msg);

                // ── Notify user that their account was updated ───────────
                // Fetch updated email for notification (use original request email if admin changed it)
                string notifyEmail = request.Email ?? GetUserEmailById(targetUserId);
                if (!string.IsNullOrEmpty(notifyEmail))
                    new EmailHelper().SendAccountUpdatedEmail(notifyEmail, request.FullName ?? "");

                return Response.Success(null, msg);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        /// <summary>Helper: fetch only the email of a user by their ID (for notifications).</summary>
        private string GetUserEmailById(int userId)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();
                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "002"),
                    new SqlParameter("@p_user_id",     userId),
                    pStatus, pMessage
                });
                return dt.Rows.Count > 0 ? dt.Rows[0]["email"].ToString() : null;
            }
            catch { return null; }
        }

        // ════════════════════════════════════════════════════════════════
        //  005 — SOFT DELETE USER  (Admin only — enforced in controller)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Soft-deletes a user by setting their status to "Inactive".
        /// Admin cannot delete their own account (SP enforces this too).
        /// Access: Admin only.
        /// </summary>
        public Response DeleteUser(int userId, int adminId)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "005"),
                    new SqlParameter("@p_user_id",     userId),
                    new SqlParameter("@p_admin_id",    adminId),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();
                return code == 1 ? Response.Success(null, msg) : Response.Fail(msg);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  007 — APPROVE / CHANGE USER STATUS  (Admin only)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Changes a user's status (Pending → Approved | Rejected | Suspended | Active | Inactive).
        /// Access: Admin only.
        /// </summary>
        public Response ApproveUser(int userId, string status, int adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                    return Response.Fail("Status value is required.");

                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "007"),
                    new SqlParameter("@p_user_id",     userId),
                    new SqlParameter("@p_status",      status),
                    new SqlParameter("@p_admin_id",    adminId),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();
                return code == 1 ? Response.Success(null, msg) : Response.Fail(msg);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  008 — LOGIN (email + BCrypt password)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Authenticates a user with email and password.
        ///  1. Fetches the user row by email.
        ///  2. Verifies the submitted password against the stored BCrypt hash.
        ///  3. Checks account status (must be "Active") and email verification.
        ///  4. Returns a signed JWT on success.
        /// Access: Public (anonymous).
        /// </summary>
        public Response Login(UserRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Password))
                    return Response.Fail("Email and password are required.");

                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "008"),
                    new SqlParameter("@p_email",       request.Email.ToLower().Trim()),
                    pStatus, pMessage
                });

                // ── Unknown email → generic error (prevent user enumeration) ─
                if (dt.Rows.Count == 0)
                    return Response.Fail("Invalid email or password.");

                var user = MapRow(dt.Rows[0]);

                // ── BCrypt password check ────────────────────────────────
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                    return Response.Fail("Invalid email or password.");

                // ── Account status check ─────────────────────────────────
                if (user.Status != "Active")
                    return Response.Fail($"Account is {user.Status}. Please contact the administrator.");

                // ── Email verification check ─────────────────────────────
                if (!user.IsEmailVerified)
                    return Response.Fail("Please verify your email address before logging in.");

                // ── Issue JWT ────────────────────────────────────────────
                string token = new JwtHelper().GenerateToken(user);

                return Response.Success(new
                {
                    token,
                    userId = user.UserId,
                    fullName = user.FullName,
                    email = user.Email,
                    roleName = user.RoleName,
                    roleId = user.RoleId
                }, "Login successful.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  009 — GOOGLE OAUTH LOGIN
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Logs in (or auto-registers) a user via Google OAuth.
        ///  - If the Google ID or email already exists → returns existing account.
        ///  - If new → creates an Active, email-verified Student account automatically.
        /// Access: Public (anonymous). Token is verified in the controller before this is called.
        /// </summary>
        public Response GoogleOAuthLogin(UserRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.GoogleId) ||
                    string.IsNullOrWhiteSpace(request.Email))
                    return Response.Fail("Google account information is missing.");

                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type",  "009"),
                    new SqlParameter("@p_full_name",    request.FullName ?? ""),
                    new SqlParameter("@p_email",        request.Email.ToLower().Trim()),
                    new SqlParameter("@p_provider_uid", request.GoogleId),
                    pStatus, pMessage
                });

                if (dt.Rows.Count == 0)
                    return Response.Fail("Google login failed. Please try again.");

                var user = MapRow(dt.Rows[0]);
                string token = new JwtHelper().GenerateToken(user);

                return Response.Success(new
                {
                    token,
                    userId = user.UserId,
                    fullName = user.FullName,
                    email = user.Email,
                    roleName = user.RoleName,
                    roleId = user.RoleId
                }, "Google login successful.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  010 — REQUEST OTP (forgot password)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Generates and stores a 6-digit OTP (valid 10 min), then e-mails it.
        /// Always returns a success-looking message to prevent email enumeration.
        /// Access: Public (anonymous).
        /// </summary>
        public Response RequestOtp(string email, string otpCode)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "010"),
                    new SqlParameter("@p_email",       email.ToLower().Trim()),
                    new SqlParameter("@p_otp_code",    otpCode),
                    pStatus, pMessage
                });

                // ── Send OTP e-mail regardless of whether the email existed ─
                // (SP stores the OTP only if the email exists and is Active)
                new EmailHelper().SendOtpEmail(email, otpCode);

                return Response.Success(null, "If that email exists, an OTP has been sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  011 — VERIFY OTP
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Checks that the submitted OTP matches the stored (unused, non-expired) code.
        /// Access: Public (anonymous).
        /// </summary>
        public Response VerifyOtp(string email, string otpCode)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "011"),
                    new SqlParameter("@p_email",       email.ToLower().Trim()),
                    new SqlParameter("@p_otp_code",    otpCode),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();
                return code == 1 ? Response.Success(null, msg) : Response.Fail(msg);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  012 — RESET PASSWORD
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Resets the user's password after OTP verification.
        ///  - Hashes the new password before storing.
        ///  - Marks the OTP token as used so it cannot be replayed.
        /// Access: Public (anonymous — but requires valid OTP).
        /// </summary>
        public Response ResetPassword(UserRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.OtpCode) ||
                    string.IsNullOrWhiteSpace(request.NewPassword))
                    return Response.Fail("Email, OTP code, and new password are required.");

                string hashed = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);

                var (pStatus, pMessage) = OutParams();

                _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type",  "012"),
                    new SqlParameter("@p_email",        request.Email.ToLower().Trim()),
                    new SqlParameter("@p_otp_code",     request.OtpCode),
                    new SqlParameter("@p_new_password", hashed),
                    pStatus, pMessage
                });

                int code = (int)pStatus.Value;
                string msg = pMessage.Value?.ToString();
                return code == 1 ? Response.Success(null, msg) : Response.Fail(msg);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  013 — GET STUDENTS FOR A TUTOR
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Returns all Student accounts that are linked to the calling Tutor.
        /// Uses SP action "013". (Add this action to PLT_USER_PROC — see SQL script.)
        /// Access: Tutor (own students) | Admin (any tutorId).
        /// </summary>
        public Response GetStudentsForTutor(int tutorId)
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "013"),
                    new SqlParameter("@p_user_id",     tutorId),
                    pStatus, pMessage
                });

                var list = new List<UserModel>();
                foreach (DataRow row in dt.Rows)
                    list.Add(MapRow(row));

                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ════════════════════════════════════════════════════════════════
        //  014 — GET ALL TUTORS  (visible to Students)
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Returns all Active Tutor accounts (public profile info only).
        /// Uses SP action "014". (Add this action to PLT_USER_PROC — see SQL script.)
        /// Access: Student | Tutor | Admin.
        /// </summary>
        public Response GetAllTutors()
        {
            try
            {
                var (pStatus, pMessage) = OutParams();

                var dt = _db.ExecuteProcedure("PLT_USER_PROC", new[]
                {
                    new SqlParameter("@p_action_type", "014"),
                    pStatus, pMessage
                });

                var list = new List<UserModel>();
                foreach (DataRow row in dt.Rows)
                    list.Add(MapRow(row));

                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}