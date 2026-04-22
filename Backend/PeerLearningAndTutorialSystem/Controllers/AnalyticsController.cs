using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using RouteAttribute   = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ANALYTICS API ENDPOINTS — Module 4                                ║
 * ║  Base URL: http://localhost:44331/api/analytics                     ║
 * ╠════════════╦══════════════════════════════╦══════════════════╡
 * ║ GET          ║ /summary                                ║ Admin only      ║
 * ║ GET          ║ /subjects                               ║ Admin only      ║
 * ║ GET          ║ /top-tutors[?topN=10]                   ║ Admin only      ║
 * ║ GET          ║ /engagement                             ║ Admin only      ║
 * ╚════════════╩══════════════════════════════╩══════════════════╝
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/analytics")]
    public class AnalyticsController : ApiController
    {
        private readonly DAAnalytics _da = new DAAnalytics();

        // ── JWT helpers ─────────────────────────────────────────────────────
        private string GetCallerRole()
        {
            if (!Request.Headers.Contains("Authorization")) return null;
            var v = Request.Headers.GetValues("Authorization").FirstOrDefault();
            string token = string.IsNullOrEmpty(v) ? null : v.Replace("Bearer ", "").Trim();
            return string.IsNullOrEmpty(token) ? null : new JwtHelper().GetRoleFromToken(token);
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/analytics/summary
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("summary")]
        public IHttpActionResult GetSummary()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetSummary());
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/analytics/subjects
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("subjects")]
        public IHttpActionResult GetSubjectPopularity()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetSubjectPopularity());
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/analytics/top-tutors?topN=10
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("top-tutors")]
        public IHttpActionResult GetTopRatedTutors([FromUri] int topN = 10)
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            if (topN < 1 || topN > 100)
                return Content(HttpStatusCode.BadRequest,
                    Response.Fail("topN must be between 1 and 100."));

            return Ok(_da.GetTopRatedTutors(topN));
        }

        // ════════════════════════════════════════════════════════════════
        // GET  /api/analytics/engagement
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("engagement")]
        public IHttpActionResult GetStudentEngagement()
        {
            if (GetCallerRole() != "Admin")
                return Content(HttpStatusCode.Forbidden,
                    Response.Fail("Access denied. Admin only."));

            return Ok(_da.GetStudentEngagement());
        }
    }
}