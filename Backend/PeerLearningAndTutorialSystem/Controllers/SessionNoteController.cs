using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║               SESSION NOTE API ENDPOINTS  — Member 3                   ║
 * ║           Base URL: https://localhost:44331/api/sessionnote              ║
 * ╠══════════════╦════════════════════════════════════════╦════════════════╣
 * ║ Method       ║ Endpoint                               ║ Access         ║
 * ╠══════════════╬════════════════════════════════════════╬════════════════╣
 * ║ GET          ║ /api/sessionnote/{bookingId}            ║ Student|Tutor  ║
 * ║ POST         ║ /api/sessionnote/submit                 ║ Tutor only     ║
 * ║ PUT          ║ /api/sessionnote/edit                   ║ Tutor only     ║
 * ║ DELETE       ║ /api/sessionnote/admin-delete           ║ Admin only     ║
 * ║ GET          ║ /api/sessionnote/report/download        ║ Admin only     ║
 * ╚══════════════╩════════════════════════════════════════╩════════════════╝
 *
 * Business rules enforced here:
 *   - Submit: Tutor only (role check)
 *   - Student reads note: only after session = Completed (enforced in SP)
 *   - Edit: Tutor only, within 24h (enforced in SP)
 *   - Admin delete: Admin only, reason required (enforced in DA)
 *   - Report download: Admin only, returns PDF
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/sessionnote")]
    public class SessionNoteController : ApiController
    {
        private readonly DASessionNote _da = new DASessionNote();

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
        //  GET  /api/sessionnote/{bookingId}
        //  Student reads note — only visible after session = Completed.
        //  Tutor can also read their own submitted note.
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{bookingId:int}")]
        public IHttpActionResult GetNote(int bookingId)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            string role = GetCallerRole();
            if (role == "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Use the report endpoint for admin access."));

            return Ok(_da.GetNoteByBooking(bookingId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/sessionnote/submit
        //  Tutor submits session note after session ends.
        //  Business rules (enforced in SP):
        //    - Session must be Completed
        //    - Only one note per booking
        //    - Must be within 24h of session end
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("submit")]
        public IHttpActionResult SubmitNote([FromBody] SessionNoteRequestApi request)
        {
            int callerId = GetCallerId();
            string callerRole = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (callerRole != "Tutor")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Tutor only."));

            if (request == null)
                return BadRequest("Request body is required.");

            // Always set TutorId from JWT — not from request body
            request.TutorId = callerId;

            return Ok(_da.SubmitNote(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/sessionnote/edit
        //  Tutor edits note within 24-hour window.
        //  After 24h, SP returns error — note is locked.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("edit")]
        public IHttpActionResult EditNote([FromBody] SessionNoteRequestApi request)
        {
            int callerId = GetCallerId();
            string callerRole = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (callerRole != "Tutor")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Tutor only."));

            if (request == null || request.NoteId == null)
                return BadRequest("NoteId is required.");

            return Ok(_da.EditNote(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/sessionnote/admin-delete
        //  Admin soft-deletes a note with mandatory reason.
        //  Record stays in DB — isDeleted = 1, adminDeleteReason saved.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("admin-delete")]
        public IHttpActionResult AdminDeleteNote([FromBody] SessionNoteRequestApi request)
        {
            int callerId = GetCallerId();
            string callerRole = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (callerRole != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            if (request == null || request.NoteId == null)
                return BadRequest("NoteId and AdminDeleteReason are required.");

            return Ok(_da.AdminDeleteNote(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  GET  /api/sessionnote/report/download
        //  Admin downloads all session notes as a PDF report.
        //  Returns: application/pdf binary stream.
        //
        //  PDF columns: Tutor | Student | Subject | Booking Date |
        //               Topics Covered | Homework | Next Steps | Submitted At
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("report/download")]
        public IHttpActionResult DownloadReport()
        {
            int callerId = GetCallerId();
            string callerRole = GetCallerRole();

            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (callerRole != "Admin")
                return Content(HttpStatusCode.Forbidden, Response.Fail("Access denied. Admin only."));

            // Fetch data from DB
            Response dataResponse = _da.GetAllNotesReport(callerId);

            if (dataResponse.StatusCode != 1)
                return Content(HttpStatusCode.InternalServerError, dataResponse);

            var notes = dataResponse.Data as List<SessionNoteModel>;
            if (notes == null || notes.Count == 0)
                return Content(HttpStatusCode.NotFound, Response.Fail("No session notes found."));

            // Build PDF using PdfReportGenerator
            byte[] pdfBytes = PdfReportGenerator.GenerateSessionNotesReport(notes);

            // Return as downloadable PDF
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(pdfBytes)
            };
            response.Content.Headers.ContentType =
                new MediaTypeHeaderValue("application/pdf");
            response.Content.Headers.ContentDisposition =
                new ContentDispositionHeaderValue("attachment")
                {
                    FileName = $"SessionNotes_Report_{System.DateTime.Now:yyyyMMdd}.pdf"
                };

            return ResponseMessage(response);
        }
    }
}