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
     *  DAOutSessionMessage — Member 3
     *  Stored Procedure : PLT_OUT_SESSION_MESSAGE_PROC
     *  Action Types:
     *    001 — Get thread for a booking
     *    002 — Send out-session message
     *    003 — Edit own message (within 30 minutes)
     *    004 — Soft delete own message
     *    005 — Mark all as read (receiver)
     *    006 — Admin delete with reason
     * ══════════════════════════════════════════════════════════════════════
     */
    public class DAOutSessionMessage : IOutSessionMessage
    {
        private readonly string _proc = "PLT_OUT_SESSION_MESSAGE_PROC";
        private readonly DBConnect _db = new DBConnect();
        private readonly ProcedureDBModel _out = new ProcedureDBModel();

        // ── MAPPER ────────────────────────────────────────────────────────
        private OutSessionMessageModel MapRow(DataRow row)
        {
            return new OutSessionMessageModel
            {
                OutMessageId = Convert.ToInt32(row["outMessageId"]),
                BookingId = Convert.ToInt32(row["bookingId"]),
                SenderId = Convert.ToInt32(row["senderId"]),
                ReceiverId = Convert.ToInt32(row["receiverId"]),
                MessageText = row["messageText"].ToString(),
                IsRead = Convert.ToBoolean(row["isRead"]),
                EditedAt = row["editedAt"] != DBNull.Value ? row["editedAt"].ToString() : null,
                IsDeleted = Convert.ToBoolean(row["isDeleted"]),
                DeletedAt = row["deletedAt"] != DBNull.Value ? row["deletedAt"].ToString() : null,
                AdminDeleteReason = row["adminDeleteReason"] != DBNull.Value ? row["adminDeleteReason"].ToString() : null,
                CreatedBy = row["created_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["created_by"]) : null,
                CreatedAt = row["created_at"] != DBNull.Value ? row["created_at"].ToString() : null,
                UpdatedBy = row["updated_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["updated_by"]) : null,
                UpdatedAt = row["updated_at"] != DBNull.Value ? row["updated_at"].ToString() : null,
                SenderName = row.Table.Columns.Contains("senderName") && row["senderName"] != DBNull.Value
                                    ? row["senderName"].ToString() : null
            };
        }

        // ════════════════════════════════════════════════════════════════
        //  001 — GET THREAD
        //  Returns all non-deleted out-session messages for a booking.
        //  Business rule: session must be Completed or Confirmed.
        // ════════════════════════════════════════════════════════════════
        public Response GetThread(int bookingId)
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
                    var list = new List<OutSessionMessageModel>();
                    foreach (DataRow row in dt.Rows)
                        list.Add(MapRow(row));
                    return Response.Success(list);
                }
                return Response.Fail(pMessage.Value?.ToString() ?? "Failed to load messages.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  002 — SEND OUT-SESSION MESSAGE
        //  Business rule: session must be Completed, Confirmed or Pending.
        //  Unread notification badge increments for receiver.
        // ════════════════════════════════════════════════════════════════
        public Response SendMessage(OutSessionMessageRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type",  "002"),
                    new SqlParameter("@p_booking_id",   (object)request.BookingId   ?? DBNull.Value),
                    new SqlParameter("@p_sender_id",    (object)request.SenderId    ?? DBNull.Value),
                    new SqlParameter("@p_receiver_id",  (object)request.ReceiverId  ?? DBNull.Value),
                    new SqlParameter("@p_message_text", request.MessageText.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Message sent.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Failed to send message.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  003 — EDIT MESSAGE
        //  Business rule: sender only, within 30 minutes of sending.
        // ════════════════════════════════════════════════════════════════
        public Response EditMessage(OutSessionMessageRequestApi request, int callerId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type",  "003"),
                    new SqlParameter("@p_message_id",   (object)request.OutMessageId ?? DBNull.Value),
                    new SqlParameter("@p_sender_id",    callerId),
                    new SqlParameter("@p_message_text", request.MessageText.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Message updated.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Edit failed. Window may have expired.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  004 — SOFT DELETE OWN MESSAGE
        // ════════════════════════════════════════════════════════════════
        public Response DeleteMessage(int outMessageId, int callerId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "004"),
                    new SqlParameter("@p_message_id",  outMessageId),
                    new SqlParameter("@p_sender_id",   callerId),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Message deleted.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Delete failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  005 — MARK ALL READ
        //  Called when receiver opens the message thread.
        // ════════════════════════════════════════════════════════════════
        public Response MarkRead(int bookingId, int receiverId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "005"),
                    new SqlParameter("@p_booking_id",  bookingId),
                    new SqlParameter("@p_receiver_id", receiverId),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Messages marked as read.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  006 — ADMIN DELETE WITH REASON
        //  Business rule: Admin only. Soft delete. Reason must be provided.
        // ════════════════════════════════════════════════════════════════
        public Response AdminDeleteMessage(OutSessionMessageRequestApi request, int adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AdminDeleteReason))
                    return Response.Fail("Deletion reason is required.");

                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "006"),
                    new SqlParameter("@p_message_id",  (object)request.OutMessageId ?? DBNull.Value),
                    new SqlParameter("@p_sender_id",   adminId),
                    new SqlParameter("@p_admin_reason", request.AdminDeleteReason.Trim()),
                    pStatus, pMessage
                };

                _db.ExecuteProcedure(_proc, parameters);
                string code = pStatus.Value?.ToString();

                return code == "1"
                    ? Response.Success(null, "Message removed by admin.")
                    : Response.Fail(pMessage.Value?.ToString() ?? "Delete failed.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }
    }
}