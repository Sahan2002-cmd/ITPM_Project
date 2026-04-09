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
     *  DAInSessionMessage — Member 3
     *  Stored Procedure : PLT_IN_SESSION_MESSAGE_PROC
     *  Action Types:
     *    001 — Get chat history for a booking
     *    002 — Send message (session must be Active)
     *    003 — Edit own message (within 5 minutes)
     *    004 — Soft delete own message
     * ══════════════════════════════════════════════════════════════════════
     */
    public class DAInSessionMessage : IInSessionMessage
    {
        private readonly string _proc = "PLT_IN_SESSION_MESSAGE_PROC";
        private readonly DBConnect _db = new DBConnect();
        private readonly ProcedureDBModel _out = new ProcedureDBModel();

        // ── MAPPER ────────────────────────────────────────────────────────
        private InSessionMessageModel MapRow(DataRow row)
        {
            return new InSessionMessageModel
            {
                MessageId = Convert.ToInt32(row["messageId"]),
                BookingId = Convert.ToInt32(row["bookingId"]),
                SenderId = Convert.ToInt32(row["senderId"]),
                ReceiverId = Convert.ToInt32(row["receiverId"]),
                MessageText = row["messageText"].ToString(),
                EditedAt = row["editedAt"] != DBNull.Value ? row["editedAt"].ToString() : null,
                IsDeleted = Convert.ToBoolean(row["isDeleted"]),
                DeletedAt = row["deletedAt"] != DBNull.Value ? row["deletedAt"].ToString() : null,
                CreatedBy = row["created_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["created_by"]) : null,
                CreatedAt = row["created_at"] != DBNull.Value ? row["created_at"].ToString() : null,
                UpdatedBy = row["updated_by"] != DBNull.Value ? (int?)Convert.ToInt32(row["updated_by"]) : null,
                UpdatedAt = row["updated_at"] != DBNull.Value ? row["updated_at"].ToString() : null,
                SenderName = row.Table.Columns.Contains("senderName") && row["senderName"] != DBNull.Value
                                ? row["senderName"].ToString() : null
            };
        }

        // ════════════════════════════════════════════════════════════════
        //  001 — GET CHAT HISTORY
        //  Returns all non-deleted messages for a booking, oldest first.
        //  Access: Student and Tutor matched to this booking only.
        // ════════════════════════════════════════════════════════════════
        public Response GetChatHistory(int bookingId)
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
                    var list = new List<InSessionMessageModel>();
                    foreach (DataRow row in dt.Rows)
                        list.Add(MapRow(row));
                    return Response.Success(list);
                }
                return Response.Fail(pMessage.Value?.ToString() ?? "Failed to load chat.");
            }
            catch (Exception ex)
            {
                return Response.Error(ex.Message);
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  002 — SEND MESSAGE
        //  Business rule: session status must be Active.
        //  Saved with: bookingId, senderId, receiverId, messageText.
        // ════════════════════════════════════════════════════════════════
        public Response SendMessage(InSessionMessageRequestApi request)
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
                    new SqlParameter("@p_booking_id",   (object)request.BookingId  ?? DBNull.Value),
                    new SqlParameter("@p_sender_id",    (object)request.SenderId   ?? DBNull.Value),
                    new SqlParameter("@p_receiver_id",  (object)request.ReceiverId ?? DBNull.Value),
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
        //  Business rule: sender only, within 5 minutes of sending.
        //  Sets editedAt timestamp. Shows "edited" label in UI.
        // ════════════════════════════════════════════════════════════════
        public Response EditMessage(InSessionMessageRequestApi request, int callerId)
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
                    new SqlParameter("@p_message_id",   (object)request.MessageId ?? DBNull.Value),
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
        //  004 — SOFT DELETE MESSAGE
        //  Business rule: sender only. Hidden from UI, kept in DB.
        // ════════════════════════════════════════════════════════════════
        public Response DeleteMessage(int messageId, int callerId)
        {
            try
            {
                var pStatus = _out.ResultStatusCode();
                var pMessage = _out.ExceptionMessage();

                var parameters = new[]
                {
                    new SqlParameter("@p_action_type", "004"),
                    new SqlParameter("@p_message_id",  messageId),
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
    }
}