using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface INotification
    {
        /// <summary>Persist a new notification record in the DB.</summary>
        Response CreateNotification(NotificationRequestApi request);

        /// <summary>Returns all notifications for a user, newest first.</summary>
        Response GetByUser(int userId);

        /// <summary>Marks a single notification document as read.</summary>
        Response MarkAsRead(string notificationId);
    }
}
