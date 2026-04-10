using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
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
        private readonly IMongoCollection<OutSessionMessageModel> _messages;
        private readonly IMongoCollection<BookingModel> _bookings;
        private readonly DAOutSessionMessage _da = new DAOutSessionMessage();
        private string NowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
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
        // 002 – SEND MESSAGE
        public Response SendMessage(OutSessionMessageRequestApi request)
        {

            try
            {
                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");

                // Allow direct chat with bookingId = -1 (no session check)
                if (request.BookingId != -1)
                {
                    var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                    if (booking == null || !(booking.Status == "Completed" || booking.Status == "Confirmed" || booking.Status == "Pending"))
                        return Response.Fail("Out-session messages allowed only for Completed, Confirmed, or Pending sessions.");
                }

                var msg = new OutSessionMessageModel
                {
                    OutMessageId = CounterHelper.GetNextSequence("outMessageId"),
                    BookingId = request.BookingId.Value,
                    SenderId = request.SenderId.Value,
                    ReceiverId = request.ReceiverId.Value,
                    MessageText = request.MessageText.Trim(),
                    IsRead = false,
                    EditedAt = null,
                    IsDeleted = false,
                    DeletedAt = null,
                    AdminDeleteReason = null,
                    CreatedBy = request.SenderId,
                    CreatedAt = NowIso(),
                    UpdatedBy = null,
                    UpdatedAt = null
                };
                _messages.InsertOne(msg);
                return Response.Success(null, "Message sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        [HttpGet]
        [Route("direct/{otherUserId:int}")]
        public IHttpActionResult GetDirectMessages(int otherUserId)
        {
            int currentUserId = GetCallerId();
            if (currentUserId == 0) return Unauthorized();
            return Ok(_da.GetDirectMessages(currentUserId, otherUserId));
        }

        [HttpPost]
        [Route("direct/send")]
        public IHttpActionResult SendDirectMessage([FromBody] DirectMessageRequest request)
        {
            int currentUserId = GetCallerId();
            if (currentUserId == 0) return Unauthorized();
            if (request?.ReceiverId == null || string.IsNullOrWhiteSpace(request.MessageText))
                return BadRequest("ReceiverId and MessageText are required.");
            return Ok(_da.SendDirectMessage(currentUserId, request.ReceiverId.Value, request.MessageText));
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

        public class DirectMessageRequest
        {
            public int? ReceiverId { get; set; }
            public string MessageText { get; set; }
        }


        [HttpGet]
        [Route("conversations")]
        public IHttpActionResult GetConversations()
        {
            int userId = GetCallerId();
            if (userId == 0) return Unauthorized();
            return Ok(_da.GetConversationPartners(userId));
        }
    }
}