using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;

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
    }
}