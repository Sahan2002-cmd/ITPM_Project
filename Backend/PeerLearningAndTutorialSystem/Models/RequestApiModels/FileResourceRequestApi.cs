using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class FileResourceRequestApi
    {
        public int? FileId { get; set; }
        public int? BookingId { get; set; }
        public int? UploadedBy { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public long? FileSize { get; set; }
        public string FileType { get; set; }
    }
}