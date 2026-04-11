using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class OutSessionMessageRequestApi
    {
        public int? OutMessageId { get; set; }
        public int? BookingId { get; set; }
        public int? SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public string MessageText { get; set; }
        public string AdminDeleteReason { get; set; }
        public string ConversationKey { get; set; }
    }
}