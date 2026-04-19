using MongoDB.Driver;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Read-only aggregation layer for the Analytics Dashboard.
    /// All queries run against MongoDB without modifying any documents.
    /// </summary>
    public class DAAnalytics : IAnalytics
    {
        private readonly IMongoCollection<BookingModel>      _bookings;
        private readonly IMongoCollection<PaymentModel>      _payments;
        private readonly IMongoCollection<TutorProfileModel> _tutorProfiles;
        private readonly IMongoCollection<UserModel>         _users;

        public DAAnalytics()
        {
            var ctx        = new MongoDBContext();
            _bookings      = ctx.GetCollection<BookingModel>("Bookings");
            _payments      = ctx.GetCollection<PaymentModel>("Payments");
            _tutorProfiles = ctx.GetCollection<TutorProfileModel>("TutorProfiles");
            _users         = ctx.GetCollection<UserModel>("Users");
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – SUMMARY  (KPI card data)
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetSummary()
        {
            try
            {
                int     completedSessions = (int)_bookings
                    .CountDocuments(b => b.Status == "Completed");

                decimal totalRevenue = _payments
                    .Find(p => p.Status == "Completed")
                    .ToList()
                    .Sum(p => p.Amount);

                int activeStudents = (int)_users
                    .CountDocuments(u => u.RoleName == "Student" && u.Status == "Active");

                int activeTutors = (int)_tutorProfiles
                    .CountDocuments(t => t.Status == "Active");

                var summary = new AnalyticsSummaryModel
                {
                    TotalCompletedSessions = completedSessions,
                    TotalRevenue           = totalRevenue,
                    TotalActiveStudents    = activeStudents,
                    TotalActiveTutors      = activeTutors
                };

                return Response.Success(summary);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – SUBJECT POPULARITY
        // Groups Bookings by TutorProfileId, joins with TutorProfile.SubjectsTaught,
        // then counts bookings per subject across all completed sessions.
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetSubjectPopularity()
        {
            try
            {
                // Fetch all completed bookings and the active tutor profiles in-memory.
                // For large datasets a $lookup aggregation pipeline is preferred; this
                // approach is appropriate for the expected platform size.
                var completedBookings = _bookings
                    .Find(b => b.Status == "Completed")
                    .ToList();

                var profileMap = _tutorProfiles
                    .Find(_ => true)
                    .ToList()
                    .ToDictionary(p => p.Id, p => p.SubjectsTaught ?? new List<string>());

                var countMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

                foreach (var booking in completedBookings)
                {
                    if (!profileMap.TryGetValue(booking.TutorProfileId, out var subjects)) continue;
                    foreach (var subject in subjects)
                    {
                        string key = subject.Trim();
                        if (!countMap.ContainsKey(key)) countMap[key] = 0;
                        countMap[key]++;
                    }
                }

                var result = countMap
                    .Select(kv => new SubjectPopularityModel { Subject = kv.Key, BookingCount = kv.Value })
                    .OrderByDescending(x => x.BookingCount)
                    .ToList();

                return Response.Success(result);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – TOP RATED TUTORS LEADERBOARD
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetTopRatedTutors(int topN)
        {
            try
            {
                if (topN <= 0) topN = 10;

                var tutors = _tutorProfiles
                    .Find(t => t.Status == "Active" && t.TotalRatings > 0)
                    .SortByDescending(t => t.AverageRating)
                    .Limit(topN)
                    .ToList();

                // Enrich with completed-session counts
                var result = tutors.Select(t =>
                {
                    int sessions = (int)_bookings.CountDocuments(
                        b => b.TutorProfileId == t.Id && b.Status == "Completed");

                    return new TopRatedTutorModel
                    {
                        TutorProfileId    = t.Id,
                        TutorId           = t.UserId,
                        FullName          = t.FullName,
                        AverageRating     = t.AverageRating,
                        TotalRatings      = t.TotalRatings,
                        CompletedSessions = sessions
                    };
                }).ToList();

                return Response.Success(result);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 004 – STUDENT ENGAGEMENT
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetStudentEngagement()
        {
            try
            {
                var completedBookings = _bookings
                    .Find(b => b.Status == "Completed")
                    .ToList();

                // Build a lookup of studentId → User.FullName
                var userNames = _users
                    .Find(u => u.RoleName == "Student")
                    .ToList()
                    .ToDictionary(u => u.UserId, u => u.FullName ?? "Unknown");

                var grouped = completedBookings
                    .GroupBy(b => b.StudentId)
                    .Select(g =>
                    {
                        double totalHours = g.Sum(b =>
                            (b.EndTime - b.StartTime).TotalHours);
                        int    count      = g.Count();

                        return new StudentEngagementModel
                        {
                            StudentId             = g.Key,
                            FullName              = userNames.TryGetValue(g.Key, out var n) ? n : "Unknown",
                            TotalSessions         = count,
                            TotalHours            = Math.Round(totalHours, 2),
                            AverageHoursPerSession = count > 0
                                ? Math.Round(totalHours / count, 2)
                                : 0
                        };
                    })
                    .OrderByDescending(e => e.TotalSessions)
                    .ToList();

                return Response.Success(grouped);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}