using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace PeerLearningAndTutorialSystem.Models
{
    public class BookingModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>Auto-incremented integer ID (via CounterHelper).</summary>
        public int BookingId { get; set; }

        /// <summary>ObjectId reference to the Availability collection — the booked slot.</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AvailabilityId { get; set; }

        /// <summary>ObjectId reference to the TutorProfiles collection.</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string TutorProfileId { get; set; }

        /// <summary>Integer User ID of the tutor (from Users collection).</summary>
        public int TutorId { get; set; }

        /// <summary>Integer User ID of the student (from Users collection).</summary>
        public int StudentId { get; set; }

        /// <summary>Pending | Confirmed | Declined | Cancelled | Completed</summary>
        public string Status { get; set; } = "Pending";

        /// <summary>Copied from the availability slot at booking time for quick access.</summary>
        public DateTime SessionDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}