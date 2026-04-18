import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Search, RefreshCw, Edit3, Trash2, X, Check, MoreVertical,
  MessageSquare, Clock, AlertCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getConversationPartners, getBasicUserInfo,
  getDirectMessages, sendDirectMessage,
  getInSessionMessages, sendInSessionMessage,
  editInSessionMessage, deleteInSessionMessage,
  editOutSessionMessage, deleteOutSessionMessage
} from "../services/Module_03_API";
import { toast } from "sonner";

/* ───── types ───── */
interface Partner {
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string;
  roleName: string;
}

interface Msg {
  outMessageId?: number;
  messageId?: number;
  senderId: number;
  receiverId: number;
  messageText: string;
  createdAt: string;
  editedAt?: string | null;
  isRead?: boolean;
}

/* ───── helpers ───── */
const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const canEditIn = (msg: Msg) => {
  if (!msg.createdAt) return false;
  return (Date.now() - new Date(msg.createdAt).getTime()) < 5 * 60 * 1000;
};

const canEditOut = (msg: Msg) => {
  if (!msg.createdAt) return false;
  return (Date.now() - new Date(msg.createdAt).getTime()) < 30 * 60 * 1000;
};

const MAX_LEN = 2000;

export default function Chat() {
  const { user } = useAuth();
  const uid = user?.userId ?? 0;

  /* ── state ── */
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sel, setSel] = useState<Partner | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // context menu
  const [menuId, setMenuId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── load partners ── */
  const loadPartners = useCallback(async () => {
    try {
      const res = await getConversationPartners();
      const ids: number[] = Array.isArray(res) ? res : (res?.Data ?? res?.data ?? []);
      const list: Partner[] = [];
      for (const id of ids) {
        try {
          const uResp = await getBasicUserInfo(id);
          const u = uResp?.Data ?? uResp?.data ?? uResp;
          list.push({ 
            userId: u.userId ?? u.UserId, 
            fullName: u.fullName ?? u.FullName, 
            email: u.email ?? u.Email, 
            roleName: u.roleName ?? u.RoleName, 
            profileImage: u.profileImage ?? u.ProfileImage 
          });
        } catch { }
      }
      setPartners(list);
      if (list.length > 0 && !sel) setSel(list[0]);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [sel]);

  /* ── load messages for selected partner (out-session / direct) ── */
  const loadMsgs = useCallback(async () => {
    if (!sel || !uid) return;
    try {
      const data = await getDirectMessages(sel.userId);
      const arr = Array.isArray(data) ? data : (data?.Data ?? data?.data ?? []);
      const normalized = (Array.isArray(arr) ? arr : []).map(m => ({
        outMessageId: m.OutMessageId ?? m.outMessageId,
        messageId: m.MessageId ?? m.messageId,
        senderId: m.SenderId ?? m.senderId,
        receiverId: m.ReceiverId ?? m.receiverId,
        messageText: m.MessageText ?? m.messageText ?? "",
        createdAt: m.CreatedAt ?? m.createdAt,
        editedAt: m.EditedAt ?? m.editedAt,
        isRead: m.IsRead ?? m.isRead,
      }));
      setMsgs(normalized);
    } catch { }
  }, [sel, uid]);

  useEffect(() => { loadPartners(); }, []);
  useEffect(() => {
    if (sel) {
      loadMsgs();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(loadMsgs, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sel, loadMsgs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  /* ── send ── */
  const doSend = async () => {
    if (!text.trim() || !sel || !uid) return;
    if (text.trim().length > MAX_LEN) { toast.error(`Message cannot exceed ${MAX_LEN} characters.`); return; }
    setSending(true);
    try {
      await sendDirectMessage(sel.userId, text.trim());
      setMsgs(prev => [...prev, {
        outMessageId: Date.now(),
        senderId: uid,
        receiverId: sel.userId,
        messageText: text.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      }]);
      setText("");
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  /* ── edit ── */
  const startEdit = (msg: Msg) => {
    const id = msg.outMessageId ?? msg.messageId ?? 0;
    setEditId(id);
    setEditText(msg.messageText);
    setMenuId(null);
  };

  const doEdit = async (msg: Msg) => {
    if (!editText.trim()) return;
    if (editText.trim().length > MAX_LEN) { toast.error(`Message cannot exceed ${MAX_LEN} characters.`); return; }
    try {
      if (msg.outMessageId) {
        await editOutSessionMessage(msg.outMessageId, editText.trim());
      } else if (msg.messageId) {
        await editInSessionMessage(msg.messageId, editText.trim());
      }
      setMsgs(prev => prev.map(m => {
        const mId = m.outMessageId ?? m.messageId;
        const eId = msg.outMessageId ?? msg.messageId;
        return mId === eId ? { ...m, messageText: editText.trim(), editedAt: new Date().toISOString() } : m;
      }));
      setEditId(null);
      toast.success("Message edited");
    } catch (e: any) { toast.error(e.message || "Edit failed"); }
  };

  /* ── delete ── */
  const doDelete = async (msg: Msg) => {
    setMenuId(null);
    try {
      if (msg.outMessageId) {
        await deleteOutSessionMessage(msg.outMessageId);
      } else if (msg.messageId) {
        await deleteInSessionMessage(msg.messageId);
      }
      setMsgs(prev => prev.filter(m => (m.outMessageId ?? m.messageId) !== (msg.outMessageId ?? msg.messageId)));
      toast.success("Message deleted");
    } catch (e: any) { toast.error(e.message || "Delete failed"); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadMsgs(); setRefreshing(false); };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } };

  const filtered = partners.filter(p => (p.fullName || "").toLowerCase().includes((searchQ || "").toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-full bg-slate-50">
      {/* ── sidebar ── */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-600" /> Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">No conversations found.</div>
          ) : filtered.map(p => (
            <button key={p.userId} onClick={() => { setSel(p); setMenuId(null); setEditId(null); }}
              className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${sel?.userId === p.userId ? "bg-violet-50 border-l-2 border-l-violet-600" : ""}`}>
              <img src={p.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.fullName}`}
                alt={p.fullName} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{p.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{p.roleName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {sel ? (
          <>
            {/* header */}
            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={sel.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sel.fullName}`}
                  alt={sel.fullName} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{sel.fullName}</p>
                  <p className="text-xs text-emerald-500 font-medium">Online</p>
                </div>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <MessageSquare className="w-10 h-10 opacity-40" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : msgs.map((m, i) => {
                const isMe = m.senderId === uid;
                const mId = m.outMessageId ?? m.messageId ?? i;
                const isEditing = editId === mId;
                const canE = isMe && (m.outMessageId ? canEditOut(m) : canEditIn(m));

                return (
                  <div key={mId} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    <img
                      src={isMe
                        ? (user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`)
                        : (sel.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sel.fullName}`)}
                      alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" />
                    <div className="max-w-xs lg:max-w-md relative group">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <textarea value={editText} onChange={e => setEditText(e.target.value)}
                            className="px-3 py-2 text-sm border border-violet-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                            rows={2} maxLength={MAX_LEN} />
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => doEdit(m)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                            ? "bg-violet-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"}`}>
                            {m.messageText}
                          </div>
                          <div className="flex items-center gap-1.5 px-1 mt-1">
                            <span className="text-[10px] text-slate-400">{fmtTime(m.createdAt)}</span>
                            {m.editedAt && (
                              <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                                <Edit3 className="w-2.5 h-2.5" /> Edited
                              </span>
                            )}
                          </div>

                          {/* context menu trigger */}
                          {isMe && (
                            <button onClick={() => setMenuId(menuId === mId ? null : mId)}
                              className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow border border-slate-100">
                              <MoreVertical className="w-3 h-3 text-slate-500" />
                            </button>
                          )}
                          {menuId === mId && isMe && (
                            <div className="absolute top-6 right-0 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[120px]">
                              {canE && (
                                <button onClick={() => startEdit(m)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-violet-50 transition-colors">
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                              )}
                              {!canE && m.outMessageId && (
                                <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Edit window expired
                                </div>
                              )}
                              <button onClick={() => doDelete(m)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
                    placeholder="Type a message..." rows={1} maxLength={MAX_LEN}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
                  {text.length > 0 && (
                    <span className={`absolute right-3 bottom-1 text-[10px] ${text.length > 1900 ? "text-rose-500" : "text-slate-400"}`}>
                      {text.length}/{MAX_LEN}
                    </span>
                  )}
                </div>
                <button onClick={doSend} disabled={!text.trim() || sending}
                  className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-all">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <MessageSquare className="w-12 h-12 opacity-30" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}