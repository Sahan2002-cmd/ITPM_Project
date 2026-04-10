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
        public string PhoneNumber { get; set; }
        public string PasswordHash { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public string Status { get; set; }
        public bool IsEmailVerified { get; set; }
        public string ProfileImage { get; set; }
        /// <summary>Latest average score from tutor evaluations (Module 4). Null until first evaluation.</summary>
        public decimal? PerformanceScore { get; set; }
        /// <summary>Grade derived from PerformanceScore (Module 4): A+, A, B, C, D/F.</summary>
        public string PerformanceGrade { get; set; }
        public int? CreatedBy { get; set; }
        public string CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public string UpdatedAt { get; set; }
    }
}