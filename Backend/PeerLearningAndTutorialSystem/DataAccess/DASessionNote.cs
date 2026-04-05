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
     *  DASessionNote — Member 3
     *  Stored Procedure : PLT_SESSION_NOTE_PROC
     *  Action Types:
     *    001 — Get note by booking (student reads after Completed)
     *    002 — Submit note (tutor only, within 24h of session end)
     *    003 — Edit note (tutor only, within 24h of submission)
     *    004 — Admin soft delete with reason
     *    005 — Get all notes report (Admin download)
     * ══════════════════════════════════════════════════════════════════════
     */
    public class DASessionNote : ISessionNote
    {
        private readonly string _proc = "PLT_SESSION_NOTE_PROC";
        private readonly DBConnect _db = new DBConnect();
        private readonly ProcedureDBModel _out = new ProcedureDBModel();

        // ── MAPPER ────────────────────────────────────────────────────────
        private SessionNoteModel MapRow(DataRow row)
        {
            return new SessionNoteModel
            {
                NoteId = Convert.ToInt32(row["noteId"]),
                BookingId = Convert.ToInt32(row["bookingId"]),
                TutorId = Convert.ToInt32(row["tutorId"]),
                TopicsCovered = row["topicsCovered"].ToString(),
                Homework = row["homework"] != DBNull.Value ? row["homework"].ToString() : null,
                NextSteps = row["nextSteps"] != DBNull.Value ? row["nextSteps"].ToString() : null,
                IsDeleted = Convert.ToBoolean(row["isDeleted"]),
                AdminDeleteReason = row["adminDeleteReason"] != DBNull.Value ? row["adminDeleteReason"].ToString() : null,
                CreatedBy = row["created_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["created_by"]) : null,
                CreatedAt = row["created_at"] != DBNull.Value ? row["created_at"].ToString() : null,
                UpdatedBy = row["updated_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["updated_by"]) : null,
                UpdatedAt = row["updated_at"] != DBNull.Value ? row["updated_at"].ToString() : null,
                TutorName = row.Table.Columns.Contains("tutorName") && row["tutorName"] != DBNull.Value
                                    ? row["tutorName"].ToString() : null
            };
        }

        // ════════════════════════════════════════════════════════════════
        //  001 — GET NOTE BY BOOKING
        //  Business rule: student can only read after session = Completed.
        //  Tutor can read their own submitted note anytime.
        // ════════════════════════════════════════════════════════════════
        public Response GetNoteByBooking(int bookingId)
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
                    if (dt.Rows.Count == 0)
                        return Response.Success(null, "No note submitted yet.");
                    return Response.Success(MapRow(dt.Rows[0]));
                }
                return Response.Fail(pMessage.Value?.ToString() ?? "Failed to load note.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  002 — SUBMIT NOTE
        //  Business rules:
        //    - Tutor only
        //    - Session must be Completed
        //    - Only one note per booking
        //    - Must be submitted within 24h of session ending
        // ════════════════════════════════════════════════════════════════
        public Response SubmitNote(SessionNoteRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.TopicsCovered))
                    return Response.Fail("Topics covered is required.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "002"),
                    new SqlParameter("@p_booking_id",  (object)request.BookingId ?? DBNull.Value),
                    new SqlParameter("@p_tutor_id",    (object)request.TutorId   ?? DBNull.Value),
                    new SqlParameter("@p_topics",      request.TopicsCovered.Trim()),
                    new SqlParameter("@p_homework",    string.IsNullOrWhiteSpace(request.Homework)  ? (object)DBNull.Value : request.Homework.Trim()),
                    new SqlParameter("@p_next_steps",  string.IsNullOrWhiteSpace(request.NextSteps) ? (object)DBNull.Value : request.NextSteps.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Session note submitted.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Submit failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  003 — EDIT NOTE
        //  Business rule: tutor only, within 24 hours of submission.
        //  After 24h the note is locked — SP returns error.
        // ════════════════════════════════════════════════════════════════
        public Response EditNote(SessionNoteRequestApi request, int tutorId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "003"),
                    new SqlParameter("@p_note_id",     (object)request.NoteId   ?? DBNull.Value),
                    new SqlParameter("@p_tutor_id",    tutorId),
                    new SqlParameter("@p_topics",      string.IsNullOrWhiteSpace(request.TopicsCovered) ? (object)DBNull.Value : request.TopicsCovered.Trim()),
                    new SqlParameter("@p_homework",    string.IsNullOrWhiteSpace(request.Homework)       ? (object)DBNull.Value : request.Homework.Trim()),
                    new SqlParameter("@p_next_steps",  string.IsNullOrWhiteSpace(request.NextSteps)      ? (object)DBNull.Value : request.NextSteps.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Note updated.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Edit failed. Note may be locked after 24h.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  004 — ADMIN SOFT DELETE
        //  Business rule: Admin only. Reason must be provided.
        //  Soft delete — note stays in DB, isDeleted = 1.
        // ════════════════════════════════════════════════════════════════
        public Response AdminDeleteNote(SessionNoteRequestApi request, int adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AdminDeleteReason))
                    return Response.Fail("Deletion reason is required.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "004"),
                    new SqlParameter("@p_note_id",     (object)request.NoteId ?? DBNull.Value),
                    new SqlParameter("@p_admin_reason", request.AdminDeleteReason.Trim()),
                    new SqlParameter("@p_admin_id",    adminId),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Note deleted by admin.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Delete failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  005 — GET ALL NOTES REPORT (Admin download)
        //  Returns all session notes with tutor name, student name,
        //  subject, booking date — used by ReportController for PDF.
        // ════════════════════════════════════════════════════════════════
        public Response GetAllNotesReport(int adminId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "005"),
                    new SqlParameter("@p_admin_id",    adminId),
                    pStatus, pMessage
                };

                DataTable dt = _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                if (code == "1")
                {
                    var list = new List<SessionNoteModel>();
                    foreach (DataRow row in dt.Rows)
                        list.Add(MapRow(row));
                    return Response.Success(list);
                }
                return Response.Fail(pMessage.Value?.ToString() ?? "Failed to load report.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }
    }
}