using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PeerLearningAndTutorialSystem.Models
{
    /*
     * ╔══════════════════════════════════════════════════════════════════════╗
     * ║  RatingModel — Module 4: Rating & Analytics Dashboard             ║
     * ║  Collection : "Ratings"                                           ║
     * ║                                                                    ║
     * ║  Student rates a Tutor after a COMPLETED booking.                 ║
     * ║  FeedbackStatus lifecycle:                                         ║
     * ║    "Pending Approval" → "Approved" | "Rejected"  (Admin only)     ║
     * ║  On Approval: TutorProfile.AverageRating is recalculated.         ║
     * ╚══════════════════════════════════════════════════════════════════════╝
     */
    public class RatingModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>Auto-incremented integer identifier (via CounterHelper).</summary>
        public int RatingId { get; set; }

        /// <summary>Integer auto-increment BookingId of the completed booking.</summary>
        public int BookingId { get; set; }

        /// <summary>ObjectId of the TutorProfile being rated.</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string TutorProfileId { get; set; }

        /// <summary>Integer UserId of the tutor.</summary>
        public int TutorId { get; set; }

        /// <summary>Integer UserId of the student submitting the rating.</summary>
        public int StudentId { get; set; }

        /// <summary>Star rating: 1 – 5 (enforced by controller).</summary>
        public int Stars { get; set; }

        /// <summary>Optional written feedback (max 1000 characters).</summary>
        public string Feedback { get; set; }

        /// <summary>"Pending Approval" | "Approved" | "Rejected"</summary>
        public string FeedbackStatus { get; set; } = "Pending Approval";

        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }

    /*
     * ╔══════════════════════════════════════════════════════════════════════╗
     * ║  StudentEvaluationModel — Module 4                                ║
     * ║  Collection : "StudentEvaluations"                                ║
     * ║                                                                    ║
     * ║  Tutor rates a Student after a COMPLETED booking.                 ║
     * ║  AverageScore and Grade are auto-calculated on create/update.     ║
     * ║  Grade bands:                                                      ║
     * ║    4.7 – 5.0 → A+   4.5 – 4.7 → A   4.0 – 4.5 → B               ║
     * ║    3.5 – 4.0 → C   Below 3.5   → D/F                              ║
     * ╚══════════════════════════════════════════════════════════════════════╝
     */
    public class StudentEvaluationModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>Auto-incremented integer identifier.</summary>
        public int EvaluationId { get; set; }

        /// <summary>Integer auto-increment BookingId of the completed booking.</summary>
        public int BookingId { get; set; }

        /// <summary>ObjectId of the TutorProfile submitting the evaluation.</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string TutorProfileId { get; set; }

        /// <summary>Integer UserId of the tutor.</summary>
        public int TutorId { get; set; }

        /// <summary>Integer UserId of the student being evaluated.</summary>
        public int StudentId { get; set; }

        // ── Multi-factor scores (each 1.0 – 5.0) ──────────────────────────
        public decimal Attendance          { get; set; }
        public decimal Participation       { get; set; }
        public decimal Understanding       { get; set; }
        public decimal Behavior            { get; set; }
        public decimal AssignmentCompletion { get; set; }

        // ── Auto-calculated ───────────────────────────────────────────────
        /// <summary>Mean of the five factor scores. Calculated on write.</summary>
        public decimal AverageScore { get; set; }

        /// <summary>Grade derived from AverageScore. Calculated on write.</summary>
        public string Grade { get; set; }

        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}