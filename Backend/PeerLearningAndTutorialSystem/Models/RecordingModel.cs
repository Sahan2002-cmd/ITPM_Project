using System;

namespace PeerLearningAndTutorialSystem.Models
{
    public class RecordingModel
    {
        public string Id { get; set; }
        public int BookingId { get; set; }
        public int TutorId { get; set; }
        public string Title { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        public string VideoUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public string Duration { get; set; }
        public string CreatedAt { get; set; }
    }
}
