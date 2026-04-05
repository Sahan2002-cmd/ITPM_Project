// ── NuGet required ────────────────────────────────────────────────────────────
//   PM> Install-Package Microsoft.AspNet.SignalR
// ─────────────────────────────────────────────────────────────────────────────
// Global.asax.cs — add this line inside Application_Start():
//   RouteTable.Routes.MapHubs();
//   (or use app.MapSignalR() if using OWIN startup)
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System.Runtime.Remoting.Contexts;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PeerLearningAndTutorialSystem.Hubs
{
    /*
     * ══════════════════════════════════════════════════════════════════════
     *  ChatHub — Member 3
     *  Handles real-time in-session messaging via SignalR.
     *
     *  How it works:
     *    1. Student and Tutor both join group "session_{bookingId}"
     *       when LiveSessionPage loads.
     *    2. When either person sends a message, SendMessage() broadcasts
     *       it instantly to the whole group (only that matched pair).
     *    3. Chat closes automatically when session ends — frontend
     *       calls LeaveSession on page unmount.
     *
     *  React frontend usage (example):
     *    const connection = new HubConnectionBuilder()
     *      .withUrl("/signalr")
     *      .build();
     *
     *    // Join on page load
     *    connection.invoke("JoinSession", bookingId);
     *
     *    // Send message
     *    connection.invoke("SendMessage", bookingId, senderId, receiverId, text);
     *
     *    // Listen for incoming messages
     *    connection.on("ReceiveMessage", (senderId, senderName, text, sentAt) => { ... });
     *
     *    // Listen for typing indicator
     *    connection.on("UserTyping", (senderName) => { ... });
     *
     *    // Leave on page unload
     *    connection.invoke("LeaveSession", bookingId);
     * ══════════════════════════════════════════════════════════════════════
     */

    [HubName("chatHub")]
    public class ChatHub : Hub
    {
        // ════════════════════════════════════════════════════════════════
        //  JoinSession
        //  Called by both Student and Tutor when the live session page loads.
        //  Adds the caller's connection to a SignalR group named
        //  "session_{bookingId}" so messages are only delivered to this pair.
        // ════════════════════════════════════════════════════════════════
        public async Task JoinSession(int bookingId)
        {
            string groupName = $"session_{bookingId}";
            await Groups.Add(Context.ConnectionId, groupName);

            // Notify others in the group that someone joined
            await Clients.OthersInGroup(groupName)
                .userJoined(Context.ConnectionId, bookingId);
        }

        // ════════════════════════════════════════════════════════════════
        //  LeaveSession
        //  Called when the live session page unmounts (session ends or
        //  user navigates away). Removes connection from the group.
        // ════════════════════════════════════════════════════════════════
        public async Task LeaveSession(int bookingId)
        {
            string groupName = $"session_{bookingId}";
            await Groups.Remove(Context.ConnectionId, groupName);

            await Clients.OthersInGroup(groupName)
                .userLeft(Context.ConnectionId, bookingId);
        }

        // ════════════════════════════════════════════════════════════════
        //  SendMessage
        //  Broadcasts a new message to everyone in the session group.
        //  The message is also saved to DB by the REST API call from
        //  the frontend (POST /api/insessionmessage/send).
        //  SignalR only handles the real-time delivery — DB storage is
        //  handled separately via the REST API.
        //
        //  Parameters:
        //    bookingId   — which session group to broadcast to
        //    senderId    — userId of the sender (from JWT on frontend)
        //    senderName  — display name for the chat UI
        //    messageText — the message content
        //    sentAt      — ISO timestamp string from frontend
        // ════════════════════════════════════════════════════════════════
        public async Task SendMessage(
            int bookingId,
            int senderId,
            string senderName,
            string messageText,
            string sentAt)
        {
            if (string.IsNullOrWhiteSpace(messageText)) return;

            string groupName = $"session_{bookingId}";

            // Broadcast to ALL in group (including sender for confirmation)
            await Clients.Group(groupName)
                .receiveMessage(senderId, senderName, messageText, sentAt);
        }

        // ════════════════════════════════════════════════════════════════
        //  TypingIndicator
        //  Broadcasts "X is typing..." to others in the session.
        //  Frontend sends this on keydown, clears after 2 seconds.
        // ════════════════════════════════════════════════════════════════
        public async Task TypingIndicator(int bookingId, string senderName)
        {
            string groupName = $"session_{bookingId}";

            // Send to others only — not back to the sender
            await Clients.OthersInGroup(groupName)
                .userTyping(senderName);
        }

        // ════════════════════════════════════════════════════════════════
        //  MessageDeleted
        //  Notifies the group when a message is soft-deleted so the UI
        //  can hide it instantly without a page refresh.
        // ════════════════════════════════════════════════════════════════
        public async Task MessageDeleted(int bookingId, int messageId)
        {
            string groupName = $"session_{bookingId}";
            await Clients.Group(groupName).messageDeleted(messageId);
        }

        // ════════════════════════════════════════════════════════════════
        //  MessageEdited
        //  Notifies the group when a message is edited so the UI
        //  can update the text instantly.
        // ════════════════════════════════════════════════════════════════
        public async Task MessageEdited(int bookingId, int messageId, string newText)
        {
            string groupName = $"session_{bookingId}";
            await Clients.Group(groupName).messageEdited(messageId, newText);
        }

        // ════════════════════════════════════════════════════════════════
        //  OnDisconnected (override)
        //  Fired automatically when a user's connection drops.
        //  Notifies the session group so the UI can update presence.
        // ════════════════════════════════════════════════════════════════
        public override async Task OnDisconnected(bool stopCalled)
        {
            // SignalR removes the connection from all groups automatically.
            // We just notify — bookingId unknown here so frontend handles cleanup.
            await Clients.All.userDisconnected(Context.ConnectionId);
            await base.OnDisconnected(stopCalled);
        }
    }
}