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

using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;
using AllowAnonymousAttribute = System.Web.Http.AllowAnonymousAttribute;

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/user")]
    public class UserController : ApiController
    {
        private readonly DAUser _da = new DAUser();

        // ── JWT helpers ───────────────────────────────────────────────────
        private int GetCallerUserId()
        {
            string token = ExtractBearerToken();
            return string.IsNullOrEmpty(token) ? 0 : new JwtHelper().GetUserIdFromToken(token);
        }

        private string GetCallerRole()
        {
            string token = ExtractBearerToken();
            return string.IsNullOrEmpty(token) ? null : new JwtHelper().GetRoleFromToken(token);
        }

        private string ExtractBearerToken()
        {
            if (!Request.Headers.Contains("Authorization")) return null;
            var bearer = Request.Headers.GetValues("Authorization").FirstOrDefault();
            return string.IsNullOrEmpty(bearer) ? null : bearer.Replace("Bearer ", "").Trim();
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/all
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
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetUser(int id)
        {
            int callerId = GetCallerUserId();
            string role = GetCallerRole();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));
            if (role != "Admin" && callerId != id)
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. You can only view your own profile."));
            return Ok(_da.GetUserById(id));
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/tutors
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
            return Ok(_da.GetStudentsForTutor(callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/register
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("register")]
        [AllowAnonymous]
        public IHttpActionResult Register([FromBody] UserRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");
            return Ok(_da.Register(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/verify-otp  (for registration)
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("verify-otp")]
        [AllowAnonymous]
        public IHttpActionResult VerifyRegistrationOtp([FromBody] UserRequestApi request)
        {
            if (string.IsNullOrWhiteSpace(request?.Email) || string.IsNullOrWhiteSpace(request?.OtpCode))
                return BadRequest("Email and OTP code are required.");
            return Ok(_da.VerifyRegistrationOtp(request.Email, request.OtpCode));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/login
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("login")]
        [AllowAnonymous]
        public IHttpActionResult Login([FromBody] UserRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");
            return Ok(_da.Login(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/google-login
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
                string verifyUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={request.GoogleToken}";
                using (var client = new WebClient())
                {
                    string json = client.DownloadString(verifyUrl);
                    var payload = JObject.Parse(json);
                    string clientId = System.Configuration.ConfigurationManager.AppSettings["GoogleClientId"];
                    string aud = payload["aud"]?.ToString();
                    if (!string.IsNullOrEmpty(clientId) && aud != clientId)
                        return Ok(Response.Fail("Invalid Google token audience."));
                    request.GoogleId = payload["sub"]?.ToString();
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
        //  POST  /api/user/edit-request-otp
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("edit-request-otp")]
        public IHttpActionResult RequestEditOtp()
        {
            int userId = GetCallerUserId();
            if (userId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));
            return Ok(_da.RequestEditOtp(userId));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/user/edit  (requires OTP)
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
            if (string.IsNullOrWhiteSpace(request.OtpCode))
                return BadRequest("OTP code is required to edit profile.");
            return Ok(_da.EditUser(request, callerId, role));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/user/delete/{id}
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
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("forgot-password/verify")]
        [AllowAnonymous]
        public IHttpActionResult VerifyOtp([FromBody] UserRequestApi request)
        {
            if (string.IsNullOrWhiteSpace(request?.Email) || string.IsNullOrWhiteSpace(request?.OtpCode))
                return BadRequest("Email and OTP code are required.");
            return Ok(_da.VerifyOtp(request.Email, request.OtpCode));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/user/forgot-password/reset
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("forgot-password/reset")]
        [AllowAnonymous]
        public IHttpActionResult ResetPassword([FromBody] UserRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");
            return Ok(_da.ResetPassword(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/user/hashtest (DEV ONLY)
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("hashtest")]
        [AllowAnonymous]
        public IHttpActionResult HashTest()
        {
            string hash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", workFactor: 12);
            return Ok(hash);
        }
    }
}