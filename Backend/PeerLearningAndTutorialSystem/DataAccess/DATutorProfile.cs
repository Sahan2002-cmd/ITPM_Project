using MongoDB.Driver;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data-access implementation for TutorProfile documents stored in the "TutorProfiles" collection.
    /// Business-rule validations (email domain, hourly-rate range, forced status) are enforced by
    /// TutorProfileController before these methods are called.
    /// </summary>
    public class DATutorProfile : ITutorProfile
    {
        private readonly IMongoCollection<TutorProfileModel> _profiles;

        public DATutorProfile()
        {
            var ctx = new MongoDBContext();
            _profiles = ctx.GetCollection<TutorProfileModel>("TutorProfiles");
        }

        // ─── helpers ────────────────────────────────────────────────────────────
        private static string UtcNowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – CREATE PROFILE
        // Status is pre-forced to "Pending Verification" by the controller.
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateProfile(TutorProfileRequestApi request)
        {
            try
            {
                // Guard: one profile per user
                if (_profiles.Find(p => p.UserId == request.UserId).Any())
                    return Response.Fail("A tutor profile already exists for this user.");

                var profile = new TutorProfileModel
                {
                    UserId            = request.UserId,
                    Email             = request.Email?.ToLower().Trim(),
                    FullName          = request.FullName?.Trim(),
                    Bio               = request.Bio?.Trim(),
                    SubjectsTaught    = request.SubjectsTaught  ?? new List<string>(),
                    Qualifications    = request.Qualifications  ?? new List<string>(),
                    YearsOfExperience = request.YearsOfExperience,
                    HourlyRate        = request.HourlyRate,
                    // Status is ALWAYS set here, never trusting the request value
                    Status            = "Pending Verification",
                    IsVerified        = false,
                    CreatedAt         = UtcNowIso(),
                    UpdatedAt         = UtcNowIso()
                };

                _profiles.InsertOne(profile);
                return Response.Success(profile, "Tutor profile created. Pending admin verification.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – GET ALL ACTIVE / VERIFIED
        // Returns every profile whose Status == "Active".
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetAllActiveVerified()
        {
            try
            {
                var filter = Builders<TutorProfileModel>.Filter.Eq(p => p.Status, "Active");
                var profiles = _profiles.Find(filter).SortBy(p => p.FullName).ToList();
                return Response.Success(profiles);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – GET BY ID (ObjectId string)
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetById(string id)
        {
            try
            {
                var profile = _profiles.Find(p => p.Id == id).FirstOrDefault();
                if (profile == null) return Response.Fail("Tutor profile not found.");
                return Response.Success(profile);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003b – GET BY USER ID (integer UserId)
        // Used by the tutor themselves to fetch their own profile.
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetByUserId(int userId)
        {
            try
            {
                var profile = _profiles.Find(p => p.UserId == userId).FirstOrDefault();
                if (profile == null) return Response.Fail("Tutor profile not found.");
                return Response.Success(profile);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 004 – UPDATE MUTABLE FIELDS
        // Email, Status, and IsVerified are NOT updatable through this method;
        // those are controlled through dedicated admin/verification flows.
        // ═══════════════════════════════════════════════════════════════════════
        public Response UpdateProfile(string id, TutorProfileRequestApi request)
        {
            try
            {
                var existing = _profiles.Find(p => p.Id == id).FirstOrDefault();
                if (existing == null) return Response.Fail("Tutor profile not found.");

                var update = Builders<TutorProfileModel>.Update
                    .Set(p => p.FullName,
                         !string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : existing.FullName)
                    .Set(p => p.Bio,
                         request.Bio != null ? request.Bio.Trim() : existing.Bio)
                    .Set(p => p.SubjectsTaught,
                         request.SubjectsTaught  ?? existing.SubjectsTaught)
                    .Set(p => p.Qualifications,
                         request.Qualifications  ?? existing.Qualifications)
                    .Set(p => p.YearsOfExperience,
                         request.YearsOfExperience > 0 ? request.YearsOfExperience : existing.YearsOfExperience)
                    .Set(p => p.HourlyRate,
                         request.HourlyRate > 0 ? request.HourlyRate : existing.HourlyRate)
                    .Set(p => p.UpdatedAt, UtcNowIso());

                _profiles.UpdateOne(p => p.Id == id, update);
                return Response.Success(null, "Tutor profile updated successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 005 – SOFT DELETE  (Status → "Inactive" | "Suspended")
        // Does NOT physically remove the document.
        // ═══════════════════════════════════════════════════════════════════════
        public Response SoftDelete(string id, string newStatus)
        {
            try
            {
                if (newStatus != "Inactive" && newStatus != "Suspended")
                    return Response.Fail("Target status must be 'Inactive' or 'Suspended'.");

                var existing = _profiles.Find(p => p.Id == id).FirstOrDefault();
                if (existing == null) return Response.Fail("Tutor profile not found.");

                if (existing.Status == newStatus)
                    return Response.Fail($"Profile is already '{newStatus}'.");

                var update = Builders<TutorProfileModel>.Update
                    .Set(p => p.Status,    newStatus)
                    .Set(p => p.UpdatedAt, UtcNowIso());

                _profiles.UpdateOne(p => p.Id == id, update);
                return Response.Success(null, $"Tutor profile marked as '{newStatus}'.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}
