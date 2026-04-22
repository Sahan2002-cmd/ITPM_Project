using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              OUT-SESSION MESSAGE API ENDPOINTS  — Member 3              ║
 * ║        Base URL: https://localhost:44331/api/outsessionmessage           ║
 * ╠══════════════╦═══════════════════════════════════╦══════════════════════╣
 * ║ Method       ║ Endpoint                          ║ Access               ║
 * ╠══════════════╬═══════════════════════════════════╬══════════════════════╣
 * ║ GET          ║ /api/outsessionmessage/{bookingId} ║ Student | Tutor     ║
 * ║ POST         ║ /api/outsessionmessage/send        ║ Student | Tutor     ║
 * ║ PUT          ║ /api/outsessionmessage/edit        ║ Student | Tutor     ║
 * ║ DELETE       ║ /api/outsessionmessage/{id}        ║ Student | Tutor     ║
 * ║ PUT          ║ /api/outsessionmessage/admin-delete ║ Admin              ║
 * ║ PUT          ║ /api/outsessionmessage/mark-read/{bookingId} ║ Student|Tutor ║
 * ╚══════════════╩═══════════════════════════════════╩══════════════════════╝
 *
 * Business rules enforced here:
 *   - Edit window: 30 minutes (enforced in SP)
 *   - Admin delete requires reason (enforced in DA)
 *   - Mark-read auto-called when receiver opens thread
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/outsessionmessage")]
    public class OutSessionMessageController : ApiController
    {
        private readonly DAOutSessionMessage _da = new DAOutSessionMessage();

        // ── JWT helpers ───────────────────────────────────────────────────
        private int GetCallerId()
        {
            string token = ExtractToken();
            return string.IsNullOrEmpty(token) ? 0 : new JwtHelper().GetUserIdFromToken(token);
        }

        private string GetCallerRole()
        {
            string token = ExtractToken();
            return string.IsNullOrEmpty(token) ? null : new JwtHelper().GetRoleFromToken(token);
        }

        private string ExtractToken()
        {
            if (!Request.Headers.Contains("Authorization")) return null;
            var bearer = Request.Headers.GetValues("Authorization").FirstOrDefault();
            return string.IsNullOrEmpty(bearer) ? null : bearer.Replace("Bearer ", "").Trim();
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/outsessionmessage/{bookingId}
        //  Returns full out-session message thread for a booking.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{bookingId:int}")]
        public IHttpActionResult GetThread(int bookingId)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.GetThread(bookingId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/outsessionmessage/send
        //  Sends a new out-session message (before or after session).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("send")]
        public IHttpActionResult SendMessage([FromBody] OutSessionMessageRequestApi request)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null)
                return BadRequest("Request body is required.");

            request.SenderId = callerId;

            return Ok(_da.SendMessage(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/outsessionmessage/edit
        //  Edits own message within 30-minute window.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("edit")]
        public IHttpActionResult EditMessage([FromBody] OutSessionMessageRequestApi request)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null || request.OutMessageId == null)
                return BadRequest("OutMessageId and MessageText are required.");

            return Ok(_da.EditMessage(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/outsessionmessage/{id}
        //  Soft deletes own message. Sender only.
        // ════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteMessage(int id)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.DeleteMessage(id, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/outsessionmessage/admin-delete
        //  Admin deletes with reason. Soft delete, reason logged in DB.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("admin-delete")]
        public IHttpActionResult AdminDeleteMessage([FromBody] OutSessionMessageRequestApi request)
        {
            int callerId = GetCallerId();
            string callerRole = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (callerRole != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            if (request == null || request.OutMessageId == null)
                return BadRequest("OutMessageId and AdminDeleteReason are required.");

            return Ok(_da.AdminDeleteMessage(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/outsessionmessage/mark-read/{bookingId}
        //  Marks all unread messages as read for the calling user.
        //  Called automatically when receiver opens the thread.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("mark-read/{bookingId:int}")]
        public IHttpActionResult MarkRead(int bookingId)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.MarkRead(bookingId, callerId));
        }
    }
}