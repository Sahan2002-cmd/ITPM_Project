using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class BookingModel
    {
        public int BookingId { get; set; }
        public int TutorId { get; set; }
        public int StudentId { get; set; }
        public string Status { get; set; } // Pending, Confirmed, Active, Completed, Cancelled
        public DateTime SessionDate { get; set; }
        public string CreatedAt { get; set; }
    }
}