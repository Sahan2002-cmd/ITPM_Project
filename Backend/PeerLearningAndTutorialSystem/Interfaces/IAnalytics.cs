using PeerLearningAndTutorialSystem.Models;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    /*
     * ╔══════════════════════════════════════════════════════════════════════╗
     * ║  IAnalytics — Module 4: Rating & Analytics Dashboard              ║
     * ║  All methods return pre-aggregated read-only data.                 ║
     * ╚══════════════════════════════════════════════════════════════════════╝
     */
    public interface IAnalytics
    {
        /// <summary>High-level KPI summary: sessions, revenue, active users.</summary>
        Response GetSummary();

        /// <summary>Booking count grouped by subject — for popularity chart.</summary>
        Response GetSubjectPopularity();

        /// <summary>Top N tutors ordered by AverageRating descending.</summary>
        Response GetTopRatedTutors(int topN);

        /// <summary>Per-student session count and hours — engagement metric.</summary>
        Response GetStudentEngagement();
    }
}
