import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, MoreVertical, Search, RefreshCw, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getConversationPartners, getBasicUserInfo, getDirectMessages, sendDirectMessage } from "../services/Module_03_API";
import { toast } from "sonner";

interface ConversationPartner {
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string;
  roleName: string;
}

interface Message {
  outMessageId: number;
  senderId: number;
  receiverId: number;
  messageText: string;
  createdAt: string;
  isRead: boolean;
}

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
};

export default function Chat() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserId = user?.userId;

  // Load all conversation partners (or all tutors if none)
  const loadPartners = useCallback(async () => {
    try {
      const partnerIds = await getConversationPartners();
      const partnersList: ConversationPartner[] = [];
      for (const id of partnerIds) {
        try {
          const userData = await getBasicUserInfo(id);
          partnersList.push({
            userId: userData.userId,
            fullName: userData.fullName,
            email: userData.email,
            roleName: userData.roleName,
            profileImage: userData.profileImage,
          });
        } catch (err) {
          console.warn(`Failed to load user ${id}`, err);
        }
      }
      setPartners(partnersList);
      if (partnersList.length > 0 && !selectedPartner) {
        setSelectedPartner(partnersList[0]);
      }
    } catch (err) {
      console.error("Failed to load partners", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPartner]);

  // Load messages for selected partner
  const loadMessages = useCallback(async () => {
    if (!selectedPartner || !currentUserId) return;
    try {
      const data = await getDirectMessages(selectedPartner.userId);
      const msgs = data.messages || data || [];
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, [selectedPartner, currentUserId]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  useEffect(() => {
    if (selectedPartner) {
      loadMessages();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(loadMessages, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedPartner, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedPartner || !currentUserId) return;
    setSending(true);
    try {
      await sendDirectMessage(selectedPartner.userId, messageText.trim());
      // Optimistic update
      const newMsg: Message = {
        outMessageId: Date.now(),
        senderId: currentUserId,
        receiverId: selectedPartner.userId,
        messageText: messageText.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, newMsg]);
      setMessageText("");
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar – List of conversation partners */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No tutors found. Please try again later.
            </div>
          ) : (
            partners.map(partner => (
              <button
                key={partner.userId}
                onClick={() => setSelectedPartner(partner)}
                className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                  selectedPartner?.userId === partner.userId ? "bg-violet-50 border-l-2 border-l-violet-600" : ""
                }`}
              >
                <img
                  src={partner.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.fullName}`}
                  alt={partner.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{partner.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{partner.roleName}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPartner ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPartner.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPartner.fullName}`}
                  alt={selectedPartner.fullName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedPartner.fullName}</p>
                  <p className="text-xs text-emerald-500 font-medium">Online</p>
                </div>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-slate-100 rounded-xl">
                <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No messages yet. Send a message to start the conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.outMessageId} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <img
                        src={isMe ? user?.avatar : selectedPartner.profileImage}
                        alt="avatar"
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                      />
                      <div className="max-w-xs lg:max-w-md">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-violet-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"}`}>
                          {msg.messageText}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1 mt-1 block">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
              <div className="flex items-end gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-xl">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}