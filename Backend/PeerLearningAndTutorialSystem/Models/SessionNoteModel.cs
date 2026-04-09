using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class SessionNoteModel
    {
        public int NoteId { get; set; }
        public int BookingId { get; set; }
        public int TutorId { get; set; }
        public string TopicsCovered { get; set; }
        public string Homework { get; set; }
        public string NextSteps { get; set; }
        public bool IsDeleted { get; set; }
        public string AdminDeleteReason { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public string UpdatedAt { get; set; }

        // Joined fields
        public string TutorName { get; set; }
    }
}