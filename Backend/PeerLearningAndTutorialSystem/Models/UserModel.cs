using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class UserModel
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public string Status { get; set; }
        public bool IsEmailVerified { get; set; }
        public string ProfileImage { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public string UpdatedAt { get; set; }
    }
}