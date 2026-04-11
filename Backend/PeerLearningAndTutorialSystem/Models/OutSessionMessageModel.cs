using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class OutSessionMessageModel
    {
        public int OutMessageId { get; set; }
        public int BookingId { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string MessageText { get; set; }
        public bool IsRead { get; set; }
        public string EditedAt { get; set; }
        public bool IsDeleted { get; set; }
        public string DeletedAt { get; set; }
        public string AdminDeleteReason { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public string UpdatedAt { get; set; }

        // Joined fields
        public string SenderName { get; set; }
        public string ConversationKey { get;  set; }
    }
}