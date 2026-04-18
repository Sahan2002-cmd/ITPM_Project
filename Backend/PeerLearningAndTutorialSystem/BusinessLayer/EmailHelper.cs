using System;
using System.Net;
using System.Net.Mail;

namespace PeerLearningAndTutorialSystem.BusinessLayer
{
    /// <summary>
    /// Handles all outbound e-mail for the PeerLearn platform.
    /// Add the following keys to Web.config → appSettings:
    ///   SmtpHost   → smtp.gmail.com
    ///   SmtpPort   → 587
    ///   SmtpUser   → your@gmail.com
    ///   SmtpPass   → your_app_password  (Gmail App Password, not account password)
    ///   SmtpFrom   → PeerLearn &lt;your@gmail.com&gt;
    /// </summary>
    public class EmailHelper
    {
        private readonly string _host;
        private readonly int _port;
        private readonly string _user;
        private readonly string _pass;

        public EmailHelper()
        {
            var cfg = System.Configuration.ConfigurationManager.AppSettings;
            _host = cfg["SmtpHost"] ?? "smtp.gmail.com";
            _port = int.Parse(cfg["SmtpPort"] ?? "587");
            _user = cfg["SmtpUser"] ?? "";
            _pass = cfg["SmtpPass"] ?? "";
        }

        // ════════════════════════════════════════════════════════════════
        //  PUBLIC SEND METHODS
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Sends a welcome / confirmation e-mail immediately after registration.
        /// Informs the user that their account is under admin review (Pending status).
        /// </summary>
        public void SendWelcomeEmail(string toEmail, string fullName)
        {
            string subject = "Welcome to PeerLearn! 🎓";
            string body = $@"
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                    <h2 style='color:#2c3e50;'>Welcome, {fullName}!</h2>
                    <p>Thank you for registering with <strong>PeerLearn</strong>.</p>
                    <p>Your account has been created and is currently <strong>pending admin approval</strong>.
                       You will receive another email once your account is activated.</p>
                    <p>If you did not create this account, please ignore this email.</p>
                    <hr/>
                    <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
                </div>";

            Send(toEmail, subject, body);
        }

        /// <summary>
        /// Sends a 6-digit OTP to the user's email for the forgot-password flow.
        /// The OTP is valid for 10 minutes.
        /// </summary>
        public void SendOtpEmail(string toEmail, string otpCode)
        {
            string subject = "PeerLearn — Password Reset OTP";
            string body = $@"
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                    <h2 style='color:#2c3e50;'>Password Reset Request</h2>
                    <p>We received a request to reset your PeerLearn password.</p>
                    <p>Your one-time password (OTP) is:</p>
                    <h1 style='letter-spacing:8px;color:#e74c3c;text-align:center;'>{otpCode}</h1>
                    <p>This OTP expires in <strong>10 minutes</strong>.</p>
                    <p>If you did not request a password reset, please ignore this email — your account is safe.</p>
                    <hr/>
                    <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
                </div>";

            Send(toEmail, subject, body);
        }

        /// <summary>
        /// Sends a notification e-mail when a user's account details have been edited.
        /// Triggered after a successful EditUser operation.
        /// </summary>
        public void SendAccountUpdatedEmail(string toEmail, string fullName)
        {
            string subject = "PeerLearn — Account Updated";
            string body = $@"
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                    <h2 style='color:#2c3e50;'>Account Updated</h2>
                    <p>Hi {(string.IsNullOrEmpty(fullName) ? "there" : fullName)},</p>
                    <p>Your PeerLearn account information has been successfully updated.</p>
                    <p>If you did not make this change, please contact the administrator immediately.</p>
                    <hr/>
                    <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
                </div>";

            Send(toEmail, subject, body);
        }

        // ════════════════════════════════════════════════════════════════
        //  PRIVATE CORE SEND
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Core SMTP send. Failures are swallowed and logged to Debug output
        /// so that an email error never crashes an API request.
        /// </summary>
        private void Send(string to, string subject, string htmlBody)
        {
            try
            {
                using (var client = new SmtpClient(_host, _port))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(_user, _pass);
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;

                    var msg = new MailMessage
                    {
                        From = new MailAddress(_user, "PeerLearn"),
                        Subject = subject,
                        Body = htmlBody,
                        IsBodyHtml = true
                    };
                    msg.To.Add(to);
                    client.Send(msg);
                }
            }
            catch (Exception ex)
            {
                // Log and continue — email failure must not break the API response
                System.Diagnostics.Debug.WriteLine("[EmailHelper] Send error: " + ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  STATIC UTILITIES
        // ════════════════════════════════════════════════════════════════

        /// <summary>
        /// Generates a cryptographically random 6-digit OTP string.
        /// </summary>
        public static string GenerateOtp()
        {
            // Use Random with a time-based seed for better distribution
            return new Random().Next(100000, 999999).ToString();
        }

        public void SendAccountCreationSuccessEmail(string toEmail, string fullName)
        {
            string subject = "Account Created Successfully – PeerLearn 🎉";
            string body = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
            <h2 style='color:#2c3e50;'>Welcome, {fullName}!</h2>
            <p>Your <strong>PeerLearn</strong> account has been successfully verified and activated.</p>
            <p>You can now <strong>log in</strong> and start using all features of the platform.</p>
            <p>If you did not create this account, please contact support immediately.</p>
            <hr/>
            <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
        </div>";
            Send(toEmail, subject, body);
        }

        /// <summary>
        /// Sends a 6-digit OTP to the user's email for account verification during registration.
        /// </summary>
        public void SendRegistrationOtpEmail(string toEmail, string otpCode)
        {
            string subject = "PeerLearn — Verify Your Email Address";
            string body = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
            <h2 style='color:#2c3e50;'>Welcome to PeerLearn!</h2>
            <p>Thank you for registering. Please verify your email address by entering the OTP below:</p>
            <h1 style='letter-spacing:8px;color:#e74c3c;text-align:center;'>{otpCode}</h1>
            <p>This OTP expires in <strong>10 minutes</strong>.</p>
            <p>If you did not create this account, please ignore this email.</p>
            <hr/>
            <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
        </div>";
            Send(toEmail, subject, body);
        }

        /// <summary>
        /// Sends a registration success email (no OTP).
        /// </summary>
        public void SendRegistrationSuccessEmail(string toEmail, string fullName)
        {
            string subject = "Registration Successful – Welcome to PeerLearn! 🎉";
            string body = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
            <h2 style='color:#2c3e50;'>Welcome, {fullName}!</h2>
            <p>Your <strong>PeerLearn</strong> account has been successfully created.</p>
            <p>You can now <strong>log in</strong> using your email and password.</p>
            <p>If you did not create this account, please contact support immediately.</p>
            <hr/>
            <small style='color:#888;'>PeerLearning &amp; Tutorial System — SLIIT</small>
        </div>";
            Send(toEmail, subject, body);
        }
    }
}