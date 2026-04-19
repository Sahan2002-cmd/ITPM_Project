using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    /*
     * ╔══════════════════════════════════════════════════════════════════════╗
     * ║  IRating — Module 4: Rating & Analytics Dashboard                 ║
     * ║  Covers Student→Tutor ratings AND Tutor→Student evaluations.      ║
     * ╚══════════════════════════════════════════════════════════════════════╝
     */
    public interface IRating
    {
        // ── Student → Tutor Ratings ───────────────────────────────────────────────

        /// <summary>Submit a star rating for a completed booking. Booking must be Completed.</summary>
        Response CreateRating(RatingRequestApi request);

        /// <summary>Get all approved ratings for a specific tutor (public-facing).</summary>
        Response GetRatingsByTutor(string tutorProfileId);

        /// <summary>Get all ratings submitted by a specific student.</summary>
        Response GetRatingsByStudent(int studentId);

        /// <summary>Admin: get all ratings with FeedbackStatus == "Pending Approval".</summary>
        Response GetPendingFeedback();

        /// <summary>
        /// Admin: update FeedbackStatus to "Approved" or "Rejected".
        /// On approval, TutorProfile.AverageRating is recalculated.
        /// </summary>
        Response ModerateFeedback(int ratingId, string newStatus);

        /// <summary>
        /// Student: update Stars and/or Feedback on their own Pending rating.
        /// Rejected if the rating has already been Approved or Rejected.
        /// </summary>
        Response UpdateRating(int ratingId, int callerId, UpdateRatingRequestApi request);

        /// <summary>Admin: get all ratings regardless of status.</summary>
        Response GetAllRatings();

        // ── Tutor → Student Evaluations ────────────────────────────────────────

        /// <summary>Tutor submits a multi-factor evaluation for a student. Grade is auto-calculated.</summary>
        Response CreateEvaluation(StudentEvaluationRequestApi request);

        /// <summary>Get all evaluations for a specific student.</summary>
        Response GetEvaluationsByStudent(int studentId);

        /// <summary>Get all evaluations submitted by a specific tutor.</summary>
        Response GetEvaluationsByTutor(int tutorId);
    }
}
