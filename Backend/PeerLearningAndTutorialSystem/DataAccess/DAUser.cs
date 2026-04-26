using BCrypt.Net;
using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    public class DAUser : IUser
    {
        private readonly IMongoCollection<UserModel> _users;
        private readonly IMongoCollection<BookingModel> _bookings;
        private readonly IMongoCollection<VerificationToken> _verificationTokens;

        public DAUser()
        {
            var ctx = new MongoDBContext();
            _users = ctx.GetCollection<UserModel>("Users");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
            _verificationTokens = ctx.GetCollection<VerificationToken>("VerificationTokens");
        }

        private string ToIsoString(DateTime dt) => dt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        private void SetTimestamps(UserModel user, int? updatedBy = null)
        {
            var now = DateTime.UtcNow;
            if (user.CreatedAt == null)
            {
                user.CreatedAt = ToIsoString(now);
                user.CreatedBy = updatedBy;
            }
            user.UpdatedAt = ToIsoString(now);
            user.UpdatedBy = updatedBy;
        }

        // ─────────────────────────────────────────────────────────────────
        // 001 – GET ALL USERS (Admin)
        public Response GetAllUsers()
        {
            try
            {
                var users = _users.Find(_ => true).ToList();
                return Response.Success(users);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 002 – GET USER BY ID
        public Response GetUserById(int userId)
        {
            try
            {
                var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");
                return Response.Success(user);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003 – REGISTER (sends OTP to email and phone)
        //public Response Register(UserRequestApi request)
        //{
        //    try
        //    {
        //        if (string.IsNullOrWhiteSpace(request.FullName) ||
        //            string.IsNullOrWhiteSpace(request.Email) ||
        //            string.IsNullOrWhiteSpace(request.Password) ||
        //            string.IsNullOrWhiteSpace(request.PhoneNumber))
        //            return Response.Fail("Full name, email, phone number, and password are required.");

        //        // Check confirmation checkbox
        //        if (!request.ConfirmDetails)
        //            return Response.Fail("You must confirm that the details are correct.");

        //        // Validate Center
        //        var validCenters = new[] { "Malabe", "Matara", "Jaffna", "Kandy" };
        //        if (string.IsNullOrWhiteSpace(request.Center) || !validCenters.Contains(request.Center))
        //            return Response.Fail("Please select a valid SLIIT center (Malabe, Matara, Jaffna, Kandy).");

        //        // Check duplicate email
        //        if (_users.Find(u => u.Email == request.Email.ToLower().Trim()).Any())
        //            return Response.Fail("Email already registered.");

        //        var user = new UserModel
        //        {
        //            UserId = CounterHelper.GetNextSequence("userId"),
        //            FullName = request.FullName.Trim(),
        //            Email = request.Email.ToLower().Trim(),
        //            PhoneNumber = request.PhoneNumber.Trim(),
        //            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
        //            RoleId = request.RoleId ?? 3,
        //            RoleName = request.RoleId == 1 ? "Admin" : (request.RoleId == 2 ? "Tutor" : "Student"),
        //            Status = "Pending",
        //            IsEmailVerified = false,
        //            ProfileImage = null,
        //            Center = request.Center,
        //            // For students, store semester; for tutors/admins it can be null or empty
        //            Semester = (request.RoleId == 3) ? request.Semester : null
        //        };

        //        // Validate semester for students
        //        if (user.RoleId == 3 && string.IsNullOrWhiteSpace(user.Semester))
        //            return Response.Fail("Semester is required for student registration.");

        //        SetTimestamps(user);
        //        _users.InsertOne(user);

        //        // Generate and store OTP
        //        string otp = EmailHelper.GenerateOtp();
        //        var token = new VerificationToken
        //        {
        //            Email = user.Email,
        //            PhoneNumber = user.PhoneNumber,
        //            OtpCode = otp,
        //            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
        //            Used = false,
        //            Purpose = "registration"
        //        };
        //        _verificationTokens.InsertOne(token);

        //        // Send OTPs
        //        new EmailHelper().SendRegistrationOtpEmail(user.Email, otp);
        //        SmsHelper.SendOtp(user.PhoneNumber, otp);

        //        return Response.Success(null, "Registration successful. Please verify your email and phone using the OTP sent.");
        //    }
        //    catch (Exception ex) { return Response.Error(ex.Message); }
        //}
        public Response Register(UserRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FullName) ||
                    string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.PhoneNumber))
                    return Response.Fail("Full name, email, phone number, and password are required.");

                // Check confirmation checkbox
                if (!request.ConfirmDetails)
                    return Response.Fail("You must confirm that the details are correct.");

                // Validate Center
                var validCenters = new[] { "Malabe", "Matara", "Jaffna", "Kandy" };
                if (string.IsNullOrWhiteSpace(request.Center) || !validCenters.Contains(request.Center))
                    return Response.Fail("Please select a valid SLIIT center (Malabe, Matara, Jaffna, Kandy).");

                // Check duplicate email
                if (_users.Find(u => u.Email == request.Email.ToLower().Trim()).Any())
                    return Response.Fail("Email already registered.");

                var user = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),
                    FullName = request.FullName.Trim(),
                    Email = request.Email.ToLower().Trim(),
                    PhoneNumber = request.PhoneNumber.Trim(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
                    RoleId = request.RoleId ?? 3,
                    RoleName = request.RoleId == 1 ? "Admin" : (request.RoleId == 2 ? "Tutor" : "Student"),
                    Status = "Active",                     // ✅ Active immediately
                    IsEmailVerified = true,                // ✅ No OTP needed
                    ProfileImage = request.ProfileImage,
                    Center = request.Center,
                    Semester = (request.RoleId == 3) ? request.Semester : null
                };

                // Validate semester for students
                if (user.RoleId == 3 && string.IsNullOrWhiteSpace(user.Semester))
                    return Response.Fail("Semester is required for student registration.");

                SetTimestamps(user);
                _users.InsertOne(user);

                // ✅ Send registration success email (no OTP)
                new EmailHelper().SendRegistrationSuccessEmail(user.Email, user.FullName);

                return Response.Success(null, "Registration successful. You can now log in.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003b – VERIFY REGISTRATION OTP
        //public Response VerifyRegistrationOtp(string email, string otpCode)
        //{
        //    try
        //    {
        //        var token = _verificationTokens.Find(t => t.Email == email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "registration").FirstOrDefault();
        //        if (token == null) return Response.Fail("Invalid or expired OTP.");

        //        _verificationTokens.UpdateOne(t => t.Id == token.Id,
        //            Builders<VerificationToken>.Update.Set(t => t.Used, true));

        //        _users.UpdateOne(u => u.Email == email,
        //            Builders<UserModel>.Update
        //                .Set(u => u.Status, "Active")
        //                .Set(u => u.IsEmailVerified, true)
        //                .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

        //        return Response.Success(null, "Email and phone verified. You can now log in.");
        //    }
        //    catch (Exception ex) { return Response.Error(ex.Message); }
        //}


        public Response VerifyRegistrationOtp(string email, string otpCode)
        {
            try
            {
                var token = _verificationTokens.Find(t => t.Email == email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "registration").FirstOrDefault();
                if (token == null) return Response.Fail("Invalid or expired OTP.");

                _verificationTokens.UpdateOne(t => t.Id == token.Id,
                    Builders<VerificationToken>.Update.Set(t => t.Used, true));

                var user = _users.Find(u => u.Email == email).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                _users.UpdateOne(u => u.Email == email,
                    Builders<UserModel>.Update
                        .Set(u => u.Status, "Active")
                        .Set(u => u.IsEmailVerified, true)
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                // Send account creation success email
                new EmailHelper().SendAccountCreationSuccessEmail(user.Email, user.FullName);

                return Response.Success(null, "Email and phone verified. You can now log in.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // Add a new method for updating profile image (to be called from a separate endpoint)
        public Response UpdateProfileImage(int userId, string imageBase64)
        {
            try
            {
                var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                // Optional: validate base64 string and size (max 2MB)
                if (string.IsNullOrWhiteSpace(imageBase64))
                    return Response.Fail("Image data is required.");

                _users.UpdateOne(u => u.UserId == userId,
                    Builders<UserModel>.Update
                        .Set(u => u.ProfileImage, imageBase64)
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                return Response.Success(null, "Profile image updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // Update Basic Info Without OTP
        public Response UpdateBasicUserInfo(UserRequestApi request)
        {
            try
            {
                int targetUserId = request.UserId ?? 0;
                if (targetUserId == 0) return Response.Fail("UserId is required.");

                var user = _users.Find(u => u.UserId == targetUserId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                var updateDef = new List<UpdateDefinition<UserModel>>();

                if (!string.IsNullOrWhiteSpace(request.FullName))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.FullName, request.FullName.Trim()));

                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.PhoneNumber, request.PhoneNumber.Trim()));

                if (updateDef.Count == 0)
                    return Response.Fail("No valid fields to update.");

                updateDef.Add(Builders<UserModel>.Update.Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                var update = Builders<UserModel>.Update.Combine(updateDef);
                _users.UpdateOne(u => u.UserId == targetUserId, update);

                return Response.Success(null, "Basic profile info updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – EDIT USER (requires OTP verification first)
        public Response EditUser(UserRequestApi request, int callerId, string callerRole)
        {
            try
            {
                int targetUserId = request.UserId ?? 0;
                if (targetUserId == 0) return Response.Fail("UserId is required.");

                var user = _users.Find(u => u.UserId == targetUserId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                // Verify OTP before allowing edit (unless admin? admin may skip? but we'll require for security)
                if (string.IsNullOrWhiteSpace(request.OtpCode))
                    return Response.Fail("OTP code is required to edit profile.");

                var verify = VerifyEditOtp(user.Email, request.OtpCode);
                if (verify.StatusCode != 1) return verify;

                var updateDef = new List<UpdateDefinition<UserModel>>();

                if (!string.IsNullOrWhiteSpace(request.FullName))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.FullName, request.FullName.Trim()));

                if (callerRole == "Admin")
                {
                    if (!string.IsNullOrWhiteSpace(request.Email))
                        updateDef.Add(Builders<UserModel>.Update.Set(u => u.Email, request.Email.ToLower().Trim()));
                    if (request.RoleId.HasValue)
                    {
                        updateDef.Add(Builders<UserModel>.Update.Set(u => u.RoleId, request.RoleId.Value));
                        updateDef.Add(Builders<UserModel>.Update.Set(u => u.RoleName,
                            request.RoleId == 1 ? "Admin" : (request.RoleId == 2 ? "Tutor" : "Student")));
                    }
                    if (!string.IsNullOrWhiteSpace(request.Status))
                        updateDef.Add(Builders<UserModel>.Update.Set(u => u.Status, request.Status));
                }
                else
                {
                    if (callerId != targetUserId)
                        return Response.Fail("You can only edit your own account.");
                }

                if (updateDef.Count == 0)
                    return Response.Fail("No valid fields to update.");

                updateDef.Add(Builders<UserModel>.Update.Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));
                updateDef.Add(Builders<UserModel>.Update.Set(u => u.UpdatedBy, callerId));

                var update = Builders<UserModel>.Update.Combine(updateDef);
                _users.UpdateOne(u => u.UserId == targetUserId, update);

                // Send notification email
                string notifyEmail = request.Email ?? user.Email;
                new EmailHelper().SendAccountUpdatedEmail(notifyEmail, request.FullName ?? user.FullName);

                return Response.Success(null, "Profile updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004b – REQUEST OTP FOR EDIT
        public Response RequestEditOtp(int userId)
        {
            try
            {
                var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                string otp = EmailHelper.GenerateOtp();
                var token = new VerificationToken
                {
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    OtpCode = otp,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                    Used = false,
                    Purpose = "edit_profile"
                };
                _verificationTokens.InsertOne(token);
                new EmailHelper().SendOtpEmail(user.Email, otp);
                // Optionally also send SMS: SmsHelper.SendOtp(user.PhoneNumber, otp);
                return Response.Success(null, "OTP sent to your registered email.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004c – VERIFY OTP FOR EDIT
        private Response VerifyEditOtp(string email, string otpCode)
        {
            var token = _verificationTokens.Find(t => t.Email == email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "edit_profile").FirstOrDefault();
            if (token == null) return Response.Fail("Invalid or expired OTP.");
            _verificationTokens.UpdateOne(t => t.Id == token.Id, Builders<VerificationToken>.Update.Set(t => t.Used, true));
            return Response.Success(null, "OTP verified.");
        }

        // 005 – SOFT DELETE USER (Admin)
        public Response DeleteUser(int userId, int adminId)
        {
            try
            {
                var result = _users.UpdateOne(u => u.UserId == userId,
                    Builders<UserModel>.Update
                        .Set(u => u.Status, "Inactive")
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow))
                        .Set(u => u.UpdatedBy, adminId));
                if (result.MatchedCount == 0) return Response.Fail("User not found.");
                return Response.Success(null, "User deactivated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 007 – APPROVE / CHANGE STATUS (Admin)
        public Response ApproveUser(int userId, string status, int adminId)
        {
            try
            {
                var result = _users.UpdateOne(u => u.UserId == userId,
                    Builders<UserModel>.Update
                        .Set(u => u.Status, status)
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow))
                        .Set(u => u.UpdatedBy, adminId));
                if (result.MatchedCount == 0) return Response.Fail("User not found.");
                return Response.Success(null, $"Status changed to {status}.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 008 – LOGIN
        public Response Login(UserRequestApi request)
        {
            try
            {
                var user = _users.Find(u => u.Email == request.Email.ToLower().Trim()).FirstOrDefault();
                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                    return Response.Fail("Invalid email or password.");

                if (user.Status != "Active")
                    return Response.Fail($"Account is {user.Status}. Contact admin.");
                if (!user.IsEmailVerified)
                    return Response.Fail("Please verify your email address.");

                string token = new JwtHelper().GenerateToken(user);
                return Response.Success(new
                {
                    token,
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.RoleName,
                    user.RoleId,
                    user.ProfileImage
                }, "Login successful.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 009 – GOOGLE OAUTH LOGIN
        public Response GoogleOAuthLogin(UserRequestApi request)
        {
            try
            {
                var existing = _users.Find(u => u.Email == request.Email.ToLower().Trim()).FirstOrDefault();
                if (existing != null)
                {
                    string token = new JwtHelper().GenerateToken(existing);
                    return Response.Success(new { token, existing.UserId, existing.FullName, existing.Email, existing.RoleName, existing.RoleId, existing.ProfileImage }, "Google login successful.");
                }

                var newUser = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),
                    FullName = request.FullName ?? request.Email.Split('@')[0],
                    Email = request.Email.ToLower().Trim(),
                    PhoneNumber = request.PhoneNumber ?? "",
                    PasswordHash = "",
                    RoleId = 3,
                    RoleName = "Student",
                    Status = "Active",
                    IsEmailVerified = true,
                    ProfileImage = null
                };
                SetTimestamps(newUser);
                _users.InsertOne(newUser);

                string tokenNew = new JwtHelper().GenerateToken(newUser);
                return Response.Success(new { token = tokenNew, newUser.UserId, newUser.FullName, newUser.Email, newUser.RoleName, newUser.RoleId, newUser.ProfileImage }, "Google auto-registration successful.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 010 – REQUEST OTP (forgot password)
        public Response RequestOtp(string email, string otpCode)
        {
            try
            {
                var user = _users.Find(u => u.Email == email.ToLower().Trim()).FirstOrDefault();
                if (user != null && user.Status == "Active")
                {
                    _verificationTokens.DeleteMany(t => t.Email == email && t.Purpose == "password_reset");
                    var token = new VerificationToken
                    {
                        Email = email,
                        PhoneNumber = user.PhoneNumber,
                        OtpCode = otpCode,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                        Used = false,
                        Purpose = "password_reset"
                    };
                    _verificationTokens.InsertOne(token);
                    new EmailHelper().SendOtpEmail(email, otpCode);
                }
                return Response.Success(null, "If that email exists, an OTP has been sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 011 – VERIFY OTP (forgot password)
        public Response VerifyOtp(string email, string otpCode)
        {
            try
            {
                var token = _verificationTokens.Find(t => t.Email == email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "password_reset").FirstOrDefault();
                if (token == null) return Response.Fail("Invalid or expired OTP.");
                return Response.Success(null, "OTP verified.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 012 – RESET PASSWORD
        public Response ResetPassword(UserRequestApi request)
        {
            try
            {
                var token = _verificationTokens.Find(t => t.Email == request.Email && t.OtpCode == request.OtpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "password_reset").FirstOrDefault();
                if (token == null) return Response.Fail("Invalid or expired OTP.");

                string newHashed = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, 12);
                _users.UpdateOne(u => u.Email == request.Email,
                    Builders<UserModel>.Update.Set(u => u.PasswordHash, newHashed));

                _verificationTokens.UpdateOne(t => t.Id == token.Id,
                    Builders<VerificationToken>.Update.Set(t => t.Used, true));

                return Response.Success(null, "Password reset successful.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 013 – GET STUDENTS FOR A TUTOR
        public Response GetStudentsForTutor(int tutorId)
        {
            try
            {
                var studentIds = _bookings.Find(b => b.TutorId == tutorId)
                                           .Project(b => b.StudentId)
                                           .ToList()
                                           .Distinct();
                var students = _users.Find(u => studentIds.Contains(u.UserId) && u.RoleId == 3).ToList();
                return Response.Success(students);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 014 – GET ALL ACTIVE TUTORS
        public Response GetAllTutors()
        {
            try
            {
                var tutors = _users.Find(u => u.RoleId == 2 && u.Status == "Active").ToList();
                return Response.Success(tutors);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 015 – GET ALL STUDENTS (for admin reports)
        public Response GetAllStudents()
        {
            try
            {
                var students = _users.Find(u => u.RoleId == 3).ToList();
                return Response.Success(students);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
        //Verify OTP before EDIT
        public Response VerifyEditOtp(int userId, string otpCode)
        {
            try
            {
                var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                var token = _verificationTokens.Find(t => t.Email == user.Email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "edit_profile").FirstOrDefault();
                if (token == null) return Response.Fail("Invalid or expired OTP.");

                _verificationTokens.UpdateOne(t => t.Id == token.Id,
                    Builders<VerificationToken>.Update.Set(t => t.Used, true));

                return Response.Success(null, "OTP verified successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response AdminEditUser(UserRequestApi request, int adminId)
        {
            try
            {
                int targetUserId = request.UserId ?? 0;
                if (targetUserId == 0) return Response.Fail("UserId is required.");
                var user = _users.Find(u => u.UserId == targetUserId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");
                var updateDef = new List<UpdateDefinition<UserModel>>();
                if (!string.IsNullOrWhiteSpace(request.FullName))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.FullName, request.FullName.Trim()));
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.PhoneNumber, request.PhoneNumber.Trim()));
                if (!string.IsNullOrWhiteSpace(request.Center))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.Center, request.Center));
                if (request.RoleId.HasValue)
                {
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.RoleId, request.RoleId.Value));
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.RoleName,
                        request.RoleId == 1 ? "Admin" : (request.RoleId == 2 ? "Tutor" : "Student")));
                }
                if (!string.IsNullOrWhiteSpace(request.Semester))
                    updateDef.Add(Builders<UserModel>.Update.Set(u => u.Semester, request.Semester));
                if (updateDef.Count == 0)
                    return Response.Fail("No valid fields to update.");
                updateDef.Add(Builders<UserModel>.Update.Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));
                updateDef.Add(Builders<UserModel>.Update.Set(u => u.UpdatedBy, adminId));
                var update = Builders<UserModel>.Update.Combine(updateDef);
                _users.UpdateOne(u => u.UserId == targetUserId, update);
                return Response.Success(null, "User updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
        // ─────────────────────────────────────────────────────────────────
        // 016 – GET PENDING TUTOR SIGNUPS (Admin only)
        // Returns tutors who have registered but are awaiting admin verification.
        // Status == "PendingApproval" is set during tutor registration.
        public Response GetPendingTutorSignups()
        {
            try
            {
                var pending = _users
                    .Find(u => u.RoleId == 2 && u.Status == "PendingApproval")
                    .ToList()
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.PhoneNumber,
                        u.Status,
                        u.Center,
                        u.CreatedAt,
                        u.ApprovedAt,
                        // Surface how many days remain in the 7-day window
                        DaysRemaining = u.CreatedAt != null
                            ? Math.Max(0, 7 - (int)(DateTime.UtcNow - DateTime.Parse(u.CreatedAt)).TotalDays)
                            : 7
                    })
                    .ToList();

                return Response.Success(pending);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ─────────────────────────────────────────────────────────────────
        // 017 – EXPIRE TUTOR REGISTRATION
        // Called when a tutor's 7-day approval window has passed.
        // Sets Status → "Expired" so the account cannot log in.
        // The tutor must re-register if they want to reapply.
        public Response ExpireRegistration(int userId)
        {
            try
            {
                var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
                if (user == null) return Response.Fail("User not found.");

                if (user.RoleId != 2)
                    return Response.Fail("Only tutor accounts can be expired.");

                if (user.Status != "PendingApproval")
                    return Response.Fail($"Account is already '{user.Status}' — only PendingApproval accounts can be expired.");

                _users.UpdateOne(u => u.UserId == userId,
                    Builders<UserModel>.Update
                        .Set(u => u.Status, "Expired")
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                // Notify the tutor that their registration window has closed
                try
                {
                    new EmailHelper().SendRegistrationExpiredEmail(user.Email, user.FullName);
                }
                catch { /* Don't let email failure block the status update */ }

                return Response.Success(null, "Tutor registration expired. They must re-register.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 018 – UPDATE BASIC USER INFO
        public Response UpdateBasicUserInfo(UserRequestApi request)
        {
            try
            {
                var updateDef = Builders<UserModel>.Update;
                var updates = new List<UpdateDefinition<UserModel>>();

                if (!string.IsNullOrWhiteSpace(request.FullName))
                    updates.Add(updateDef.Set(u => u.FullName, request.FullName));
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    updates.Add(updateDef.Set(u => u.PhoneNumber, request.PhoneNumber));

                if (updates.Count == 0) return Response.Fail("No fields to update.");

                updates.Add(updateDef.Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                var result = _users.UpdateOne(u => u.UserId == request.UserId, updateDef.Combine(updates));

                if (result.ModifiedCount > 0)
                    return Response.Success(null, "Basic info updated.");
                return Response.Fail("User not found or no changes made.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // Helper
        private string GetUserEmailById(int userId)
        {
            var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
            return user?.Email;
        }
    }
}