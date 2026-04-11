using System;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class AvailabilityRequestApi
    {
        public string Id { get; set; }
        public string TutorProfileId { get; set; }

        /// <summary>Calendar date of the slot.</summary>
        public DateTime Date { get; set; }

        /// <summary>Full UTC datetime for slot start.</summary>
        public DateTime StartTime { get; set; }

        /// <summary>Full UTC datetime for slot end. Must be >= StartTime + 30 min — enforced by controller.</summary>
        public DateTime EndTime { get; set; }

        /// <summary>Ignored on Create — controller forces "Free".</summary>
        public string Status { get; set; }
    }
}