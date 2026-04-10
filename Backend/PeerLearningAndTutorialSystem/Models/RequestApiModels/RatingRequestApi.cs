namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    /// <summary>Request body for POST /api/rating/create — Student rates Tutor.</summary>
    public class RatingRequestApi
    {
        public int    BookingId      { get; set; }  // integer auto-increment BookingId
        public string TutorProfileId { get; set; }  // ObjectId string
        public int    TutorId        { get; set; }
        public int    StudentId      { get; set; }

        /// <summary>1 – 5 (validated by controller).</summary>
        public int    Stars          { get; set; }

        /// <summary>Optional feedback text (max 1000 chars).</summary>
        public string Feedback       { get; set; }
    }

    /// <summary>Request body for PUT /api/rating/update/{ratingId} — Student updates a Pending rating.</summary>
    public class UpdateRatingRequestApi
    {
        /// <summary>1 – 5 (validated by controller).</summary>
        public int    Stars    { get; set; }

        /// <summary>Optional feedback text (max 1000 chars).</summary>
        public string Feedback { get; set; }
    }

    /// <summary>Request body for POST /api/rating/evaluate — Tutor evaluates Student.</summary>
    public class StudentEvaluationRequestApi
    {
        public int     BookingId      { get; set; }  // integer auto-increment BookingId
        public string  TutorProfileId { get; set; }  // ObjectId string
        public int     TutorId        { get; set; }
        public int     StudentId      { get; set; }

        /// <summary>Each factor: 1.0 – 5.0 (validated by controller).</summary>
        public decimal Attendance           { get; set; }
        public decimal Participation        { get; set; }
        public decimal Understanding        { get; set; }
        public decimal Behavior             { get; set; }
        public decimal AssignmentCompletion { get; set; }
    }
}