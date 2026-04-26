namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class BookingRequestApi
    {
        /// <summary>Used for status-update operations (Accept / Decline / Cancel / Complete).</summary>
        public string BookingMongoId { get; set; }

        /// <summary>ObjectId of the chosen availability slot.</summary>
        public string AvailabilityId { get; set; }

        /// <summary>ObjectId of the tutor's profile.</summary>
        public string TutorProfileId { get; set; }

        /// <summary>User ID of the tutor.</summary>
        public int TutorId { get; set; }

        /// <summary>User ID of the student making the booking.</summary>
        public int StudentId { get; set; }

        public string SessionType { get; set; }
        public string Notes { get; set; }
        public System.Collections.Generic.List<GroupMemberModel> GroupMembers { get; set; }
    }
}