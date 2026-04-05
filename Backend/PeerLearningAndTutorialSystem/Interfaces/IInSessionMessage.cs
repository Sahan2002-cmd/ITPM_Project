using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface IInSessionMessage
    {

        Response GetChatHistory(int bookingId);
        Response SendMessage(InSessionMessageRequestApi request);
        Response EditMessage(InSessionMessageRequestApi request, int callerId);
        Response DeleteMessage(int messageId, int callerId);
    }
}
