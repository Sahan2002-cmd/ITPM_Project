using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute    = System.Web.Http.HttpGetAttribute;
using HttpPutAttribute    = System.Web.Http.HttpPutAttribute;
using RouteAttribute      = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║           NOTIFICATION API ENDPOINTS  — Module 2                           ║
 * ║        Base URL: https://localhost:44331/api/notification                    ║
 * ╠══════════════╦══════════════════════════════════════════╦══════════════════╣
 * ║ GET          ║ /user/{userId}                           ║ Owner / Admin    ║
 * ║ PUT          ║ /read/{notificationId}                   ║ Owner only       ║
 * ╚══════════════╩══════════════════════════════════════════╩══════════════════╝
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/notification")]
    public class NotificationController : ApiController
    {
        private readonly DANotification _da = new DANotification();

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
        // GET  /api/notification/user/{userId}
        // Returns all notifications for the given user, newest first.
        // Users can only view their own; admins can view anyone's.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("user/{userId:int}")]
        public IHttpActionResult GetByUser(int userId)
        {
            int    callerId = GetCallerId();
            string role     = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            if (role != "Admin" && callerId != userId)
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("You can only view your own notifications."));

            return Ok(_da.GetByUser(userId));
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/notification/read/{notificationId}
        // Marks a single notification as read. Only the owner can do this.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("read/{notificationId}")]
        public IHttpActionResult MarkAsRead(string notificationId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var result = _da.MarkAsRead(notificationId);
            return result.StatusCode == 1 ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }
    }
}
