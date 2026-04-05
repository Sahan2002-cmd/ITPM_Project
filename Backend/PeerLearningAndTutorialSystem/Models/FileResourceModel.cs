using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class FileResourceModel
    {
        public int FileId { get; set; }
        public int BookingId { get; set; }
        public int UploadedBy { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public long FileSize { get; set; }
        public string FileType { get; set; }
        public bool IsDeleted { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public string UpdatedAt { get; set; }

        // Joined fields
        public string UploaderName { get; set; }
    }
}