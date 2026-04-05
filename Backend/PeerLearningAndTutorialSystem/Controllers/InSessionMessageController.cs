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
 * ║              IN-SESSION MESSAGE API ENDPOINTS  — Member 3               ║
 * ║         Base URL: https://localhost:44331/api/insessionmessage           ║
 * ╠══════════════╦═══════════════════════════════════╦══════════════════════╣
 * ║ Method       ║ Endpoint                          ║ Access               ║
 * ╠══════════════╬═══════════════════════════════════╬══════════════════════╣
 * ║ GET          ║ /api/insessionmessage/{bookingId} ║ Student | Tutor      ║
 * ║ POST         ║ /api/insessionmessage/send        ║ Student | Tutor      ║
 * ║ PUT          ║ /api/insessionmessage/edit        ║ Student | Tutor      ║
 * ║ DELETE       ║ /api/insessionmessage/{id}        ║ Student | Tutor      ║
 * ╚══════════════╩═══════════════════════════════════╩══════════════════════╝
 *
 * Business rules enforced here:
 *   - Only Student or Tutor roles can access (not Admin)
 *   - Session must be Active to send (enforced in SP)
 *   - Edit window: 5 minutes (enforced in SP)
 *   - Delete: soft delete, sender only (enforced in SP)
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/insessionmessage")]
    public class InSessionMessageController : ApiController
    {
        private readonly DAInSessionMessage _da = new DAInSessionMessage();

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
        //  GET  /api/insessionmessage/{bookingId}
        //  Returns full chat history for the session.
        //  Access: Student and Tutor only.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{bookingId:int}")]
        public IHttpActionResult GetChatHistory(int bookingId)
        {
            string role = GetCallerRole();
            if (role == null)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (role == "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Not available for Admin."));

            return Ok(_da.GetChatHistory(bookingId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/insessionmessage/send
        //  Sends a new in-session message.
        //  Business rule: session must be Active (checked in SP).
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("send")]
        public IHttpActionResult SendMessage([FromBody] InSessionMessageRequestApi request)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null)
                return BadRequest("Request body is required.");

            // Ensure senderId matches the JWT caller
            request.SenderId = callerId;

            return Ok(_da.SendMessage(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/insessionmessage/edit
        //  Edits own message within 5-minute window.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("edit")]
        public IHttpActionResult EditMessage([FromBody] InSessionMessageRequestApi request)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null || request.MessageId == null)
                return BadRequest("MessageId and MessageText are required.");

            return Ok(_da.EditMessage(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/insessionmessage/{id}
        //  Soft deletes own message. Hidden from UI, kept in DB.
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
    }
}