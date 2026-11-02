import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lock, ChevronLeft, Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import {
  getConversations, getDirectMessages, sendDirectMessage,
  markRead, deleteDirectMessage, subscribeToDirectMessages,
} from "../lib/directMessages";

const initialsOf = (n) => (n || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function Face({ person, size = 38 }) {
  const name = person?.display_name || person?.username;
  return (
    <span className="pc-face" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {person?.profile_image_url ? <img src={person.profile_image_url} alt="" /> : initialsOf(name)}
    </span>
  );
}

/**
 * Renders inside the group chat's centre column (below its header).
 *   groupId        current group
 *   me             { id, displayName }
 *   members        the group's member rows (each has .profile)
 *   activeUserId   null = show the inbox, otherwise the open conversation
 *   onSelect(id)   open a conversation (or null to go back to the inbox)
 */
export default function PrivateChat({ groupId, me, members, activeUserId, onSelect }) {
  const people = members.filter((m) => m.profile.id !== me.id).map((m) => m.profile);
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const nameOf = (id) => byId[id]?.display_name || byId[id]?.username || "Member";

  const [convos, setConvos] = useState([]);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const activeRef = useRef(activeUserId);
  activeRef.current = activeUserId;
  const endRef = useRef(null);

  const loadConvos = useCallback(
    () => getConversations(groupId, me.id).then(setConvos).catch(() => {}),
    [groupId, me.id]
  );

  // One live subscription for the whole component: keeps the inbox fresh and
  // appends to the open thread when a message for it arrives.
  useEffect(() => {
    loadConvos();
    return subscribeToDirectMessages(groupId, me.id, (ev) => {
      if (ev.type === "insert") {
        const r = ev.row;
        const other = r.sender_id === me.id ? r.recipient_id : r.sender_id;
        if (activeRef.current === other) {
          setThread((prev) => (prev.some((m) => m.id === r.id) ? prev : [...prev, r]));
          if (r.recipient_id === me.id) markRead(groupId, other).then(loadConvos).catch(() => {});
        }
      } else if (ev.type === "delete") {
        setThread((prev) => prev.filter((m) => m.id !== ev.id));
      }
      loadConvos();
    });
  }, [groupId, me.id, loadConvos]);

  useEffect(() => {
    if (!activeUserId) { setThread([]); return; }
    setLoadingThread(true);
    getDirectMessages(groupId, activeUserId)
      .then(setThread)
      .catch(() => setThread([]))
      .finally(() => setLoadingThread(false));
    markRead(groupId, activeUserId).then(loadConvos).catch(() => {});
  }, [groupId, activeUserId, loadConvos]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [thread, activeUserId]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || !activeUserId) return;
    setSending(true);
    setDraft("");
    try {
      const saved = await sendDirectMessage({ groupId, senderId: me.id, recipientId: activeUserId, content: text });
      setThread((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
      loadConvos();
    } catch (err) {
      setDraft(text); // give the text back so nothing is lost
      alert(err.message || "Couldn't send that message.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(m) {
    if (!window.confirm("Delete this message for both of you?")) return;
    setThread((prev) => prev.filter((x) => x.id !== m.id));
    try { await deleteDirectMessage(m.id); } catch (e) { console.error(e); }
  }

  const style = (
    <style>{`
      .pc-root{flex:1;min-height:0;display:flex;flex-direction:column;background:var(--bg);font-family:'Inter',sans-serif;color:var(--ink)}
      .pc-root *{box-sizing:border-box}
      .pc-root button{font-family:inherit;cursor:pointer}
      .pc-scroll{flex:1;overflow-y:auto;padding:16px}
      .pc-lock{display:flex;gap:10px;align-items:flex-start;background:var(--soft);border-radius:12px;padding:11px 13px;font-size:12.5px;color:var(--ink);margin-bottom:16px}
      .pc-lock svg{flex:none;margin-top:2px;color:var(--primary)}
      .pc-h{font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:var(--muted);margin:14px 4px 8px}
      .pc-root .pc-row{width:100%;display:flex;align-items:center;gap:11px;padding:10px;border-radius:12px;background:var(--surface);border:1px solid var(--line,var(--border));margin-bottom:8px;text-align:left;color:var(--ink)}
      .pc-root .pc-row:hover{border-color:var(--primary)}
      .pc-face{border-radius:50%;background:var(--soft);color:var(--primary);font-family:'Space Grotesk',sans-serif;font-weight:600;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;flex:none}
      .pc-face img{width:100%;height:100%;object-fit:cover}
      .pc-txt{flex:1;min-width:0}
      .pc-txt strong{display:block;font-size:14px}
      .pc-txt span{display:block;font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pc-badge{background:var(--primary);color:var(--surface);font-size:11px;font-weight:600;min-width:20px;height:20px;border-radius:10px;display:grid;place-items:center;padding:0 6px}
      .pc-empty{text-align:center;color:var(--muted);font-size:13px;padding:24px 10px}
      .pc-top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border)}
      .pc-root .pc-back{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:none;border:0;color:var(--muted)}
      .pc-root .pc-back:hover{background:var(--bg);color:var(--ink)}
      .pc-top small{display:flex;align-items:center;gap:4px;color:var(--muted);font-size:11.5px}
      .pc-feed{display:flex;flex-direction:column;gap:8px}
      .pc-msg{max-width:78%;display:flex;flex-direction:column;gap:2px}
      .pc-msg.me{align-self:flex-end;align-items:flex-end}
      .pc-bub{padding:9px 13px;border-radius:15px 15px 15px 4px;background:var(--surface);border:1px solid var(--border);font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
      .pc-msg.me .pc-bub{background:var(--primary);color:var(--surface);border:0;border-radius:15px 15px 4px 15px}
      .pc-meta{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted);padding:0 4px}
      .pc-root .pc-del{background:none;border:0;color:var(--muted);display:inline-grid;opacity:.6;padding:0}
      .pc-root .pc-del:hover{color:var(--danger);opacity:1}
      .pc-compose{display:flex;align-items:flex-end;gap:8px;padding:10px 14px;background:var(--surface);border-top:1px solid var(--border)}
      .pc-compose textarea{flex:1;min-width:0;resize:none;max-height:120px;padding:9px 12px;border-radius:18px;border:1px solid var(--border);background:var(--bg);color:var(--ink);font:inherit;font-size:14px;line-height:1.4}
      .pc-compose textarea:focus{outline:none;border-color:var(--primary)}
      .pc-root .pc-send{width:0;height:36px;padding:0;overflow:hidden;border:0;border-radius:10px;background:var(--primary);color:var(--surface);display:grid;place-items:center;opacity:0;transform:scale(.6);transition:width .18s,opacity .18s,transform .18s;flex:none}
      .pc-root .pc-send.show{width:36px;opacity:1;transform:scale(1)}
      .pc-spin{animation:pcr .8s linear infinite;margin:20px auto;display:block}
      @keyframes pcr{to{transform:rotate(360deg)}}
    `}</style>
  );

  /* ------------------------- conversation view ------------------------- */
  if (activeUserId) {
    const person = byId[activeUserId];
    return (
      <div className="pc-root">
        {style}
        <div className="pc-top">
          <button className="pc-back" onClick={() => onSelect(null)} aria-label="Back to private chats"><ChevronLeft size={18} /></button>
          <Face person={person} size={36} />
          <div className="pc-txt">
            <strong>{nameOf(activeUserId)}</strong>
            <small><Lock size={11} />Only you and {nameOf(activeUserId)} can see this</small>
          </div>
        </div>
        <div className="pc-scroll">
          {loadingThread ? <Loader2 size={20} className="pc-spin" /> : thread.length === 0 ? (
            <div className="pc-empty">No messages yet. Say hello to {nameOf(activeUserId)}.</div>
          ) : (
            <div className="pc-feed">
              {thread.map((m) => (
                <div key={m.id} className={`pc-msg ${m.sender_id === me.id ? "me" : ""}`}>
                  <div className="pc-bub">{m.content}</div>
                  <div className="pc-meta">
                    {clock(m.created_at)}
                    {m.sender_id === me.id && (
                      <button className="pc-del" onClick={() => handleDelete(m)} aria-label="Delete message"><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="pc-compose">
          <textarea
            rows={1}
            placeholder={`Message ${nameOf(activeUserId)} privately…`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button className={`pc-send ${draft.trim() ? "show" : ""}`} onClick={handleSend} aria-label="Send"><Send size={16} /></button>
        </div>
      </div>
    );
  }

  /* ----------------------------- inbox view ----------------------------- */
  const talkedTo = new Set(convos.map((c) => c.userId));
  const others = people.filter((p) => !talkedTo.has(p.id));

  return (
    <div className="pc-root">
      {style}
      <div className="pc-scroll">
        <div className="pc-lock">
          <Lock size={16} />
          <span>Private chats stay between you and one other member of this group. Other members and group admins can't see them.</span>
        </div>

        {convos.length > 0 && <div className="pc-h">Your private chats</div>}
        {convos.map((c) => (
          <button key={c.userId} className="pc-row" onClick={() => onSelect(c.userId)}>
            <Face person={byId[c.userId]} />
            <span className="pc-txt">
              <strong>{nameOf(c.userId)}</strong>
              <span>{c.last.sender_id === me.id ? "You: " : ""}{c.last.content}</span>
            </span>
            {c.unread > 0 && <span className="pc-badge">{c.unread}</span>}
          </button>
        ))}

        <div className="pc-h">{convos.length ? "Start a new private chat" : "Message someone privately"}</div>
        {others.length === 0 && convos.length === 0 && <div className="pc-empty">No other members in this group yet.</div>}
        {others.map((p) => (
          <button key={p.id} className="pc-row" onClick={() => onSelect(p.id)}>
            <Face person={p} />
            <span className="pc-txt"><strong>{p.display_name || p.username}</strong><span>@{p.username}</span></span>
            <MessageCircle size={16} color="var(--primary)" />
          </button>
        ))}
      </div>
    </div>
  );
}
