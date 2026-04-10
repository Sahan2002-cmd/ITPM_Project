using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class TutorProfileRequestApi
    {
        public string Id { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Bio { get; set; }
        public List<string> SubjectsTaught { get; set; }
        public List<string> Qualifications { get; set; }
        public int YearsOfExperience { get; set; }
        public decimal HourlyRate { get; set; }

        /// <summary>Ignored on Create — controller forces "Pending Verification".</summary>
        public string Status { get; set; }
    }
}