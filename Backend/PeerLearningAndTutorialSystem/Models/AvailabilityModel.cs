using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace PeerLearningAndTutorialSystem.Models
{
    public class AvailabilityModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>ObjectId reference to TutorProfiles collection.</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string TutorProfileId { get; set; }

        /// <summary>Calendar date component (UTC midnight).</summary>
        public DateTime Date { get; set; }

        /// <summary>Full UTC datetime for the start of the slot.</summary>
        public DateTime StartTime { get; set; }

        /// <summary>Full UTC datetime for the end of the slot. Must be >= StartTime + 30 min.</summary>
        public DateTime EndTime { get; set; }

        /// <summary>"Free" | "Booked" | "Blocked"</summary>
        public string Status { get; set; } = "Free";

        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}