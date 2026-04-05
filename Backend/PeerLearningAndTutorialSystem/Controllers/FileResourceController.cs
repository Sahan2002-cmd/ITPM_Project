using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.Cors;

using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

/*
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║               FILE RESOURCE API ENDPOINTS  — Member 3                  ║
 * ║           Base URL: https://localhost:44331/api/fileresource             ║
 * ╠══════════════╦═══════════════════════════════════╦══════════════════════╣
 * ║ Method       ║ Endpoint                          ║ Access               ║
 * ╠══════════════╬═══════════════════════════════════╬══════════════════════╣
 * ║ GET          ║ /api/fileresource/{bookingId}      ║ Student | Tutor     ║
 * ║ POST         ║ /api/fileresource/upload           ║ Student | Tutor     ║
 * ║ PUT          ║ /api/fileresource/rename           ║ Student | Tutor     ║
 * ║ DELETE       ║ /api/fileresource/{id}             ║ Student | Tutor     ║
 * ╚══════════════╩═══════════════════════════════════╩══════════════════════╝
 *
 * Business rules enforced here:
 *   - Max file size 5MB (validated in DA + here)
 *   - Allowed types: pdf, docx, png, jpg, jpeg
 *   - Physical files saved to ~/Uploads/Sessions/{bookingId}/
 *   - Rename: uploader only (enforced in SP)
 *   - Delete: uploader only (enforced in SP)
 */

namespace PeerLearningAndTutorialSystem.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/fileresource")]
    public class FileResourceController : ApiController
    {
        private readonly DAFileResource _da = new DAFileResource();

        private readonly string[] _allowedTypes = { "pdf", "docx", "png", "jpg", "jpeg" };
        private const long MaxBytes = 5 * 1024 * 1024;

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
        //  GET  /api/fileresource/{bookingId}
        //  Returns all files for the session (Materials Library).
        // ════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("{bookingId:int}")]
        public IHttpActionResult GetSessionFiles(int bookingId)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.GetSessionFiles(bookingId));
        }

        // ════════════════════════════════════════════════════════════════
        //  POST  /api/fileresource/upload
        //  Accepts multipart/form-data.
        //  Saves physical file then stores metadata in DB via DA.
        //
        //  Form fields:
        //    file       — the actual file (multipart)
        //    bookingId  — int
        //    uploadedBy — int (overridden by JWT callerId)
        // ════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("upload")]
        public async Task<IHttpActionResult> UploadFile()
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (!Request.Content.IsMimeMultipartContent())
                return BadRequest("Request must be multipart/form-data.");

            // Read multipart
            var provider = new MultipartMemoryStreamProvider();
            await Request.Content.ReadAsMultipartAsync(provider);

            HttpContent filePart = null;
            string bookingIdStr = null;

            foreach (var part in provider.Contents)
            {
                string fieldName = part.Headers.ContentDisposition.Name?.Trim('"');
                if (fieldName == "file")
                    filePart = part;
                else if (fieldName == "bookingId")
                    bookingIdStr = await part.ReadAsStringAsync();
            }

            if (filePart == null)
                return BadRequest("No file found in request.");

            if (!int.TryParse(bookingIdStr, out int bookingId))
                return BadRequest("bookingId is required.");

            // Read file bytes
            byte[] fileBytes = await filePart.ReadAsByteArrayAsync();

            if (fileBytes.Length > MaxBytes)
                return Content(HttpStatusCode.BadRequest, Response.Fail("File exceeds 5MB limit."));

            string originalName = filePart.Headers.ContentDisposition.FileName?.Trim('"') ?? "file";
            string ext = Path.GetExtension(originalName).TrimStart('.').ToLower();

            if (!System.Array.Exists(_allowedTypes, t => t == ext))
                return Content(HttpStatusCode.BadRequest, Response.Fail("Invalid file type. Allowed: pdf, docx, png, jpg, jpeg."));

            // Save physical file
            string uploadFolder = HttpContext.Current.Server.MapPath($"~/Uploads/Sessions/{bookingId}/");
            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);

            string safeFileName = $"{System.Guid.NewGuid()}_{originalName}";
            string fullPath = Path.Combine(uploadFolder, safeFileName);
            File.WriteAllBytes(fullPath, fileBytes);

            // Save metadata to DB
            string relativePath = $"/Uploads/Sessions/{bookingId}/{safeFileName}";
            var request = new FileResourceRequestApi
            {
                BookingId = bookingId,
                UploadedBy = callerId,
                FileName = originalName,
                FilePath = relativePath,
                FileSize = fileBytes.Length,
                FileType = ext
            };

            return Ok(_da.UploadFile(request));
        }

        // ════════════════════════════════════════════════════════════════
        //  PUT  /api/fileresource/rename
        //  Renames a file. Uploader only.
        // ════════════════════════════════════════════════════════════════
        [HttpPut]
        [Route("rename")]
        public IHttpActionResult RenameFile([FromBody] FileResourceRequestApi request)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            if (request == null || request.FileId == null)
                return BadRequest("FileId and FileName are required.");

            return Ok(_da.RenameFile(request, callerId));
        }

        // ════════════════════════════════════════════════════════════════
        //  DELETE  /api/fileresource/{id}
        //  Deletes a file record. Uploader only.
        // ════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteFile(int id)
        {
            int callerId = GetCallerId();
            if (callerId == 0)
                return Content(HttpStatusCode.Unauthorized, Response.Fail("Unauthorized. Please log in."));

            return Ok(_da.DeleteFile(id, callerId));
        }
    }
}