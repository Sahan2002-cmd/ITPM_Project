using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data-access implementation for Notification documents in the "Notifications" collection.
    /// This class is invoked by BookingController after every state-transition action
    /// (Accept / Decline / Cancel).  A comment in each call-site marks where a real-time
    /// SignalR push or transactional email would be dispatched.
    /// </summary>
    public class DANotification : INotification
    {
        private readonly IMongoCollection<NotificationModel> _notifications;

        public DANotification()
        {
            var ctx = new MongoDBContext();
            _notifications = ctx.GetCollection<NotificationModel>("Notifications");
        }

        private static string UtcNowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – CREATE NOTIFICATION
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateNotification(NotificationRequestApi request)
        {
            try
            {
                var notification = new NotificationModel
                {
                    NotificationId  = CounterHelper.GetNextSequence("notificationId"),
                    UserId          = request.UserId,
                    Title           = request.Title?.Trim(),
                    Message         = request.Message?.Trim(),
                    Type            = request.Type ?? "General",
                    RelatedBookingId = request.RelatedBookingId,
                    IsRead          = false,
                    CreatedAt       = UtcNowIso(),
                    UpdatedAt       = UtcNowIso()
                };

                _notifications.InsertOne(notification);
                return Response.Success(notification, "Notification created.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – GET BY USER
        // Returns all notifications for a user, most recent first.
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetByUser(int userId)
        {
            try
            {
                var filter = Builders<NotificationModel>.Filter.Eq(n => n.UserId, userId);
                var notifications = _notifications
                    .Find(filter)
                    .SortByDescending(n => n.CreatedAt)
                    .ToList();
                return Response.Success(notifications);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – MARK AS READ
        // ═══════════════════════════════════════════════════════════════════════
        public Response MarkAsRead(string notificationId)
        {
            try
            {
                var existing = _notifications.Find(n => n.Id == notificationId).FirstOrDefault();
                if (existing == null) return Response.Fail("Notification not found.");

                if (existing.IsRead) return Response.Fail("Notification is already marked as read.");

                var update = Builders<NotificationModel>.Update
                    .Set(n => n.IsRead,    true)
                    .Set(n => n.UpdatedAt, UtcNowIso());

                _notifications.UpdateOne(n => n.Id == notificationId, update);
                return Response.Success(null, "Notification marked as read.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}
