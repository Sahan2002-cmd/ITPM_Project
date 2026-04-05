using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /*
     * ══════════════════════════════════════════════════════════════════════
     *  DAFileResource — Member 3
     *  Stored Procedure : PLT_FILE_RESOURCE_PROC
     *  Action Types:
     *    001 — Get all files for a session (Materials Library)
     *    002 — Upload a file (save metadata)
     *    003 — Rename file (uploader only)
     *    004 — Delete file (uploader or tutor)
     * ══════════════════════════════════════════════════════════════════════
     */
    public class DAFileResource : IFileResource
    {
        private readonly string _proc = "PLT_FILE_RESOURCE_PROC";
        private readonly DBConnect _db = new DBConnect();
        private readonly ProcedureDBModel _out = new ProcedureDBModel();

        // Allowed file types (enforced in SP too — double validation)
        private readonly string[] _allowedTypes = { "pdf", "docx", "png", "jpg", "jpeg" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

        // ── MAPPER ────────────────────────────────────────────────────────
        private FileResourceModel MapRow(DataRow row)
        {
            return new FileResourceModel
            {
                FileId = Convert.ToInt32(row["fileId"]),
                BookingId = Convert.ToInt32(row["bookingId"]),
                UploadedBy = Convert.ToInt32(row["uploadedBy"]),
                FileName = row["fileName"].ToString(),
                FilePath = row["filePath"].ToString(),
                FileSize = Convert.ToInt64(row["fileSize"]),
                FileType = row["fileType"].ToString(),
                IsDeleted = Convert.ToBoolean(row["isDeleted"]),
                CreatedBy = row["created_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["created_by"]) : null,
                CreatedAt = row["created_at"] != DBNull.Value ? row["created_at"].ToString() : null,
                UpdatedBy = row["updated_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["updated_by"]) : null,
                UpdatedAt = row["updated_at"] != DBNull.Value ? row["updated_at"].ToString() : null,
                UploaderName = row.Table.Columns.Contains("uploaderName") && row["uploaderName"] != DBNull.Value
                               ? row["uploaderName"].ToString() : null
            };
        }

        // ════════════════════════════════════════════════════════════════
        //  001 — GET SESSION FILES (Materials Library)
        //  Returns all active (non-deleted) files for a session.
        // ════════════════════════════════════════════════════════════════
        public Response GetSessionFiles(int bookingId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "001"),
                    new SqlParameter("@p_booking_id",  bookingId),
                    pStatus, pMessage
                };

                DataTable dt = _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                if (code == "1")
                {
                    var list = new List<FileResourceModel>();
                    foreach (DataRow row in dt.Rows)
                        list.Add(MapRow(row));
                    return Response.Success(list);
                }
                return Response.Fail(pMessage.Value?.ToString() ?? "Failed to load files.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  002 — UPLOAD FILE (save metadata)
        //  Business rules:
        //    - Max 5 MB
        //    - Allowed types: pdf, docx, png, jpg, jpeg
        //    - Physical file is saved by the controller before calling this
        //    - This saves the metadata (name, path, size, type) to DB
        // ════════════════════════════════════════════════════════════════
        public Response UploadFile(FileResourceRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FileName))
                    return Response.Fail("File name is required.");

                if (string.IsNullOrWhiteSpace(request.FilePath))
                    return Response.Fail("File path is required.");

                if (request.FileSize.HasValue && request.FileSize.Value > MaxFileSizeBytes)
                    return Response.Fail("File exceeds 5MB limit.");

                string type = request.FileType?.ToLower().Trim();
                if (string.IsNullOrWhiteSpace(type) || !Array.Exists(_allowedTypes, t => t == type))
                    return Response.Fail("Invalid file type. Allowed: pdf, docx, png, jpg, jpeg.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "002"),
                    new SqlParameter("@p_booking_id",  (object)request.BookingId  ?? DBNull.Value),
                    new SqlParameter("@p_uploaded_by", (object)request.UploadedBy ?? DBNull.Value),
                    new SqlParameter("@p_file_name",   request.FileName.Trim()),
                    new SqlParameter("@p_file_path",   request.FilePath.Trim()),
                    new SqlParameter("@p_file_size",   (object)request.FileSize   ?? DBNull.Value),
                    new SqlParameter("@p_file_type",   type),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "File uploaded successfully.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Upload failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  003 — RENAME FILE
        //  Business rule: only the uploader can rename their own file.
        // ════════════════════════════════════════════════════════════════
        public Response RenameFile(FileResourceRequestApi request, int callerId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FileName))
                    return Response.Fail("New file name is required.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "003"),
                    new SqlParameter("@p_file_id",     (object)request.FileId ?? DBNull.Value),
                    new SqlParameter("@p_uploaded_by", callerId),
                    new SqlParameter("@p_file_name",   request.FileName.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "File renamed.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Rename failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  004 — DELETE FILE
        //  Business rule: uploader or tutor of the session can delete.
        //  Removes from DB. Physical file deletion handled in controller.
        // ════════════════════════════════════════════════════════════════
        public Response DeleteFile(int fileId, int callerId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "004"),
                    new SqlParameter("@p_file_id",     fileId),
                    new SqlParameter("@p_uploaded_by", callerId),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "File deleted.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Delete failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }
    }
}