using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface IOutSessionMessage
    {
        Response GetThread(int bookingId);
        Response SendMessage(OutSessionMessageRequestApi request);
        Response EditMessage(OutSessionMessageRequestApi request, int callerId);
        Response DeleteMessage(int outMessageId, int callerId);
        Response AdminDeleteMessage(OutSessionMessageRequestApi request, int adminId);
        Response MarkRead(int bookingId, int receiverId);
    }
}
