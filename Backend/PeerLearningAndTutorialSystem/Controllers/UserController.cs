using Newtonsoft.Json.Linq;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;

// Alias conflicting attribute names from different namespaces
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;
using AllowAnonymousAttribute = System.Web.Http.AllowAnonymousAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         USER API ENDPOINTS                              ║
 * ║              Base URL: https://localhost:44331/api/user                  ║
 * ╠══════════╦═══════════════════════════════════╦══════════════════════════╣
 * ║ Method   ║ Endpoint                          ║ Access                   ║
 * ╠══════════╬═══════════════════════════════════╬══════════════════════════╣
 * ║ GET      ║ /api/user/all                     ║ Admin                    ║
 * ║ GET      ║ /api/user/{id}                    ║ Admin | Own account      ║
 * ║ GET      ║ /api/user/tutors                  ║ Admin | Tutor | Student  ║
 * ║ GET      ║ /api/user/my-students             ║ Admin | Tutor            ║
 * ║ POST     ║ /api/user/register                ║ Public (anonymous)       ║
 * ║ POST     ║ /api/user/login                   ║ Public (anonymous)       ║
 * ║ POST     ║ /api/user/google-login            ║ Public (anonymous)       ║
 * ║ PUT      ║ /api/user/edit                    ║ Admin | Tutor | Student  ║
 * ║ DELETE   ║ /api/user/delete/{id}             ║ Admin                    ║
 * ║ PUT      ║ /api/user/approve                 ║ Admin                    ║
 * ║ POST     ║ /api/user/forgot-password/request ║ Public (anonymous)       ║
 * ║ POST     ║ /api/user/forgot-password/verify  ║ Public (anonymous)       ║
 * ║ POST     ║ /api/user/forgot-password/reset   ║ Public (anonymous)       ║
 * ╚══════════╩═══════════════════════════════════╩══════════════════════════╝
 *
 * Role hierarchy:
 *   Admin   (roleId 1) — full access to everything
 *   Tutor   (roleId 2) — own account + see own students
 *   Student (roleId 3) — own account + see all tutors
 *
 * Authentication: Bearer JWT in Authorization header.
 * Email domain examples:
 *   Admin:   gamage.admin@sliit.lk
 *   Tutor:   sahan.d@sliit.lk
 *   Student: it23837676@my.sliit.lk
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/user")]
    public class UserController : ApiController
    {
        private readonly DAUser _da = new DAUser();

        // ════════════════════════════════════════════════════════════════
        //  PRIVATE HELPERS — JWT extraction
        // ════════════════════════════════════════════════════════════════

        /// <summary>Extracts and returns the userId claim from the Bearer JWT in the request header. Returns 0 if missing or invalid.</summary>
        private int GetCallerUserId()
        {
            string token = ExtractBearerToken();
            return string.IsNullOrEmpty(token) ? 0 : new JwtHelper().GetUserIdFromToken(token);
        }

        /// <summary>Extracts and returns the roleName claim ("Admin" | "Tutor" | "Student") from the Bearer JWT. Returns null if missing or invalid.</summary>
        private string GetCallerRole()
        {
            string token = ExtractBearerToken();
            return string.IsNullOrEmpty(token) ? null : new JwtHelper().GetRoleFromToken(token);
        }

        /// <summary>Pulls the raw token string from the Authorization header (strips "Bearer " prefix).</summary>
        private string ExtractBearerToken()
        {
            if (!Request.Headers.Contains("Authorization")) return null;
            var bearer = Request.Headers.GetValues("Authorization").FirstOrDefault();
            return string.IsNullOrEmpty(bearer) ? null : bearer.Replace("Bearer ", "").Trim();
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/all
        //  Returns every user in the system.
        //  Access: Admin only.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("all")]
        public IHttpActionResult GetAllUsers()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetAllUsers());
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/{id}
        //  Returns a single user's details.
        //  Access: Admin (any id) | Tutor / Student (own id only).
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetUser(int id)
        {
            int callerId = GetCallerUserId();
            string role = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            // Non-admins may only view their own profile
            if (role != "Admin" && callerId != id)
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. You can only view your own profile."));

            return Ok(_da.GetUserById(id));
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/tutors
        //  Returns all Active tutors — Students use this to discover tutors.
        //  Access: Admin | Tutor | Student (any authenticated user).
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("tutors")]
        public IHttpActionResult GetAllTutors()
        {
            if (GetCallerUserId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.GetAllTutors());
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/my-students
        //  Returns the students linked to the calling Tutor.
        //  Access: Tutor (own students) | Admin (pass ?tutorId= in query string if needed).
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("my-students")]
        public IHttpActionResult GetMyStudents()
        {
            int callerId = GetCallerUserId();
            string role = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (role != "Tutor" && role != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Tutors and Admins only."));

            // For a Tutor → use their own userId; Admin may pass a tutorId in the body / query if needed
            return Ok(_da.GetStudentsForTutor(callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/register
        //  Creates a new user account (defaults to Student role).
        //  Account lands in Pending status until Admin approves.
        //  A welcome / confirmation e-mail is sent on success.
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("register")]
        [AllowAnonymous]
        public IHttpActionResult Register([FromBody] UserRequestApi request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            return Ok(_da.Register(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/login
        //  Authenticates with email + password and returns a JWT.
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("login")]
        [AllowAnonymous]
        public IHttpActionResult Login([FromBody] UserRequestApi request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            return Ok(_da.Login(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/google-login
        //  Authenticates (or auto-registers) via Google OAuth ID token.
        //  Body: { "googleToken": "<ID_TOKEN_FROM_GOOGLE>" }
        //  1. Verifies the token with Google's tokeninfo endpoint.
        //  2. Validates the audience matches the configured Google Client ID.
        //  3. Delegates to DAUser.GoogleOAuthLogin for DB upsert + JWT.
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("google-login")]
        [AllowAnonymous]
        public IHttpActionResult GoogleLogin([FromBody] UserRequestApi request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.GoogleToken))
                return BadRequest("Google token is required.");

            try
            {
                // ── Step 1: Verify the ID token with Google ──────────────
                string verifyUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={request.GoogleToken}";
                using (var client = new WebClient())
                {
                    string json = client.DownloadString(verifyUrl);
                    var payload = JObject.Parse(json);

                    // ── Step 2: Validate audience (aud) against app's Client ID ─
                    string clientId = System.Configuration.ConfigurationManager.AppSettings["GoogleClientId"];
                    string aud = payload["aud"]?.ToString();

                    if (!string.IsNullOrEmpty(clientId) && aud != clientId)
                        return Ok(Response.Fail("Invalid Google token audience."));

                    // ── Step 3: Extract user claims from the verified token ──
                    request.GoogleId = payload["sub"]?.ToString();   // Google unique user ID
                    request.Email = payload["email"]?.ToString();
                    request.FullName = payload["name"]?.ToString();
                }

                return Ok(_da.GoogleOAuthLogin(request));
            }
            catch (Exception ex)
            {
                return Ok(Response.Error("Google token verification failed: " + ex.Message));
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/user/edit
        //  Updates user profile information.
        //  Admin: can edit any user, any field (fullName, email, roleId, status).
        //  Tutor / Student: can only update own fullName (email is locked).
        //  An account-updated e-mail is sent on success.
        //  Access: Admin | Tutor | Student.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("edit")]
        public IHttpActionResult EditUser([FromBody] UserRequestApi request)
        {
            int callerId = GetCallerUserId();
            string role = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null)
                return BadRequest("Request body is required.");

            // DAUser.EditUser enforces field-level restrictions internally
            return Ok(_da.EditUser(request, callerId, role));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/user/delete/{id}
        //  Soft-deletes a user (sets status = "Inactive").
        //  Admin cannot delete their own account.
        //  Access: Admin only.
        // ════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("delete/{id:int}")]
        public IHttpActionResult DeleteUser(int id)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            int adminId = GetCallerUserId();
            return Ok(_da.DeleteUser(id, adminId));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/user/approve
        //  Changes a user's status (Pending → Approved | Rejected | Suspended | Active | Inactive).
        //  Body: { "userId": 5, "status": "Approved" }
        //  Access: Admin only.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("approve")]
        public IHttpActionResult ApproveUser([FromBody] UserRequestApi request)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            if (request?.UserId == null || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest("UserId and Status are required.");

            int adminId = GetCallerUserId();
            return Ok(_da.ApproveUser(request.UserId.Value, request.Status, adminId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/forgot-password/request
        //  Generates a 6-digit OTP and e-mails it to the user.
        //  Body: { "email": "user@sliit.lk" }
        //  Always returns success to prevent email enumeration.
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("forgot-password/request")]
        [AllowAnonymous]
        public IHttpActionResult RequestOtp([FromBody] UserRequestApi request)
        {
            if (string.IsNullOrWhiteSpace(request?.Email))
                return BadRequest("Email is required.");

            string otp = EmailHelper.GenerateOtp();
            return Ok(_da.RequestOtp(request.Email, otp));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/forgot-password/verify
        //  Confirms the OTP is valid and not yet expired.
        //  Body: { "email": "user@sliit.lk", "otpCode": "123456" }
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("forgot-password/verify")]
        [AllowAnonymous]
        public IHttpActionResult VerifyOtp([FromBody] UserRequestApi request)
        {
            if (string.IsNullOrWhiteSpace(request?.Email) ||
                string.IsNullOrWhiteSpace(request?.OtpCode))
                return BadRequest("Email and OTP code are required.");

            return Ok(_da.VerifyOtp(request.Email, request.OtpCode));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/forgot-password/reset
        //  Resets the password after successful OTP verification.
        //  Body: { "email": "user@sliit.lk", "otpCode": "123456", "newPassword": "Abc@1234" }
        //  OTP is marked as used after reset — cannot be replayed.
        //  Access: Public (anonymous).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("forgot-password/reset")]
        [AllowAnonymous]
        public IHttpActionResult ResetPassword([FromBody] UserRequestApi request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            return Ok(_da.ResetPassword(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/hashtest
        //  DEV ONLY — returns a BCrypt hash of "Admin@1234" for seeding.
        //  Remove or restrict this endpoint before production deployment.
        //  Access: Public (anonymous) — DEV ONLY.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("hashtest")]
        [AllowAnonymous]
        public IHttpActionResult HashTest()
        {
            string hash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", workFactor: 12);
            return Ok(hash);
            /*
             * To seed the admin account, run in SQL Server:
             *
             * UPDATE Users
             * SET    password_hash = '<hash returned above>'
             * WHERE  email = 'gamage.admin@sliit.lk';
             */
        }
    }
}