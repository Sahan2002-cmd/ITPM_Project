using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using System.Web.Http.Cors;

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/admin/reports")]
    public class AdminReportController : ApiController
    {
        private readonly DAUser _daUser = new DAUser();
        private readonly DAInSessionMessage _daIn = new DAInSessionMessage();
        private readonly DAOutSessionMessage _daOut = new DAOutSessionMessage();
        private readonly DASessionNote _daNote = new DASessionNote();
        private readonly DAFileResource _daFile = new DAFileResource();

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

        private bool IsAdmin() => GetCallerRole() == "Admin";

        // ─────────────────────────────────────────────────────────────────
        //  JSON REPORTS
        // ─────────────────────────────────────────────────────────────────

        [HttpGet]
        [Route("students")]
        public IHttpActionResult GetAllStudents()
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            return Ok(_daUser.GetAllStudents());
        }

        [HttpGet]
        [Route("tutors")]
        public IHttpActionResult GetAllTutors()
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            return Ok(_daUser.GetAllTutors());
        }

        [HttpGet]
        [Route("insession")]
        public IHttpActionResult GetAllInSessionMessages(int? bookingId = null)
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            if (bookingId.HasValue)
                return Ok(_daIn.GetChatHistory(bookingId.Value));
            else
                return Ok(_daIn.GetAllMessages()); // you must implement GetAllMessages in DAInSessionMessage
        }

        [HttpGet]
        [Route("outsession")]
        public IHttpActionResult GetAllOutSessionMessages(int? bookingId = null)
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            if (bookingId.HasValue)
                return Ok(_daOut.GetThread(bookingId.Value));
            else
                return Ok(_daOut.GetAllMessages()); // implement in DAOutSessionMessage
        }

        [HttpGet]
        [Route("resources")]
        public IHttpActionResult GetAllFileResources(int? bookingId = null)
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            if (bookingId.HasValue)
                return Ok(_daFile.GetSessionFiles(bookingId.Value));
            else
                return Ok(_daFile.GetAllFiles()); // implement in DAFileResource
        }

        [HttpGet]
        [Route("sessionnotes")]
        public IHttpActionResult GetAllSessionNotes()
        {
            if (!IsAdmin()) return Content(HttpStatusCode.Forbidden, Response.Fail("Admin only."));
            return Ok(_daNote.GetAllNotesReport(0));
        }

        // ─────────────────────────────────────────────────────────────────
        //  PDF REPORTS
        // ─────────────────────────────────────────────────────────────────

        [HttpGet]
        [Route("students/pdf")]
        public HttpResponseMessage GetStudentsPdf()
        {
            if (!IsAdmin()) return Request.CreateErrorResponse(HttpStatusCode.Forbidden, "Admin only.");
            var res = _daUser.GetAllStudents();
            if (res.StatusCode != 1) return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, res.Message);
            var students = res.Data as List<UserModel>;
            byte[] pdf = PdfReportGenerator.GenerateUsersReport(students);
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(pdf);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = $"Students_Report_{System.DateTime.Now:yyyyMMdd}.pdf"
            };
            return response;
        }

        [HttpGet]
        [Route("tutors/pdf")]
        public HttpResponseMessage GetTutorsPdf()
        {
            if (!IsAdmin()) return Request.CreateErrorResponse(HttpStatusCode.Forbidden, "Admin only.");
            var res = _daUser.GetAllTutors();
            if (res.StatusCode != 1) return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, res.Message);
            var tutors = res.Data as List<UserModel>;
            byte[] pdf = PdfReportGenerator.GenerateUsersReport(tutors);
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(pdf);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = $"Tutors_Report_{System.DateTime.Now:yyyyMMdd}.pdf"
            };
            return response;
        }

        [HttpGet]
        [Route("sessionnotes/pdf")]
        public HttpResponseMessage GetSessionNotesPdf()
        {
            if (!IsAdmin()) return Request.CreateErrorResponse(HttpStatusCode.Forbidden, "Admin only.");
            var res = _daNote.GetAllNotesReport(0);
            if (res.StatusCode != 1) return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, res.Message);
            var notes = res.Data as List<SessionNoteModel>;
            byte[] pdf = PdfReportGenerator.GenerateSessionNotesReport(notes);
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(pdf);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = $"SessionNotes_Report_{System.DateTime.Now:yyyyMMdd}.pdf"
            };
            return response;
        }
    }
}