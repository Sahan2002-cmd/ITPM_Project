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
    public class DAInSessionMessage : IInSessionMessage
    {
        private readonly IMongoCollection<InSessionMessageModel> _messages;
        private readonly IMongoCollection<BookingModel> _bookings;

        public DAInSessionMessage()
        {
            var ctx = new MongoDBContext();
            _messages = ctx.GetCollection<InSessionMessageModel>("InSessionMessages");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
        }

        private string NowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // 001 – GET CHAT HISTORY (only non‑deleted, sorted oldest first)
        public Response GetChatHistory(int bookingId)
        {
            try
            {
                var filter = Builders<InSessionMessageModel>.Filter.And(
                    Builders<InSessionMessageModel>.Filter.Eq(m => m.BookingId, bookingId),
                    Builders<InSessionMessageModel>.Filter.Eq(m => m.IsDeleted, false)
                );
                var list = _messages.Find(filter).SortBy(m => m.CreatedAt).ToList();
                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 002 – SEND MESSAGE (requires session status = Active)
        public Response SendMessage(InSessionMessageRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.MessageText))
                    return Response.Fail("Message text cannot be empty.");

                // Verify session is Active
                var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                if (booking == null || booking.Status != "Active")
                    return Response.Fail("Session is not active. Messaging not allowed.");

                var msg = new InSessionMessageModel
                {
                    MessageId = CounterHelper.GetNextSequence("messageId"),
                    BookingId = request.BookingId.Value,
                    SenderId = request.SenderId.Value,
                    ReceiverId = request.ReceiverId.Value,
                    MessageText = request.MessageText.Trim(),
                    EditedAt = null,
                    IsDeleted = false,
                    DeletedAt = null,
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

        // 003 – EDIT MESSAGE (within 5 minutes, sender only)
        public Response EditMessage(InSessionMessageRequestApi request, int callerId)
        {
            try
            {
                var msg = _messages.Find(m => m.MessageId == request.MessageId).FirstOrDefault();
                if (msg == null) return Response.Fail("Message not found.");
                if (msg.SenderId != callerId) return Response.Fail("You can only edit your own messages.");

                var created = DateTime.Parse(msg.CreatedAt);
                if ((DateTime.UtcNow - created).TotalMinutes > 5)
                    return Response.Fail("Edit window (5 minutes) has expired.");

                _messages.UpdateOne(m => m.MessageId == request.MessageId,
                    Builders<InSessionMessageModel>.Update
                        .Set(m => m.MessageText, request.MessageText.Trim())
                        .Set(m => m.EditedAt, NowIso())
                        .Set(m => m.UpdatedAt, NowIso())
                        .Set(m => m.UpdatedBy, callerId));

                return Response.Success(null, "Message updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – SOFT DELETE (sender only)
        public Response DeleteMessage(int messageId, int callerId)
        {
            try
            {
                var msg = _messages.Find(m => m.MessageId == messageId).FirstOrDefault();
                if (msg == null) return Response.Fail("Message not found.");
                if (msg.SenderId != callerId) return Response.Fail("You can only delete your own messages.");

                _messages.UpdateOne(m => m.MessageId == messageId,
                    Builders<InSessionMessageModel>.Update
                        .Set(m => m.IsDeleted, true)
                        .Set(m => m.DeletedAt, NowIso())
                        .Set(m => m.UpdatedAt, NowIso())
                        .Set(m => m.UpdatedBy, callerId));

                return Response.Success(null, "Message deleted.");
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