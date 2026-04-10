using MongoDB.Driver;
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
using RouteAttribute      = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              BOOKING API ENDPOINTS  — Module 2                             ║
 * ║          Base URL: https://localhost:44331/api/booking                       ║
 * ╠══════════════╦══════════════════════════════════════════╦══════════════════╣
 * ║ POST         ║ /create                                  ║ Student only     ║
 * ║ GET          ║ /student/{studentId}                     ║ Student / Admin  ║
 * ║ GET          ║ /tutor/{tutorId}                         ║ Tutor / Admin    ║
 * ║ PUT          ║ /accept/{bookingId}                      ║ Tutor only       ║
 * ║ PUT          ║ /decline/{bookingId}                     ║ Tutor only       ║
 * ║ PUT          ║ /cancel/{bookingId}                      ║ Student only     ║
 * ║ PUT          ║ /complete/{bookingId}                    ║ Tutor / Admin    ║
 * ╚══════════════╩══════════════════════════════════════════╩══════════════════╝
 *
 * Business rules enforced here:
 *   - Create:  status forced to "Pending".
 *   - Accept:  updates booking to "Confirmed" and slot to "Booked" (via DA).
 *              Triggers in-DB notification for the student.
 *   - Decline: updates booking to "Declined"; slot stays "Free".
 *              Triggers in-DB notification for the student.
 *   - Cancel:  ONLY allowed when (StartTime - UtcNow) > 2 hours; returns HTTP 400
 *              otherwise.  Slot reverts to "Free".
 *              Triggers in-DB notification for the tutor.
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/booking")]
    public class BookingController : ApiController
    {
        private readonly DABooking      _da     = new DABooking();
        private readonly DANotification _daNotif = new DANotification();

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

        // ── Notification helper ───────────────────────────────────────────
        /// <summary>
        /// Persists a notification record in the DB and marks where real-time
        /// and email triggers would be dispatched.
        /// </summary>
        private void NotifyUser(int userId, string title, string message,
                                string type, string relatedBookingId)
        {
            _daNotif.CreateNotification(new NotificationRequestApi
            {
                UserId           = userId,
                Title            = title,
                Message          = message,
                Type             = type,
                RelatedBookingId = relatedBookingId
            });

            // TODO – SignalR push:
            //   var hub = GlobalHost.ConnectionManager.GetHubContext<NotificationHub>();
            //   hub.Clients.User(userId.ToString()).receiveNotification(title, message);

            // TODO – Email trigger:
            //   EmailService.Send(recipientEmail, subject: title, body: message);
        }

        // ════════════════════════════════════════════════════════════════
        // POST  /api/booking/create
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("create")]
        public IHttpActionResult CreateBooking([FromBody] BookingRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            if (GetCallerRole() != "Student")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only students can create bookings."));

            // Caller must only book for themselves
            if (request.StudentId != GetCallerId())
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("You can only create bookings for your own account."));

            var result = _da.CreateBooking(request);
            return result.StatusCode == 1
                ? Content(HttpStatusCode.Created, result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/booking/student/{studentId}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("student/{studentId:int}")]
        public IHttpActionResult GetByStudent(int studentId)
        {
            string role     = GetCallerRole();
            int    callerId = GetCallerId();

            if (role != "Admin" && callerId != studentId)
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("You can only view your own bookings."));

            return Ok(_da.GetByStudent(studentId));
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/booking/tutor/{tutorId}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("tutor/{tutorId:int}")]
        public IHttpActionResult GetByTutor(int tutorId)
        {
            string role     = GetCallerRole();
            int    callerId = GetCallerId();

            if (role != "Admin" && callerId != tutorId)
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("You can only view your own bookings."));

            return Ok(_da.GetByTutor(tutorId));
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/booking/accept/{bookingId}
        // Tutor accepts → "Confirmed" + slot → "Booked" + notify student
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("accept/{bookingId:int}")]
        public IHttpActionResult AcceptBooking(int bookingId)
        {
            if (GetCallerRole() != "Tutor" && GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors can accept bookings."));

            var result = _da.AcceptBooking(bookingId);
            if (result.StatusCode != 1)
                return Content(HttpStatusCode.BadRequest, result);

            NotifyUser(
                userId:           GetStudentIdFromBooking(bookingId),
                title:            "Booking Confirmed",
                message:          $"Your booking (ID: {bookingId}) has been confirmed by your tutor.",
                type:             "BookingAccepted",
                relatedBookingId: bookingId.ToString());

            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/booking/decline/{bookingId}
        // Tutor declines → "Declined" + slot stays "Free" + notify student
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("decline/{bookingId:int}")]
        public IHttpActionResult DeclineBooking(int bookingId)
        {
            if (GetCallerRole() != "Tutor" && GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors can decline bookings."));

            var result = _da.DeclineBooking(bookingId);
            if (result.StatusCode != 1)
                return Content(HttpStatusCode.BadRequest, result);

            NotifyUser(
                userId:           GetStudentIdFromBooking(bookingId),
                title:            "Booking Declined",
                message:          $"Your booking request (ID: {bookingId}) was declined by the tutor.",
                type:             "BookingDeclined",
                relatedBookingId: bookingId.ToString());

            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/booking/cancel/{bookingId}
        // Student cancels.  Returns HTTP 400 if < 2 hours until session.
        // On success: "Cancelled" + slot → "Free" + notify tutor
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("cancel/{bookingId:int}")]
        public IHttpActionResult CancelBooking(int bookingId)
        {
            if (GetCallerRole() != "Student")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only students can cancel bookings."));

            // ── Controller-level 2-hour gate ─────────────────────────────
            var daTemp       = new DABooking();
            var allByStudent = daTemp.GetByStudent(GetCallerId());
            if (allByStudent.StatusCode != 1)
                return Content(HttpStatusCode.InternalServerError, allByStudent);

            var bookings = allByStudent.Data as System.Collections.Generic.List<BookingModel>;
            var target   = bookings?.Find(b => b.BookingId == bookingId);

            if (target == null)
                return Content(HttpStatusCode.NotFound,
                    Response.Fail("Booking not found or does not belong to you."));

            double hoursRemaining = (target.StartTime - DateTime.UtcNow).TotalHours;
            if (hoursRemaining < 2)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail(
                        $"Cancellation is not allowed within 2 hours of the session. " +
                        $"Session starts in {hoursRemaining:F1} hour(s)."));

            var result = _da.CancelBooking(bookingId);
            if (result.StatusCode != 1)
                return Content(HttpStatusCode.BadRequest, result);

            NotifyUser(
                userId:           target.TutorId,
                title:            "Booking Cancelled",
                message:          $"Student cancelled booking (ID: {bookingId}).",
                type:             "BookingCancelled",
                relatedBookingId: bookingId.ToString());

            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/booking/complete/{bookingId}
        // Tutor or Admin marks a session as completed.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("complete/{bookingId:int}")]
        public IHttpActionResult CompleteBooking(int bookingId)
        {
            string role = GetCallerRole();
            if (role != "Tutor" && role != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors or admins can mark a booking as completed."));

            var result = _da.CompleteBooking(bookingId);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ── Private helper: look up studentId from a bookingId ───────────
        // Used to address the notification to the correct recipient.
        private int GetStudentIdFromBooking(int bookingId)
        {
            try
            {
                var ctx     = new DatabaseConnectivity.MongoDBContext();
                var col     = ctx.GetCollection<BookingModel>("Bookings");
                var booking = col.Find(b => b.BookingId == bookingId).FirstOrDefault();
                return booking?.StudentId ?? 0;
            }
            catch { return 0; }
        }
    }
}
