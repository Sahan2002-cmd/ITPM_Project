using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models.RequestApiModels
{
    public class UserRequestApi
    {
        // Register
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int? RoleId { get; set; }

        // Login
        // Email is reused above

        // Google OAuth
        public string GoogleId { get; set; }
        public string GoogleEmail { get; set; }
        public string GoogleToken { get; set; }      // ID token from React frontend

        // Admin edit / status update
        public int? UserId { get; set; }
        public string Status { get; set; }

        // Forgot password / OTP flow
        public string OtpCode { get; set; }
        public string NewPassword { get; set; }

        public string PhoneNumber { get; set; }

    }
}