namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class NotificationRequestApi
    {
        /// <summary>Recipient user ID.</summary>
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public string RelatedBookingId { get; set; }
    }
}