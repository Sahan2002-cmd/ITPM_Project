using MongoDB.Bson;
using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem
{
    /// <summary>
    /// Seeds Module 1 (TutorProfile + Availability) and Module 2 (Booking + Notifications).
    ///
    /// Data inserted:
    ///   USERS          — 1 Admin, 2 Tutors (Kasun, Nimesha), 2 Students (Alex, Maya)
    ///   TUTOR PROFILES — 1 per tutor, Status = "Active", IsVerified = true
    ///   AVAILABILITY   — 5 future slots per tutor (10 total), all "Free"
    ///   BOOKINGS       — 3 bookings exercising Confirmed / Pending / Declined states
    ///   NOTIFICATIONS  — 2 records (BookingAccepted + BookingDeclined) for Alex
    ///
    /// Idempotent: runs ONLY when the Users collection is empty.
    /// Call from Application_Start after all BsonClassMaps are registered.
    /// </summary>
    public static class SeedData
    {
        // Sri Lanka Standard Time — UTC+5:30 (no DST)
        private static readonly TimeZoneInfo Slst =
            TimeZoneInfo.CreateCustomTimeZone("SLST", TimeSpan.FromHours(5.5), "Sri Lanka Standard Time", "Sri Lanka Standard Time");

        /// <summary>Current time in SLST, stored as a UTC ISO-8601 string for MongoDB.</summary>
        private static string UtcNow() =>
            DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        /// <summary>Today's midnight in SLST expressed as UTC DateTime.</summary>
        private static DateTime SlstTodayUtc()
        {
            var nowSlst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Slst);
            var midnightSlst = nowSlst.Date;  // 00:00:00 SLST
            return TimeZoneInfo.ConvertTimeToUtc(midnightSlst, Slst);
        }

        /// <summary>
        /// Build a UTC DateTime that represents a specific clock time on a specific
        /// SLST calendar date (date already expressed as a UTC midnight value from SlstTodayUtc).
        /// </summary>
        private static DateTime SlstTime(DateTime slstMidnightUtc, int hour, int minute)
        {
            // Convert stored UTC-midnight back to SLST date, add clock time, then back to UTC
            var slstDate = TimeZoneInfo.ConvertTimeFromUtc(slstMidnightUtc, Slst).Date;
            var slstDateTime = slstDate.AddHours(hour).AddMinutes(minute);
            return TimeZoneInfo.ConvertTimeToUtc(slstDateTime, Slst);
        }

        public static void RunIfEmpty()
        {
            try
            {
                var ctx      = new MongoDBContext();
                var users    = ctx.GetCollection<UserModel>("Users");
                var profiles = ctx.GetCollection<TutorProfileModel>("TutorProfiles");

                // ── Idempotent guard ─────────────────────────────────────────────
                // Guard on TutorProfiles (not Users) so existing users are preserved.
                if (profiles.Find(_ => true).Any())
                {
                    System.Diagnostics.Debug.WriteLine("[SEED] TutorProfiles already exist — skipping seed.");
                    return;
                }

                System.Diagnostics.Debug.WriteLine("[SEED] No TutorProfiles found. Starting Module 1/2 seed...");

                // ════════════════════════════════════════════════════════════════
                // STEP 1 — USERS
                // Passwords: Admin@123 / Tutor@123 / Student@123
                // ════════════════════════════════════════════════════════════════
                var admin = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),   // 1
                    FullName = "Admin User",
                    Email = "admin@peerlearn.com",
                    PhoneNumber = "+94771000001",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 12),
                    RoleId = 1, RoleName = "Admin",
                    Status = "Active", IsEmailVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                var kasun = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),   // 2
                    FullName = "Kasun Perera",
                    Email = "kasun.tutor@email.com",
                    PhoneNumber = "+94771000002",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tutor@123", 12),
                    RoleId = 2, RoleName = "Tutor",
                    Status = "Active", IsEmailVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                var nimesha = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),   // 3
                    FullName = "Nimesha Silva",
                    Email = "nimesha.tutor@email.com",
                    PhoneNumber = "+94771000003",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tutor@123", 12),
                    RoleId = 2, RoleName = "Tutor",
                    Status = "Active", IsEmailVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                var alex = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),   // 4
                    FullName = "Alex Fernando",
                    Email = "alex.student@email.com",
                    PhoneNumber = "+94771000004",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123", 12),
                    RoleId = 3, RoleName = "Student",
                    Status = "Active", IsEmailVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                var maya = new UserModel
                {
                    UserId = CounterHelper.GetNextSequence("userId"),   // 5
                    FullName = "Maya Bandara",
                    Email = "maya.student@email.com",
                    PhoneNumber = "+94771000005",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123", 12),
                    RoleId = 3, RoleName = "Student",
                    Status = "Active", IsEmailVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                users.InsertMany(new[] { admin, kasun, nimesha, alex, maya });
                System.Diagnostics.Debug.WriteLine(
                    $"[SEED] ✓ 5 users inserted (IDs: {admin.UserId}, {kasun.UserId}, {nimesha.UserId}, {alex.UserId}, {maya.UserId}).");

                // ════════════════════════════════════════════════════════════════
                // STEP 2 — TUTOR PROFILES  (Status = "Active", bypassing Pending flow)
                // ════════════════════════════════════════════════════════════════
                var kasunProfile = new TutorProfileModel
                {
                    UserId = kasun.UserId,
                    Email = kasun.Email,
                    FullName = kasun.FullName,
                    Bio = "Senior Mathematics and Physics tutor with 6 years of undergraduate teaching experience.",
                    SubjectsTaught = new List<string> { "Mathematics", "Physics", "Statistics" },
                    Qualifications = new List<string> { "B.Sc. Physics – University of Colombo", "Diploma in Teaching" },
                    YearsOfExperience = 6,
                    HourlyRate = 1500,
                    Status = "Active",
                    IsVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                var nimeshaProfile = new TutorProfileModel
                {
                    UserId = nimesha.UserId,
                    Email = nimesha.Email,
                    FullName = nimesha.FullName,
                    Bio = "Biology and English specialist helping students ace A/L and university exams.",
                    SubjectsTaught = new List<string> { "Biology", "English", "Chemistry" },
                    Qualifications = new List<string> { "B.Sc. Biology – University of Peradeniya", "TESOL Certificate" },
                    YearsOfExperience = 4,
                    HourlyRate = 2000,
                    Status = "Active",
                    IsVerified = true,
                    CreatedAt = UtcNow(), UpdatedAt = UtcNow()
                };

                // InsertMany populates .Id (ObjectId) on each object via the driver
                profiles.InsertMany(new[] { kasunProfile, nimeshaProfile });
                string kasunProfileId   = kasunProfile.Id;
                string nimeshaProfileId = nimeshaProfile.Id;
                System.Diagnostics.Debug.WriteLine(
                    $"[SEED] ✓ 2 tutor profiles inserted. Kasun={kasunProfileId}, Nimesha={nimeshaProfileId}");

                // ════════════════════════════════════════════════════════════════
                // STEP 3 — AVAILABILITY SLOTS  (all future, Status = "Free" by default)
                //
                // Kasun  — 5 slots over the next 3 days
                // Nimesha — 5 slots over the next 4 days
                // ════════════════════════════════════════════════════════════════
                var slots = ctx.GetCollection<AvailabilityModel>("Availability");

                // Dates are SLST midnight values converted to UTC
                var tomorrow = SlstTodayUtc().AddDays(1);
                var day2     = SlstTodayUtc().AddDays(2);
                var day3     = SlstTodayUtc().AddDays(3);
                var day4     = SlstTodayUtc().AddDays(4);

                // Kasun's slots
                var kasunSlot1 = MakeSlot(kasunProfileId, tomorrow, 9,  0, 10, 30);   // will become "Booked"
                var kasunSlot2 = MakeSlot(kasunProfileId, tomorrow, 13, 0, 14, 30);   // will become "Declined" booking → stays Free
                var kasunSlot3 = MakeSlot(kasunProfileId, day2,    9,  0, 10, 30);
                var kasunSlot4 = MakeSlot(kasunProfileId, day2,    14, 0, 15, 30);
                var kasunSlot5 = MakeSlot(kasunProfileId, day3,    10, 0, 11, 30);

                // Nimesha's slots
                var nimeshaSlot1 = MakeSlot(nimeshaProfileId, tomorrow, 10, 0, 11, 30);  // will have Pending booking
                var nimeshaSlot2 = MakeSlot(nimeshaProfileId, tomorrow, 14, 0, 15, 30);
                var nimeshaSlot3 = MakeSlot(nimeshaProfileId, day2,    10, 0, 12,  0);
                var nimeshaSlot4 = MakeSlot(nimeshaProfileId, day3,    9,  0, 10, 30);
                var nimeshaSlot5 = MakeSlot(nimeshaProfileId, day4,    15, 0, 16, 30);

                slots.InsertMany(new[]
                {
                    kasunSlot1, kasunSlot2, kasunSlot3, kasunSlot4, kasunSlot5,
                    nimeshaSlot1, nimeshaSlot2, nimeshaSlot3, nimeshaSlot4, nimeshaSlot5
                });
                System.Diagnostics.Debug.WriteLine("[SEED] ✓ 10 availability slots inserted.");

                // ════════════════════════════════════════════════════════════════
                // STEP 4 — BOOKINGS
                //
                // Booking 1: Alex books KasunSlot1  → Confirmed  (slot → "Booked")
                // Booking 2: Maya books NimeshaSlot1 → Pending   (slot stays "Free")
                // Booking 3: Alex books KasunSlot2  → Declined   (slot stays "Free")
                // ════════════════════════════════════════════════════════════════
                var bookingsColl = ctx.GetCollection<BookingModel>("Bookings");

                // Pre-generate ObjectIds so notifications can reference them
                // (BookingId is the _id in MongoDB; Id is a regular ObjectId field)
                string booking1ObjId = ObjectId.GenerateNewId().ToString();
                string booking2ObjId = ObjectId.GenerateNewId().ToString();
                string booking3ObjId = ObjectId.GenerateNewId().ToString();

                var booking1 = new BookingModel
                {
                    Id             = booking1ObjId,
                    BookingId      = CounterHelper.GetNextSequence("bookingId"),   // 1
                    AvailabilityId = kasunSlot1.Id,
                    TutorProfileId = kasunProfileId,
                    TutorId        = kasun.UserId,
                    StudentId      = alex.UserId,
                    Status         = "Confirmed",
                    SessionDate    = kasunSlot1.StartTime.Date,
                    StartTime      = kasunSlot1.StartTime,
                    EndTime        = kasunSlot1.EndTime,
                    CreatedAt      = UtcNow(), UpdatedAt = UtcNow()
                };

                var booking2 = new BookingModel
                {
                    Id             = booking2ObjId,
                    BookingId      = CounterHelper.GetNextSequence("bookingId"),   // 2
                    AvailabilityId = nimeshaSlot1.Id,
                    TutorProfileId = nimeshaProfileId,
                    TutorId        = nimesha.UserId,
                    StudentId      = maya.UserId,
                    Status         = "Pending",
                    SessionDate    = nimeshaSlot1.StartTime.Date,
                    StartTime      = nimeshaSlot1.StartTime,
                    EndTime        = nimeshaSlot1.EndTime,
                    CreatedAt      = UtcNow(), UpdatedAt = UtcNow()
                };

                var booking3 = new BookingModel
                {
                    Id             = booking3ObjId,
                    BookingId      = CounterHelper.GetNextSequence("bookingId"),   // 3
                    AvailabilityId = kasunSlot2.Id,
                    TutorProfileId = kasunProfileId,
                    TutorId        = kasun.UserId,
                    StudentId      = alex.UserId,
                    Status         = "Declined",
                    SessionDate    = kasunSlot2.StartTime.Date,
                    StartTime      = kasunSlot2.StartTime,
                    EndTime        = kasunSlot2.EndTime,
                    CreatedAt      = UtcNow(), UpdatedAt = UtcNow()
                };

                bookingsColl.InsertMany(new[] { booking1, booking2, booking3 });

                // Lock KasunSlot1 — BookingAccepted (Confirmed booking)
                slots.UpdateOne(
                    s => s.Id == kasunSlot1.Id,
                    Builders<AvailabilityModel>.Update
                        .Set(s => s.Status, "Booked")
                        .Set(s => s.UpdatedAt, UtcNow()));

                // kasunSlot2 remains "Free" — tutor declined, slot is rebook-able
                // nimeshaSlot1 remains "Free" — booking is still Pending

                System.Diagnostics.Debug.WriteLine(
                    $"[SEED] ✓ 3 bookings inserted (IDs: {booking1.BookingId}, {booking2.BookingId}, {booking3.BookingId})." +
                    $" KasunSlot1 set to 'Booked'.");

                // ════════════════════════════════════════════════════════════════
                // STEP 5 — NOTIFICATIONS
                //
                // Notify Alex: Booking 1 confirmed by Kasun
                // Notify Alex: Booking 3 declined by Kasun
                // ════════════════════════════════════════════════════════════════
                var notifColl = ctx.GetCollection<NotificationModel>("Notifications");

                var notif1 = new NotificationModel
                {
                    NotificationId   = CounterHelper.GetNextSequence("notificationId"),   // 1
                    UserId           = alex.UserId,
                    Title            = "Booking Confirmed",
                    Message          = $"Your session with {kasun.FullName} on {TimeZoneInfo.ConvertTimeFromUtc(kasunSlot1.StartTime, Slst):dd MMM yyyy} at {TimeZoneInfo.ConvertTimeFromUtc(kasunSlot1.StartTime, Slst):HH:mm} SLST has been confirmed.",
                    Type             = "BookingAccepted",
                    RelatedBookingId = booking1ObjId,
                    IsRead           = false,
                    CreatedAt        = UtcNow(), UpdatedAt = UtcNow()
                };

                var notif2 = new NotificationModel
                {
                    NotificationId   = CounterHelper.GetNextSequence("notificationId"),   // 2
                    UserId           = alex.UserId,
                    Title            = "Booking Declined",
                    Message          = $"Your booking request with {kasun.FullName} on {TimeZoneInfo.ConvertTimeFromUtc(kasunSlot2.StartTime, Slst):dd MMM yyyy} at {TimeZoneInfo.ConvertTimeFromUtc(kasunSlot2.StartTime, Slst):HH:mm} SLST was declined. The slot is now available again.",
                    Type             = "BookingDeclined",
                    RelatedBookingId = booking3ObjId,
                    IsRead           = false,
                    CreatedAt        = UtcNow(), UpdatedAt = UtcNow()
                };

                notifColl.InsertMany(new[] { notif1, notif2 });
                System.Diagnostics.Debug.WriteLine("[SEED] ✓ 2 notifications inserted.");

                System.Diagnostics.Debug.WriteLine("[SEED] ✅ Seed completed successfully.");
                System.Diagnostics.Debug.WriteLine("[SEED] ─────────────────────────────────────────────────────");
                System.Diagnostics.Debug.WriteLine("[SEED] Test credentials:");
                System.Diagnostics.Debug.WriteLine("[SEED]   admin@peerlearn.com       / Admin@123   (Admin)");
                System.Diagnostics.Debug.WriteLine("[SEED]   kasun.tutor@email.com     / Tutor@123   (Tutor)");
                System.Diagnostics.Debug.WriteLine("[SEED]   nimesha.tutor@email.com   / Tutor@123   (Tutor)");
                System.Diagnostics.Debug.WriteLine("[SEED]   alex.student@email.com    / Student@123 (Student)");
                System.Diagnostics.Debug.WriteLine("[SEED]   maya.student@email.com    / Student@123 (Student)");
                System.Diagnostics.Debug.WriteLine("[SEED] ─────────────────────────────────────────────────────");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SEED] ❌ ERROR: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"[SEED] Stack: {ex.StackTrace}");
            }
        }

        // ── Factory helper — builds an AvailabilityModel from date + hour/min components ──
        /// <summary>
        /// date  — UTC value from SlstTodayUtc().AddDays(n) (represents SLST midnight).
        /// hour/min — clock time in SLST (e.g. 9, 0 = 09:00 SLST).
        /// StartTime/EndTime stored in MongoDB are UTC equivalents.
        /// </summary>
        private static AvailabilityModel MakeSlot(
            string tutorProfileId,
            DateTime slstMidnightUtc,
            int startHour, int startMin,
            int endHour,   int endMin)
        {
            var start = SlstTime(slstMidnightUtc, startHour, startMin);
            var end   = SlstTime(slstMidnightUtc, endHour,   endMin);
            return new AvailabilityModel
            {
                TutorProfileId = tutorProfileId,
                Date           = slstMidnightUtc,   // stored as UTC midnight of that SLST day
                StartTime      = start,
                EndTime        = end,
                Status         = "Free",
                CreatedAt      = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                UpdatedAt      = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            };
        }
    }
}
