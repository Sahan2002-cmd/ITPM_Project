using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute    = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute   = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute    = System.Web.Http.HttpPutAttribute;
using RouteAttribute      = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  RATING API ENDPOINTS — Module 4                                    ║
 * ║  Base URL: http://localhost:55708/api/rating                         ║
 * ╠════════════╦══════════════════════════════╦══════════════════╡
 * ║ POST         ║ /create                                  ║ Student only    ║
 * ║ POST         ║ /evaluate                               ║ Tutor only      ║
 * ║ GET          ║ /tutor/{tutorProfileId}                  ║ Any authed      ║
 * ║ GET          ║ /student/{studentId}                     ║ Any authed      ║
 * ║ GET          ║ /admin/pending                           ║ Admin only      ║
 * ║ PUT          ║ /admin/moderate/{ratingId}               ║ Admin only      ║
 * ║ GET          ║ /evaluation/student/{studentId}         ║ Any authed      ║
 * ║ GET          ║ /evaluation/tutor/{tutorId}             ║ Any authed      ║
 * ╚════════════╩══════════════════════════════╩══════════════════╝
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/rating")]
    public class RatingController : ApiController
    {
        private readonly DARating _da = new DARating();

        // ── JWT helpers ─────────────────────────────────────────────────────
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
        // POST  /api/rating/create
        // Student only. Stars 1–5 enforced here.
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("create")]
        public IHttpActionResult CreateRating([FromBody] RatingRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            string role = GetCallerRole();
            if (role != "Student")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only students can submit a tutor rating."));

            if (request.Stars < 1 || request.Stars > 5)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Star rating must be between 1 and 5."));

            if (request.Feedback != null && request.Feedback.Length > 1000)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Feedback must not exceed 1000 characters."));

            var result = _da.CreateRating(request);
            return result.StatusCode == 1
                ? Content(HttpStatusCode.Created, result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // POST  /api/rating/evaluate
        // Tutor only. Each factor score 1–5 enforced here.
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("evaluate")]
        public IHttpActionResult CreateEvaluation([FromBody] StudentEvaluationRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            string role = GetCallerRole();
            if (role != "Tutor")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only tutors can submit a student evaluation."));

            // Validate each factor is in range 1.0 – 5.0
            decimal[] factors = {
                request.Attendance, request.Participation, request.Understanding,
                request.Behavior,   request.AssignmentCompletion
            };
            foreach (var f in factors)
            {
                if (f < 1m || f > 5m)
                    return Content(HttpStatusCode.BadRequest,
                        Response.Fail("Each evaluation score must be between 1.0 and 5.0."));
            }

            var result = _da.CreateEvaluation(request);
            return result.StatusCode == 1
                ? Content(HttpStatusCode.Created, result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/tutor/{tutorProfileId}
        // Returns only Approved ratings — safe for public display.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("tutor/{tutorProfileId}")]
        public IHttpActionResult GetRatingsByTutor(string tutorProfileId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var result = _da.GetRatingsByTutor(tutorProfileId);
            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/student/{studentId}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("student/{studentId:int}")]
        public IHttpActionResult GetRatingsByStudent(int studentId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var result = _da.GetRatingsByStudent(studentId);
            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/rating/update/{ratingId}  — Student only
        // Edits Stars + Feedback while status is still "Pending Approval".
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("update/{ratingId:int}")]
        public IHttpActionResult UpdateRating(int ratingId, [FromBody] UpdateRatingRequestApi request)
        {
            if (request == null) return BadRequest("Request body is required.");

            string role = GetCallerRole();
            if (role != "Student")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Only students can edit a rating."));

            if (request.Stars < 1 || request.Stars > 5)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Star rating must be between 1 and 5."));

            if (request.Feedback != null && request.Feedback.Length > 1000)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("Feedback must not exceed 1000 characters."));

            var result = _da.UpdateRating(ratingId, GetCallerId(), request);
            return result.StatusCode == 1
                ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/admin/pending  — Admin only
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("admin/pending")]
        public IHttpActionResult GetPendingFeedback()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetPendingFeedback());
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/admin/all  — Admin only — all statuses
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("admin/all")]
        public IHttpActionResult GetAllRatings()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetAllRatings());
        }

        // ════════════════════════════════════════════════════════════════
        // PUT  /api/rating/admin/moderate/{ratingId}  — Admin only
        // Body (query param): ?status=Approved  OR  ?status=Rejected
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("admin/moderate/{ratingId:int}")]
        public IHttpActionResult ModerateFeedback(int ratingId, [FromUri] string status)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            if (string.IsNullOrWhiteSpace(status))
                return BadRequest("Query parameter 'status' is required (Approved | Rejected).");

            var result = _da.ModerateFeedback(ratingId, status);
            return result.StatusCode == 1
                ? (IHttpActionResult)Ok(result)
                : Content(HttpStatusCode.BadRequest, result);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/evaluation/student/{studentId}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("evaluation/student/{studentId:int}")]
        public IHttpActionResult GetEvaluationsByStudent(int studentId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            return Ok(_da.GetEvaluationsByStudent(studentId));
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/rating/evaluation/tutor/{tutorId}
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("evaluation/tutor/{tutorId:int}")]
        public IHttpActionResult GetEvaluationsByTutor(int tutorId)
        {
            if (GetCallerId() == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            return Ok(_da.GetEvaluationsByTutor(tutorId));
        }
    }
}