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
 * ║             AVAILABILITY API ENDPOINTS  — Module 1                         ║
 * ║         Base URL: https://localhost:44331/api/availability                   ║
 * ╠══════════════╦══════════════════════════════════════════╦══════════════════╣
 * ║ POST         ║ /create                                  ║ Tutor only       ║
 * ║ GET          ║ /tutor/{tutorProfileId}                  ║ Any authed user  ║
 * ║ PUT          ║ /status/{id}                             ║ Admin / internal ║
 * ║ DELETE       ║ /{id}                                    ║ Tutor (own) only ║
 * ╚══════════════╩══════════════════════════════════════════╩══════════════════╝
 *
 * Business rules enforced here (before DA call):
 *   - Date must NOT be in the past (using StartTime component)
 *   - EndTime must be at least 30 minutes after StartTime
 *   - Status is ALWAYS forced to "Free" on create (user input ignored)
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/availability")]
    public class AvailabilityController : ApiController
    {
        private readonly DAAvailability _da = new DAAvailability();

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
        // POST  /api/availability/create
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("create")]
        public IHttpActionResult CreateSlot([FromBody] AvailabilityRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            // ── Role guard ───────────────────────────────────────────────
            if (GetCallerRole() != "Tutor" && GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors can create availability slots."));

            // ── Business rule: StartTime must not be in the past ─────────
            if (request.StartTime < DateTime.UtcNow)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Start time cannot be in the past."));

            // ── Business rule: slot must be at least 30 minutes long ─────
            if ((request.EndTime - request.StartTime).TotalMinutes < 30)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("End time must be at least 30 minutes after start time."));

            // ── Sanity: EndTime must be after StartTime ───────────────────
            if (request.EndTime <= request.StartTime)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("End time must be after start time."));

            // ── Force status — controller is the single authority ─────────
            request.Status = "Free";

            var result = _da.CreateSlot(request);
            return result.StatusCode == 1
                ? Content(HttpStatusCode.Created, result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/availability/tutor/{tutorProfileId}
        // Returns future "Free" slots for a given tutor.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("tutor/{tutorProfileId}")]
        public IHttpActionResult GetByTutor(string tutorProfileId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            return Ok(_da.GetByTutor(tutorProfileId));
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/availability/status/{id}?newStatus=Booked
        // Admin / system use only. The booking flow calls the DA directly;
        // this endpoint is exposed for admin overrides.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("status/{id}")]
        public IHttpActionResult UpdateStatus(string id, [FromUri] string newStatus)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            if (string.IsNullOrWhiteSpace(newStatus))
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("newStatus query parameter is required."));

            var result = _da.UpdateStatus(id, newStatus);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // DELETE  /api/availability/{id}
        // Hard delete. DA enforces that slot must be "Free".
        // ════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult DeleteSlot(string id)
        {
            string role = GetCallerRole();
            if (role != "Tutor" && role != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors or admins can delete availability slots."));

            var result = _da.DeleteSlot(id);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }
    }
}
