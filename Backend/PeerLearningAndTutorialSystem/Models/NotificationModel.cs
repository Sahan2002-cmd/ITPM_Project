using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace PeerLearningAndTutorialSystem.Models
{
    public class NotificationModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>Auto-incremented integer ID (via CounterHelper).</summary>
        public int NotificationId { get; set; }

        /// <summary>Integer User ID of the recipient.</summary>
        public int UserId { get; set; }

        /// <summary>Short heading, e.g. "Booking Confirmed".</summary>
        public string Title { get; set; }

        /// <summary>Full notification body.</summary>
        public string Message { get; set; }

        /// <summary>"BookingAccepted" | "BookingDeclined" | "BookingCancelled" | "General"</summary>
        public string Type { get; set; }

        /// <summary>ObjectId reference to the related Booking document (optional).</summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string RelatedBookingId { get; set; }

        public bool IsRead { get; set; } = false;
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}