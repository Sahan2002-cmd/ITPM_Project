import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Phone, Video, MoreVertical, Search, Circle, BookOpen, Image } from "lucide-react";
import { chatMessages, tutors, TUTOR_IMAGES } from "../data/mockData";

const conversations = [
  { id: "1", tutor: tutors[0], lastMessage: "Perfect! That's exactly right.", time: "10:06 AM", unread: 1, online: true },
  { id: "2", tutor: tutors[1], lastMessage: "See you at our next session!", time: "Yesterday", unread: 0, online: false },
  { id: "3", tutor: tutors[2], lastMessage: "I uploaded the practice files.", time: "Mon", unread: 2, online: true },
];

export default function Chat() {
  const [activeConv, setActiveConv] = useState("1");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(chatMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeTutor = conversations.find(c => c.id === activeConv)?.tutor || tutors[0];

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(m => [...m, {
      id: m.length + 1, sender: "student", name: "You", text: message, time: "Now", avatar: TUTOR_IMAGES.student,
    }]);
    setMessage("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: Conversations */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button key={conv.id} onClick={() => setActiveConv(conv.id)} className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${activeConv === conv.id ? "bg-violet-50 border-l-2 border-l-violet-600" : ""}`}>
              <div className="relative flex-shrink-0">
                <img src={conv.tutor.avatar} alt={conv.tutor.name} className="w-10 h-10 rounded-full object-cover" />
                {conv.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 truncate">{conv.tutor.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{conv.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-violet-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">{conv.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <img src={activeTutor.avatar} alt={activeTutor.name} className="w-9 h-9 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">{activeTutor.name}</p>
            <p className="text-xs text-emerald-500 font-medium">Online • Tutor</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><Phone className="w-4 h-4 text-slate-600" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><Video className="w-4 h-4 text-slate-600" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><MoreVertical className="w-4 h-4 text-slate-600" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {/* Session Info Banner */}
          <div className="flex justify-center">
            <div className="bg-violet-100 text-violet-700 text-xs px-4 py-1.5 rounded-full font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Session: Calculus — Today at 10:00 AM
            </div>
          </div>

          {messages.map(msg => {
            const isMe = msg.sender === "student";
            return (
              <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                <img src={msg.avatar} alt={msg.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" />
                <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-violet-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex gap-1">
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><Paperclip className="w-4 h-4 text-slate-500" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><Image className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
              />
            </div>
            <button onClick={sendMessage} disabled={!message.trim()}
              className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
