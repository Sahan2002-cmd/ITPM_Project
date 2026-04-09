using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class SessionNoteRequestApi
    {
        public int? NoteId { get; set; }
        public int? BookingId { get; set; }
        public int? TutorId { get; set; }
        public string TopicsCovered { get; set; }
        public string Homework { get; set; }
        public string NextSteps { get; set; }
        public string AdminDeleteReason { get; set; }
    }
}