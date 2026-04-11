using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem.Models
{
    public class TutorProfileModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>Foreign key reference to the Users collection (integer auto-increment ID).</summary>
        public int UserId { get; set; }

        /// <summary>Must end with @sliit.lk — enforced by the controller.</summary>
        public string Email { get; set; }

        public string FullName { get; set; }
        public string Bio { get; set; }
        public List<string> SubjectsTaught { get; set; } = new List<string>();
        public List<string> Qualifications { get; set; } = new List<string>();
        public int YearsOfExperience { get; set; }

        /// <summary>100 – 5000 — enforced by the controller.</summary>
        public decimal HourlyRate { get; set; }

        /// <summary>Recalculated automatically when a student rating is approved (Module 4).</summary>
        public decimal AverageRating { get; set; } = 0m;

        /// <summary>Total number of approved student ratings contributing to AverageRating.</summary>
        public int TotalRatings { get; set; } = 0;

        /// <summary>"Pending Verification" | "Active" | "Inactive" | "Suspended"</summary>
        public string Status { get; set; } = "Pending Verification";

        public bool IsVerified { get; set; } = false;
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}