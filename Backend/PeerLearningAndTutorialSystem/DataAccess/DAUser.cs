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
        public Response Register(UserRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FullName) ||
                    string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.PhoneNumber))
                    return Response.Fail("Full name, email, phone number, and password are required.");

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
                    Status = "Pending",      // pending until OTP verified
                    IsEmailVerified = false,
                    ProfileImage = null
                };
                SetTimestamps(user);
                _users.InsertOne(user);

                // Generate and store OTP
                string otp = EmailHelper.GenerateOtp();
                var token = new VerificationToken
                {
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    OtpCode = otp,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                    Used = false,
                    Purpose = "registration"
                };
                _verificationTokens.InsertOne(token);

                // Send OTPs
                new EmailHelper().SendOtpEmail(user.Email, otp);
                SmsHelper.SendOtp(user.PhoneNumber, otp);

                return Response.Success(null, "Registration successful. Please verify your email and phone using the OTP sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003b – VERIFY REGISTRATION OTP
        public Response VerifyRegistrationOtp(string email, string otpCode)
        {
            try
            {
                var token = _verificationTokens.Find(t => t.Email == email && t.OtpCode == otpCode && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.Purpose == "registration").FirstOrDefault();
                if (token == null) return Response.Fail("Invalid or expired OTP.");

                _verificationTokens.UpdateOne(t => t.Id == token.Id,
                    Builders<VerificationToken>.Update.Set(t => t.Used, true));

                _users.UpdateOne(u => u.Email == email,
                    Builders<UserModel>.Update
                        .Set(u => u.Status, "Active")
                        .Set(u => u.IsEmailVerified, true)
                        .Set(u => u.UpdatedAt, ToIsoString(DateTime.UtcNow)));

                return Response.Success(null, "Email and phone verified. You can now log in.");
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
                    user.RoleId
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
                    return Response.Success(new { token, existing.UserId, existing.FullName, existing.Email, existing.RoleName, existing.RoleId }, "Google login successful.");
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
                return Response.Success(new { token = tokenNew, newUser.UserId, newUser.FullName, newUser.Email, newUser.RoleName, newUser.RoleId }, "Google auto-registration successful.");
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

        // Helper
        private string GetUserEmailById(int userId)
        {
            var user = _users.Find(u => u.UserId == userId).FirstOrDefault();
            return user?.Email;
        }
    }
}