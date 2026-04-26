using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using System.Web.Http.Cors;

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/recording")]
    public class RecordingController : ApiController
    {
        private readonly DARecording _da = new DARecording();

        private int GetCallerUserId()
        {
            if (!Request.Headers.Contains("Authorization")) return 0;
            var bearer = Request.Headers.GetValues("Authorization").FirstOrDefault();
            if (string.IsNullOrEmpty(bearer)) return 0;
            return new JwtHelper().GetUserIdFromToken(bearer.Replace("Bearer ", "").Trim());
        }

        [HttpPost]
        [Route("upload")]
        public IHttpActionResult UploadRecording(RecordingRequestApi request)
        {
            int callerId = GetCallerUserId();
            if (callerId == 0) return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));

            var recording = new RecordingModel
            {
                BookingId = request.BookingId,
                TutorId = callerId,
                Title = request.Title,
                Subject = request.Subject,
                Description = request.Description,
                VideoUrl = request.VideoUrl,
                ThumbnailUrl = request.ThumbnailUrl,
                Duration = request.Duration
            };

            return Ok(_da.SaveRecording(recording));
        }

        [HttpGet]
        [Route("student/{studentId:int}")]
        public IHttpActionResult GetStudentRecordings(int studentId)
        {
            int callerId = GetCallerUserId();
            if (callerId == 0) return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));
            if (callerId != studentId) return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied."));

            return Ok(_da.GetRecordingsByStudent(studentId));
        }

        [HttpGet]
        [Route("{id}")]
        public IHttpActionResult GetRecording(string id)
        {
            if (GetCallerUserId() == 0) return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized."));
            return Ok(_da.GetRecordingById(id));
        }
    }
}
