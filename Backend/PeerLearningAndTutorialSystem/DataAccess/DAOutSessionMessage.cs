using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    public class DAOutSessionMessage : IOutSessionMessage
    {
        private readonly IMongoCollection<OutSessionMessageModel> _messages;
        private readonly IMongoCollection<BookingModel> _bookings;

        public DAOutSessionMessage()
        {
            var ctx = new MongoDBContext();
            _messages = ctx.GetCollection<OutSessionMessageModel>("OutSessionMessages");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
        }

        private string NowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // 001 – GET THREAD (non‑deleted, sorted oldest)
        public Response GetThread(int bookingId)
        {
            try
            {
                var filter = Builders<OutSessionMessageModel>.Filter.And(
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.BookingId, bookingId),
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.IsDeleted, false)
                );
                var list = _messages.Find(filter).SortBy(m => m.CreatedAt).ToList();
                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 002 – SEND MESSAGE (session must be Completed/Confirmed/Pending)
        public Response SendMessage(OutSessionMessageRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");
                if (request.MessageText.Trim().Length > 2000)
                    return Response.Fail("Message text cannot exceed 2000 characters.");

                var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                if (booking == null || !(booking.Status == "Completed" || booking.Status == "Confirmed" || booking.Status == "Pending"))
                    return Response.Fail("Out-session messages allowed only for Completed, Confirmed, or Pending sessions.");

                var msg = new OutSessionMessageModel
                {
                    OutMessageId = CounterHelper.GetNextSequence("outMessageId"),
                    BookingId = request.BookingId.Value,
                    SenderId = request.SenderId.Value,
                    ReceiverId = request.ReceiverId.Value,
                    MessageText = request.MessageText.Trim(),
                    IsRead = false,
                    EditedAt = null,
                    IsDeleted = false,
                    DeletedAt = null,
                    AdminDeleteReason = null,
                    CreatedBy = request.SenderId,
                    CreatedAt = NowIso(),
                    UpdatedBy = null,
                    UpdatedAt = null
                };
                _messages.InsertOne(msg);
                return Response.Success(null, "Message sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003 – EDIT MESSAGE (within 30 minutes, sender only)
        public Response EditMessage(OutSessionMessageRequestApi request, int callerId)
        {
            try
            {
                var msg = _messages.Find(m => m.OutMessageId == request.OutMessageId).FirstOrDefault();
                if (msg == null) return Response.Fail("Message not found.");
                if (msg.SenderId != callerId) return Response.Fail("You can only edit your own messages.");

                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");
                if (request.MessageText.Trim().Length > 2000)
                    return Response.Fail("Message text cannot exceed 2000 characters.");

                var created = DateTime.Parse(msg.CreatedAt);
                if ((DateTime.UtcNow - created).TotalMinutes > 30)
                    return Response.Fail("Edit window (30 minutes) has expired.");

                _messages.UpdateOne(m => m.OutMessageId == request.OutMessageId,
                    Builders<OutSessionMessageModel>.Update
                        .Set(m => m.MessageText, request.MessageText.Trim())
                        .Set(m => m.EditedAt, NowIso())
                        .Set(m => m.UpdatedAt, NowIso())
                        .Set(m => m.UpdatedBy, callerId));

                return Response.Success(null, "Message updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – SOFT DELETE (sender only)
        public Response DeleteMessage(int outMessageId, int callerId)
        {
            try
            {
                var msg = _messages.Find(m => m.OutMessageId == outMessageId).FirstOrDefault();
                if (msg == null) return Response.Fail("Message not found.");
                if (msg.SenderId != callerId) return Response.Fail("You can only delete your own messages.");

                _messages.UpdateOne(m => m.OutMessageId == outMessageId,
                    Builders<OutSessionMessageModel>.Update
                        .Set(m => m.IsDeleted, true)
                        .Set(m => m.DeletedAt, NowIso())
                        .Set(m => m.UpdatedAt, NowIso())
                        .Set(m => m.UpdatedBy, callerId));

                return Response.Success(null, "Message deleted.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 005 – MARK READ (for receiver)
        public Response MarkRead(int bookingId, int receiverId)
        {
            try
            {
                var filter = Builders<OutSessionMessageModel>.Filter.And(
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.BookingId, bookingId),
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.ReceiverId, receiverId),
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.IsRead, false)
                );
                var update = Builders<OutSessionMessageModel>.Update.Set(m => m.IsRead, true);
                _messages.UpdateMany(filter, update);
                return Response.Success(null, "Messages marked as read.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 006 – ADMIN DELETE WITH REASON
        public Response AdminDeleteMessage(OutSessionMessageRequestApi request, int adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AdminDeleteReason))
                    return Response.Fail("Deletion reason is required.");

                _messages.UpdateOne(m => m.OutMessageId == request.OutMessageId,
                    Builders<OutSessionMessageModel>.Update
                        .Set(m => m.IsDeleted, true)
                        .Set(m => m.AdminDeleteReason, request.AdminDeleteReason.Trim())
                        .Set(m => m.DeletedAt, NowIso())
                        .Set(m => m.UpdatedAt, NowIso())
                        .Set(m => m.UpdatedBy, adminId));

                return Response.Success(null, "Message removed by admin.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetAllMessages()
        {
            var all = _messages.Find(m => !m.IsDeleted).ToList();
            return Response.Success(all);
        }

        // Helper to generate a conversation key from two user IDs
        // Helper to generate a conversation key
        private string GetConversationKey(int userId1, int userId2)
        {
            int a = Math.Min(userId1, userId2);
            int b = Math.Max(userId1, userId2);
            return $"{a}_{b}";
        }

        public Response SendDirectMessage(int senderId, int receiverId, string messageText)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(messageText))
                    return Response.Fail("Message text cannot be empty.");
                if (messageText.Trim().Length > 2000)
                    return Response.Fail("Message text cannot exceed 2000 characters.");

                var msg = new OutSessionMessageModel
                {
                    OutMessageId = CounterHelper.GetNextSequence("outMessageId"),
                    BookingId = -1,
                    ConversationKey = GetConversationKey(senderId, receiverId),
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    MessageText = messageText.Trim(),
                    IsRead = false,
                    EditedAt = null,
                    IsDeleted = false,
                    DeletedAt = null,
                    AdminDeleteReason = null,
                    CreatedBy = senderId,
                    CreatedAt = NowIso(),
                    UpdatedBy = null,
                    UpdatedAt = null
                };
                _messages.InsertOne(msg);
                return Response.Success(msg, "Message sent.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetDirectMessages(int userId1, int userId2)
        {
            try
            {
                string key = GetConversationKey(userId1, userId2);
                var filter = Builders<OutSessionMessageModel>.Filter.And(
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.ConversationKey, key),
                    Builders<OutSessionMessageModel>.Filter.Eq(m => m.IsDeleted, false)
                );
                var list = _messages.Find(filter).SortBy(m => m.CreatedAt).ToList();
                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetConversationPartners(int userId)
        {
            try
            {
                var senderIds = _messages.Find(m => m.SenderId == userId && !m.IsDeleted)
                                         .Project(m => m.ReceiverId).ToList();
                var receiverIds = _messages.Find(m => m.ReceiverId == userId && !m.IsDeleted)
                                           .Project(m => m.SenderId).ToList();
                var partnerIds = senderIds.Union(receiverIds).Distinct().ToList();

                // If no conversations yet, return all active tutors
                if (partnerIds.Count == 0)
                {
                    var tutors = new DAUser().GetAllTutors();
                    if (tutors.StatusCode == 1 && tutors.Data is List<UserModel> tutorList)
                        partnerIds = tutorList.Select(t => t.UserId).ToList();
                }
                return Response.Success(partnerIds);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}