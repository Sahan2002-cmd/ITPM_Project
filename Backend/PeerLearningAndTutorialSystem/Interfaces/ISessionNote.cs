using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface ISessionNote
    {
        Response GetNoteByBooking(int bookingId);
        Response SubmitNote(SessionNoteRequestApi request);
        Response EditNote(SessionNoteRequestApi request, int tutorId);
        Response AdminDeleteNote(SessionNoteRequestApi request, int adminId);
        Response GetAllNotesReport(int adminId);
    }
}
