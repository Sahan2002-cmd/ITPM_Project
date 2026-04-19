using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Linq;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data-access for Ratings (Student→Tutor) and StudentEvaluations (Tutor→Student).
    ///
    /// Business invariants enforced here:
    ///   - A rating requires the linked Booking to have Status == "Completed".
    ///   - A booking can only be rated once by a student (duplicate guard).
    ///   - On rating approval, TutorProfile.AverageRating and TotalRatings are recalculated.
    ///   - Evaluation scores recalculate AverageScore + Grade and update UserModel.
    /// </summary>
    public class DARating : IRating
    {
        private readonly IMongoCollection<RatingModel>            _ratings;
        private readonly IMongoCollection<StudentEvaluationModel> _evaluations;
        private readonly IMongoCollection<BookingModel>           _bookings;
        private readonly IMongoCollection<TutorProfileModel>      _tutorProfiles;
        private readonly IMongoCollection<UserModel>              _users;

        public DARating()
        {
            var ctx        = new MongoDBContext();
            _ratings       = ctx.GetCollection<RatingModel>("Ratings");
            _evaluations   = ctx.GetCollection<StudentEvaluationModel>("StudentEvaluations");
            _bookings      = ctx.GetCollection<BookingModel>("Bookings");
            _tutorProfiles = ctx.GetCollection<TutorProfileModel>("TutorProfiles");
            _users         = ctx.GetCollection<UserModel>("Users");
        }

        private static string UtcNowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // ─── Grade helper ─────────────────────────────────────────────────────
        private static string CalculateGrade(decimal avg)
        {
            if (avg >= 4.7m) return "A+";
            if (avg >= 4.5m) return "A";
            if (avg >= 4.0m) return "B";
            if (avg >= 3.5m) return "C";
            return "D/F";
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – CREATE RATING  (Student → Tutor)
        //
        // Pre-conditions:
        //   A) Booking must exist and Status must be "Completed".
        //   B) Student must not have already rated this booking.
        // FeedbackStatus is always forced to "Pending Approval".
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateRating(RatingRequestApi request)
        {
            try
            {
                // A) Validate booking is Completed
                var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                if (booking == null)
                    return Response.Fail("Booking not found.");
                if (booking.Status != "Completed")
                    return Response.Fail("A rating can only be submitted for a completed session.");

                // B) Duplicate guard: one rating per student per booking
                if (_ratings.Find(r => r.BookingId == request.BookingId && r.StudentId == request.StudentId).Any())
                    return Response.Fail("You have already rated this session.");

                var rating = new RatingModel
                {
                    RatingId       = CounterHelper.GetNextSequence("ratingId"),
                    BookingId      = request.BookingId,
                    TutorProfileId = request.TutorProfileId,
                    TutorId        = request.TutorId,
                    StudentId      = request.StudentId,
                    Stars          = request.Stars,
                    Feedback       = request.Feedback?.Trim(),
                    FeedbackStatus = "Pending Approval",      // controller never trusts client
                    CreatedAt      = UtcNowIso(),
                    UpdatedAt      = UtcNowIso()
                };

                _ratings.InsertOne(rating);
                return Response.Success(rating, "Rating submitted. Pending admin approval.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – GET RATINGS BY TUTOR  (only Approved)
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetRatingsByTutor(string tutorProfileId)
        {
            try
            {
                var ratings = _ratings
                    .Find(r => r.TutorProfileId == tutorProfileId && r.FeedbackStatus == "Approved")
                    .SortByDescending(r => r.CreatedAt)
                    .ToList();
                return Response.Success(ratings);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – GET RATINGS BY STUDENT
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetRatingsByStudent(int studentId)
        {
            try
            {
                var ratings = _ratings
                    .Find(r => r.StudentId == studentId)
                    .SortByDescending(r => r.CreatedAt)
                    .ToList();
                return Response.Success(ratings);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 004 – GET PENDING FEEDBACK  (Admin moderation)
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetPendingFeedback()
        {
            try
            {
                var pending = _ratings
                    .Find(r => r.FeedbackStatus == "Pending Approval")
                    .SortBy(r => r.CreatedAt)
                    .ToList();
                return Response.Success(pending);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 005 – MODERATE FEEDBACK  (Admin: Approved | Rejected)
        //
        // On Approval:
        //   Recalculate TutorProfile.AverageRating from ALL Approved ratings
        //   for that tutor and update TotalRatings accordingly.
        // ═══════════════════════════════════════════════════════════════════════
        public Response ModerateFeedback(int ratingId, string newStatus)
        {
            try
            {
                if (newStatus != "Approved" && newStatus != "Rejected")
                    return Response.Fail("Status must be 'Approved' or 'Rejected'.");

                var rating = _ratings.Find(r => r.RatingId == ratingId).FirstOrDefault();
                if (rating == null)
                    return Response.Fail("Rating not found.");
                if (rating.FeedbackStatus == newStatus)
                    return Response.Fail($"Rating is already '{newStatus}'.");

                var statusUpdate = Builders<RatingModel>.Update
                    .Set(r => r.FeedbackStatus, newStatus)
                    .Set(r => r.UpdatedAt, UtcNowIso());
                _ratings.UpdateOne(r => r.RatingId == ratingId, statusUpdate);

                // Recalculate tutor's average if approving
                if (newStatus == "Approved")
                {
                    var approvedStars = _ratings
                        .Find(r => r.TutorProfileId == rating.TutorProfileId && r.FeedbackStatus == "Approved")
                        .ToList()
                        .Select(r => r.Stars)
                        .ToList();

                    int    total  = approvedStars.Count;
                    decimal avg   = total > 0
                        ? Math.Round((decimal)approvedStars.Sum() / total, 2)
                        : 0m;

                    var profileUpdate = Builders<TutorProfileModel>.Update
                        .Set(p => p.AverageRating, avg)
                        .Set(p => p.TotalRatings,  total)
                        .Set(p => p.UpdatedAt,     UtcNowIso());
                    _tutorProfiles.UpdateOne(p => p.Id == rating.TutorProfileId, profileUpdate);
                }

                return Response.Success(null, $"Feedback status updated to '{newStatus}'.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 006 – CREATE EVALUATION  (Tutor → Student)
        //
        // Pre-conditions:
        //   A) Booking must exist and Status must be "Completed".
        //   B) Tutor must not have already evaluated this booking.
        // Auto-calculates AverageScore + Grade and updates UserModel.
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateEvaluation(StudentEvaluationRequestApi request)
        {
            try
            {
                // A) Validate booking is Completed
                var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                if (booking == null)
                    return Response.Fail("Booking not found.");
                if (booking.Status != "Completed")
                    return Response.Fail("An evaluation can only be submitted for a completed session.");

                // B) Duplicate guard: one evaluation per tutor per booking
                if (_evaluations.Find(e => e.BookingId == request.BookingId && e.TutorId == request.TutorId).Any())
                    return Response.Fail("You have already submitted an evaluation for this session.");

                // Auto-calculate
                decimal avg   = Math.Round(
                    (request.Attendance + request.Participation + request.Understanding
                     + request.Behavior + request.AssignmentCompletion) / 5m, 2);
                string  grade = CalculateGrade(avg);

                var evaluation = new StudentEvaluationModel
                {
                    EvaluationId         = CounterHelper.GetNextSequence("evaluationId"),
                    BookingId            = request.BookingId,
                    TutorProfileId       = request.TutorProfileId,
                    TutorId              = request.TutorId,
                    StudentId            = request.StudentId,
                    Attendance           = request.Attendance,
                    Participation        = request.Participation,
                    Understanding        = request.Understanding,
                    Behavior             = request.Behavior,
                    AssignmentCompletion = request.AssignmentCompletion,
                    AverageScore         = avg,
                    Grade                = grade,
                    CreatedAt            = UtcNowIso(),
                    UpdatedAt            = UtcNowIso()
                };

                _evaluations.InsertOne(evaluation);

                // Update student's UserModel with latest score and grade
                var userUpdate = Builders<UserModel>.Update
                    .Set(u => u.PerformanceScore, avg)
                    .Set(u => u.PerformanceGrade, grade)
                    .Set(u => u.UpdatedAt,        UtcNowIso());
                _users.UpdateOne(u => u.UserId == request.StudentId, userUpdate);

                return Response.Success(evaluation, "Evaluation submitted successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 007 – GET EVALUATIONS BY STUDENT
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetEvaluationsByStudent(int studentId)
        {
            try
            {
                var evals = _evaluations
                    .Find(e => e.StudentId == studentId)
                    .SortByDescending(e => e.CreatedAt)
                    .ToList();
                return Response.Success(evals);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 008 – GET EVALUATIONS BY TUTOR
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetEvaluationsByTutor(int tutorId)
        {
            try
            {
                var evals = _evaluations
                    .Find(e => e.TutorId == tutorId)
                    .SortByDescending(e => e.CreatedAt)
                    .ToList();
                return Response.Success(evals);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 009 – GET ALL RATINGS  (Admin — all statuses)
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetAllRatings()
        {
            try
            {
                var all = _ratings
                    .Find(_ => true)
                    .SortByDescending(r => r.CreatedAt)
                    .ToList();
                return Response.Success(all);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 010 – UPDATE RATING  (Student edits their own Pending rating)
        // Only allowed while FeedbackStatus == "Pending Approval".
        // ═══════════════════════════════════════════════════════════════════════
        public Response UpdateRating(int ratingId, int callerId, UpdateRatingRequestApi request)
        {
            try
            {
                var rating = _ratings.Find(r => r.RatingId == ratingId).FirstOrDefault();
                if (rating == null)
                    return Response.Fail("Rating not found.");
                if (rating.StudentId != callerId)
                    return Response.Fail("You can only edit your own reviews.");
                if (rating.FeedbackStatus != "Pending Approval")
                    return Response.Fail("Only reviews that are still pending can be edited.");

                var update = Builders<RatingModel>.Update
                    .Set(r => r.Stars,    request.Stars)
                    .Set(r => r.Feedback, request.Feedback?.Trim())
                    .Set(r => r.UpdatedAt, UtcNowIso());

                _ratings.UpdateOne(r => r.RatingId == ratingId, update);

                var updated = _ratings.Find(r => r.RatingId == ratingId).FirstOrDefault();
                return Response.Success(updated, "Review updated successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}