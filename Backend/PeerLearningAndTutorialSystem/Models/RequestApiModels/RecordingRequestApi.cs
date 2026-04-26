using System;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class RecordingRequestApi
    {
        public int BookingId { get; set; }
        public string Title { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        public string VideoUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public string Duration { get; set; }
    }
}
