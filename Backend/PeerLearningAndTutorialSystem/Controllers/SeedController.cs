using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using RouteAttribute    = System.Web.Http.RouteAttribute;

/*
 * DEV-ONLY seed endpoint.
 * POST  /api/seed/run
 *
 * Triggers SeedData.RunIfEmpty() on demand without restarting IIS Express.
 * Safe to call multiple times — the guard inside RunIfEmpty skips if
 * TutorProfiles collection is already populated.
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/seed")]
    public class SeedController : ApiController
    {
        [HttpPost]
        [Route("run")]
        public IHttpActionResult Run()
        {
            SeedData.RunIfEmpty();
            return Content(HttpStatusCode.OK, new
            {
                Message = "Seed executed. Check Visual Studio Output window (Debug) for [SEED] log lines."
            });
        }
    }
}
