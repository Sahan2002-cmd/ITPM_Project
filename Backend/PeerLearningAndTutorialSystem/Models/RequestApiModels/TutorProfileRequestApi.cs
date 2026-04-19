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

        /// <summary>Languages the tutor can teach in (e.g. ["English", "Sinhala"]).</summary>
        public List<string> Languages { get; set; }

        /// <summary>Teaching styles selected by the tutor (e.g. ["Problem-Solving Focus"]).</summary>
        public List<string> TeachingStyles { get; set; }

        /// <summary>Base64-encoded or URL of uploaded credential/certificate document.</summary>
        public string CertificateUrl { get; set; }

        /// <summary>Base64-encoded or URL of uploaded government-issued ID document.</summary>
        public string IdDocumentUrl { get; set; }
    }
}