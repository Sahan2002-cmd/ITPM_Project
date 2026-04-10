using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem.Models
{
    /*
     * ╔══════════════════════════════════════════════════════════════════════╗
     * ║  AnalyticsModel — Module 4: Rating & Analytics Dashboard          ║
     * ║                                                                    ║
     * ║  NOT a MongoDB collection. These are response-only POCOs used      ║
     * ║  to shape the aggregated data returned by DAAnalytics.            ║
     * ╚══════════════════════════════════════════════════════════════════════╝
     */

    /// <summary>Top-level dashboard summary returned by GET /api/analytics/summary.</summary>
    public class AnalyticsSummaryModel
    {
        public int    TotalCompletedSessions { get; set; }
        public decimal TotalRevenue           { get; set; }
        public int    TotalActiveStudents     { get; set; }
        public int    TotalActiveTutors       { get; set; }
    }

    /// <summary>Number of bookings per subject — for the subject popularity chart.</summary>
    public class SubjectPopularityModel
    {
        public string Subject      { get; set; }
        public int    BookingCount { get; set; }
    }

    /// <summary>Tutor leaderboard entry — top-rated tutors.</summary>
    public class TopRatedTutorModel
    {
        public string  TutorProfileId { get; set; }
        public int     TutorId        { get; set; }
        public string  FullName       { get; set; }
        public decimal AverageRating  { get; set; }
        public int     TotalRatings   { get; set; }
        public int     CompletedSessions { get; set; }
    }

    /// <summary>Per-student engagement summary.</summary>
    public class StudentEngagementModel
    {
        public int     StudentId       { get; set; }
        public string  FullName        { get; set; }
        public int     TotalSessions   { get; set; }
        public double  AverageHoursPerSession { get; set; }
        public double  TotalHours      { get; set; }
    }
}