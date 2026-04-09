using MongoDB.Bson;
using System;

namespace PeerLearningAndTutorialSystem.Models
{
    public class VerificationToken
    {
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string OtpCode { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool Used { get; set; }
        public string Purpose { get; set; } // "registration", "edit_profile"
    }
}