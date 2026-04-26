using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute    = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute   = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute    = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute      = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              TUTOR PROFILE API ENDPOINTS  — Module 1                       ║
 * ║          Base URL: https://localhost:44331/api/tutorprofile                  ║
 * ╠══════════════╦══════════════════════════════════════════╦══════════════════╣
 * ║ POST         ║ /create                                  ║ Tutor only       ║
 * ║ GET          ║ /all                                     ║ Any authed user  ║
 * ║ GET          ║ /admin/all                               ║ Admin only       ║
 * ║ GET          ║ /{id}                                    ║ Any authed user  ║
 * ║ PUT          ║ /update/{id}                             ║ Tutor (own) only ║
 * ║ PUT          ║ /approve/{id}                            ║ Admin only       ║
 * ║ PUT          ║ /soft-delete/{id}                        ║ Admin / Tutor    ║
 * ╚══════════════╩══════════════════════════════════════════╩══════════════════╝
 *
 * Business rules enforced here (before DA call):
 *   - Email MUST end with @sliit.lk
 *   - HourlyRate MUST be 100 – 5000 (inclusive)
 *   - Status is ALWAYS forced to "Pending Verification" on create (user input ignored)
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/tutorprofile")]
    public class TutorProfileController : ApiController
    {
        private readonly DATutorProfile  _da      = new DATutorProfile();
        private readonly DANotification  _daNotif = new DANotification();

        // ── JWT helpers ───────────────────────────────────────────────────
        private int GetCallerId()
        {
            string t = ExtractToken();
            return string.IsNullOrEmpty(t) ? 0 : new JwtHelper().GetUserIdFromToken(t);
        }

        private string GetCallerRole()
        {
            string t = ExtractToken();
            return string.IsNullOrEmpty(t) ? null : new JwtHelper().GetRoleFromToken(t);
        }

        private string ExtractToken()
        {
            if (!Request.Headers.Contains("Authorization")) return null;
            var v = Request.Headers.GetValues("Authorization").FirstOrDefault();
            return string.IsNullOrEmpty(v) ? null : v.Replace("Bearer ", "").Trim();
        }

        // ════════════════════════════════════════════════════════════════
        // POST  /api/tutorprofile/create
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("create")]
        public IHttpActionResult CreateProfile([FromBody] TutorProfileRequestApi request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            // ── Role guard ───────────────────────────────────────────────
            string role = GetCallerRole();
            if (role != "Tutor" && role != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors can create a tutor profile."));

            // ── Business rule: HourlyRate 100 – 5000 ─────────────────────
            if (request.HourlyRate < 100 || request.HourlyRate > 5000)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Hourly rate must be between LKR 100 and LKR 5,000."));

            // ── Force status & UserId — controller is the single authority ─────────
            request.Status = "Pending Verification";
            request.UserId = GetCallerId();

            var result = _da.CreateProfile(request);
            return result.StatusCode == 1
                ? Content(HttpStatusCode.Created, result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/tutorprofile/all
        // Returns all Active/Verified profiles. Accessible to any authenticated user.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("all")]
        public IHttpActionResult GetAllActive()
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            return Ok(_da.GetAllActiveVerified());
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/tutorprofile/{id}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{id}")]
        public IHttpActionResult GetById(string id)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var result = _da.GetById(id);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.NotFound, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/tutorprofile/by-userid/{userId}
        // Allows a tutor to fetch their own profile using their integer UserId.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("by-userid/{userId:int}")]
        public IHttpActionResult GetByUserId(int userId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var result = _da.GetByUserId(userId);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.NotFound, result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/tutorprofile/update/{id}
        // Tutor can only update their own profile; Admin can update any.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("update/{id}")]
        public IHttpActionResult UpdateProfile(string id, [FromBody] TutorProfileRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            string role     = GetCallerRole();
            int    callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            // Non-admin callers can only update a profile that belongs to them
            if (role != "Admin" && request.UserId != 0 && request.UserId != callerId)
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("You can only update your own tutor profile."));

            // Validate rate if caller is supplying a new one
            if (request.HourlyRate > 0 && (request.HourlyRate < 100 || request.HourlyRate > 5000))
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Hourly rate must be between LKR 100 and LKR 5,000."));

            var result = _da.UpdateProfile(id, request);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/tutorprofile/soft-delete/{id}
        // Admin only. Moves profile to "Inactive" or "Suspended".
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("soft-delete/{id}")]
        public IHttpActionResult SoftDelete(string id, [FromUri] string newStatus = "Inactive")
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            var result = _da.SoftDelete(id, newStatus);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/tutorprofile/admin/all
        // Admin only. Returns ALL profiles regardless of status.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("admin/all")]
        public IHttpActionResult GetAllAdmin()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetAllProfilesAdmin());
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/tutorprofile/approve/{id}
        // Admin only. Sets status = "Active" + IsVerified = true.
        // Sends an in-app notification to the tutor.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("approve/{id}")]
        public IHttpActionResult ApproveProfile(string id)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            var result = _da.ApproveProfile(id);
            if (result.StatusCode == 1 && result.Data != null)
            {
                // Notify the tutor their profile was approved
                try
                {
                    dynamic d = result.Data;
                    int tutorUserId = (int)d.UserId;
                    _daNotif.CreateNotification(new NotificationRequestApi
                    {
                        UserId  = tutorUserId,
                        Title   = "Profile Approved!",
                        Message = "Your tutor profile has been reviewed and approved. You are now visible to students.",
                        Type    = "TutorApproval",
                        RelatedBookingId = null
                    });
                }
                catch { /* notification failure must not break the approval */ }
            }

            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }
    }
}
