using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PeerLearningAndTutorialSystem.Models
{
    /*
     * PaymentModel — referenced by DAAnalytics for revenue aggregation.
     * Collection: "Payments"
     */
    public class PaymentModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public int PaymentId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string BookingId { get; set; }

        public int StudentId { get; set; }
        public int TutorId  { get; set; }

        public decimal Amount { get; set; }

        /// <summary>"Pending" | "Completed" | "Refunded"</summary>
        public string Status { get; set; } = "Pending";

        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}