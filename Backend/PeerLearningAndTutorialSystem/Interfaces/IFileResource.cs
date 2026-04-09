using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface IFileResource
    {
        Response GetSessionFiles(int bookingId);
        Response UploadFile(FileResourceRequestApi request);
        Response RenameFile(FileResourceRequestApi request, int callerId);
        Response DeleteFile(int fileId, int callerId);
    }
}
