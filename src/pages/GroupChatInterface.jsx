import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search, Plus, Settings, Compass, Users, Hash, Smile, Paperclip,
  Image as ImageIcon, Mic, Send, MoreVertical, ChevronLeft, Info,
  Menu, X, Shield, Crown, Bell, Pin, MessagesSquare, Loader2, Pencil,
  Trash2, Check, Square, File as FileIcon, Download
} from "lucide-react";
import { getProfile } from "../lib/profiles";
import { getMyGroups, getGroupDetails } from "../lib/groups";
import { getMembers } from "../lib/members";
import {
  getMessages, sendMessage, sendMediaMessage, editMessage, deleteMessage,
  subscribeToMessageChanges, subscribeToPresence
} from "../lib/messages";
import { useAuth } from "../lib/AuthContext";

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const EMOJIS = ["😀","😂","🥰","😎","🤔","😢","😮","🔥","🎉","👍","👎","🙏","❤️","💯","👏","🙌","😅","😍","🤝","✅"];

/* ------------------------------------------------------------------
   PRESENTATION
------------------------------------------------------------------- */
function Avatar({ initials, size = 36, online, imageUrl }) {
  return (
    <span className="lc-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {imageUrl ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initials}
      {online !== undefined && <i className={`lc-dot ${online ? "on" : ""}`} />}
    </span>
  );
}

function RoleBadge({ role }) {
  if (role === "host") return <span className="lc-badge host"><Crown size={11} />Host</span>;
  if (role === "admin") return <span className="lc-badge admin"><Shield size={11} />Admin</span>;
  return null;
}

function GroupRail({ onDrawerToggle }) {
  const navigate = useNavigate();
  return (
    <nav className="lc-rail">
      <div className="lc-logo"><MessagesSquare size={20} /></div>
      <button className="lc-rail-btn" title="Search" onClick={() => navigate("/search")}><Search size={18} /></button>
      <button className="lc-rail-btn on" title="My groups" onClick={onDrawerToggle}><Hash size={18} /></button>
      <button className="lc-rail-btn" title="Discover" onClick={() => navigate("/search")}><Compass size={18} /></button>
      <button className="lc-rail-btn" title="Create group" onClick={() => navigate("/create")}><Plus size={18} /></button>
      <div className="lc-rail-spacer" />
      <button className="lc-rail-btn" title="Notifications" onClick={() => navigate("/notifications")}><Bell size={18} /></button>
      <button className="lc-rail-btn" title="Settings" onClick={() => navigate("/profile")}><Settings size={18} /></button>
      <button className="lc-rail-btn" title="Profile" onClick={() => navigate("/profile")} style={{ padding: 0 }}>
        <Avatar initials="•" size={34} />
      </button>
    </nav>
  );
}

function GroupList({ groups, loading, activeId, isDrawer, onClose }) {
  const navigate = useNavigate();
  return (
    <aside className={`lc-groups ${isDrawer ? "drawer" : ""}`}>
      <div className="lc-groups-head">
        <span>My Groups</span>
        {isDrawer && <button className="lc-icon-btn" onClick={onClose}><X size={18} /></button>}
      </div>
      <div className="lc-search">
        <Search size={15} />
        <input placeholder="Search groups" />
      </div>
      <div className="lc-groups-list">
        {loading && <div className="lc-groups-status"><Loader2 size={18} className="lc-spin" /></div>}
        {!loading && groups.length === 0 && (
          <div className="lc-groups-status">
            <span className="muted">No groups yet.</span>
            <button className="lc-groups-create-btn" onClick={() => navigate("/create")}>Create a group</button>
          </div>
        )}
        {!loading && groups.map((g) => (
          <button
            key={g.id}
            className={`lc-group-item ${g.id === activeId ? "active" : ""}`}
            onClick={() => { navigate(`/groups/${g.id}`); onClose?.(); }}
          >
            <Avatar initials={initialsOf(g.name)} imageUrl={g.image_url} size={40} />
            <div className="lc-group-item-text">
              <div className="row"><strong>{g.name}</strong></div>
              <div className="muted line1">{g.description || "No description yet."}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function MediaContent({ msg }) {
  if (msg.message_type === "image") {
    return <img src={msg.media_url} alt={msg.content || "image"} className="lc-media-image" />;
  }
  if (msg.message_type === "voice") {
    return <audio controls src={msg.media_url} className="lc-media-audio" />;
  }
  if (msg.message_type === "file") {
    return (
      <a href={msg.media_url} target="_blank" rel="noreferrer" download className="lc-media-file">
        <FileIcon size={16} />
        <span className="lc-media-file-name">{msg.content || "Attachment"}</span>
        <Download size={14} />
      </a>
    );
  }
  return null;
}

function Message({ msg, isOwn, resolveSender, isEditing, editDraft, onEditDraftChange, onStartEdit, onSaveEdit, onCancelEdit, onDelete }) {
  const sender = resolveSender(msg);
  const [menuOpen, setMenuOpen] = useState(false);

  if (msg.message_type === "announcement") {
    return (
      <div className="lc-announcement">
        <Pin size={13} />
        <div>
          <div className="lc-ann-head">Group announcement · {sender.name} · {formatTime(msg.created_at)}</div>
          <div>{msg.content}</div>
        </div>
      </div>
    );
  }

  const isMedia = msg.message_type === "image" || msg.message_type === "file" || msg.message_type === "voice";

  return (
    <div className={`lc-msg-row ${isOwn ? "own" : ""}`}>
      {!isOwn && <Avatar initials={sender.initials} imageUrl={sender.imageUrl} size={30} />}
      <div className="lc-msg-col">
        {!isOwn && <span className="lc-msg-sender">{sender.name}</span>}

        {isEditing ? (
          <div className="lc-edit-box">
            <input
              className="lc-edit-input"
              value={editDraft}
              onChange={(e) => onEditDraftChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
              autoFocus
            />
            <button className="lc-edit-btn" onClick={onSaveEdit}><Check size={13} /></button>
            <button className="lc-edit-btn" onClick={onCancelEdit}><X size={13} /></button>
          </div>
        ) : (
          <div className="lc-msg-wrap">
            {isOwn && !isMedia && (
              <button className="lc-msg-menu-btn" onClick={() => setMenuOpen((v) => !v)}><MoreVertical size={13} /></button>
            )}
            {isOwn && isMedia && (
              <button className="lc-msg-menu-btn" onClick={() => setMenuOpen((v) => !v)}><MoreVertical size={13} /></button>
            )}
            {menuOpen && (
              <div className="lc-msg-menu">
                {!isMedia && <button onClick={() => { setMenuOpen(false); onStartEdit(); }}><Pencil size={12} />Edit</button>}
                <button className="danger" onClick={() => { setMenuOpen(false); onDelete(); }}><Trash2 size={12} />Delete</button>
              </div>
            )}
            <div className={`lc-bubble ${isOwn ? "own" : ""} ${isMedia ? "media" : ""}`}>
              {isMedia ? <MediaContent msg={msg} /> : msg.content}
            </div>
          </div>
        )}

        <div className="lc-msg-meta">
          {Array.isArray(msg.reactions) && msg.reactions.map((r, i) => (
            <span key={i} className="lc-reaction">{r.emoji} {r.user_ids?.length ?? ""}</span>
          ))}
          {msg.edited_at && <span className="lc-edited-tag">edited</span>}
          <span className="lc-time">{formatTime(msg.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name, initials }) {
  return (
    <div className="lc-msg-row">
      <Avatar initials={initials} size={30} />
      <div className="lc-typing"><i /><i /><i /></div>
    </div>
  );
}

function InfoPanel({ isDrawer, onClose, groupId, groupDetails, members, onlineIds }) {
  const navigate = useNavigate();
  const inviteLink = groupDetails ? `${window.location.host}/join/${groupDetails.invite_code}` : "";
  return (
    <aside className={`lc-info ${isDrawer ? "drawer" : ""}`}>
      <div className="lc-groups-head">
        <span>Group info</span>
        {isDrawer && <button className="lc-icon-btn" onClick={onClose}><X size={18} /></button>}
      </div>
      <div className="lc-info-body">
        <div className="lc-info-hero">
          <Avatar initials={initialsOf(groupDetails?.name)} imageUrl={groupDetails?.image_url} size={64} />
          <strong>{groupDetails?.name || "…"}</strong>
          <span className="muted">{members.length} members · {onlineIds.length} online</span>
        </div>
        <p className="lc-info-desc">{groupDetails?.description || "No description yet."}</p>
        <div className="lc-info-section">
          <div className="lc-info-label">Members <span className="muted">{Math.min(members.length, 4)} shown</span></div>
          {members.slice(0, 4).map((m) => (
            <div key={m.id} className="lc-member-row">
              <Avatar initials={initialsOf(m.profile.display_name || m.profile.username)} imageUrl={m.profile.profile_image_url} size={30} online={onlineIds.includes(m.profile.id)} />
              <span>{m.profile.display_name || m.profile.username}</span>
              <RoleBadge role={m.role} />
            </div>
          ))}
          <button className="lc-info-link-btn" onClick={() => navigate(`/groups/${groupId}/members`)}>View all members</button>
        </div>
        <div className="lc-info-section">
          <div className="lc-info-label">Invite link</div>
          <div className="lc-invite-chip">{inviteLink || "…"}</div>
        </div>
        <button className="lc-info-admin-btn" onClick={() => navigate(`/groups/${groupId}/admin`)}>Open admin dashboard</button>
      </div>
    </aside>
  );
}

export default function GroupChatInterface() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth

  const [currentUser, setCurrentUser] = useState(null); // { id, username, displayName }
  const [myGroups, setMyGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [typingUserId, setTypingUserId] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const listRef = useRef(null);
  const presenceRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  // current user's profile + their group list — runs once auth resolves
  useEffect(() => {
    if (!authUser) return;
    getProfile(authUser.id).then((profile) => {
      setCurrentUser({
        id: authUser.id,
        username: profile.username,
        displayName: profile.display_name || profile.username,
        imageUrl: profile.profile_image_url,
      });
    });
    getMyGroups(authUser.id)
      .then(setMyGroups)
      .finally(() => setGroupsLoading(false));
  }, [authUser]);

  // this group's details, members, and message history — reloads whenever the route changes
  useEffect(() => {
    if (!groupId) return;
    setMessagesLoading(true);
    getGroupDetails(groupId).then(setGroupDetails).catch(() => setGroupDetails(null));
    getMembers(groupId).then(setMembers).catch(() => setMembers([]));
    getMessages(groupId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));

    const unsubscribe = subscribeToMessageChanges(groupId, {
      onInsert: (newMsg) => {
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      },
      onUpdate: (updated) => {
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
      },
      onDelete: (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
    });
    return unsubscribe;
  }, [groupId]);

  // presence — online members + typing broadcast
  useEffect(() => {
    if (!groupId || !currentUser) return;
    const presence = subscribeToPresence(groupId, currentUser.id, {
      onTyping: (userId) => {
        if (userId === currentUser.id) return;
        setTypingUserId(userId);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 2000);
      },
      onOnlineChange: (ids) => setOnlineIds(ids),
    });
    presenceRef.current = presence;
    return () => presence.unsubscribe();
  }, [groupId, currentUser]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingUserId]);

  const resolveSender = useCallback((msg) => {
    if (msg.sender) {
      const name = msg.sender.display_name || msg.sender.username;
      return { name, initials: initialsOf(name), imageUrl: msg.sender.profile_image_url };
    }
    if (currentUser && msg.sender_id === currentUser.id) {
      return { name: currentUser.displayName, initials: initialsOf(currentUser.displayName), imageUrl: currentUser.imageUrl };
    }
    const m = members.find((mm) => mm.profile.id === msg.sender_id);
    if (m) {
      const name = m.profile.display_name || m.profile.username;
      return { name, initials: initialsOf(name), imageUrl: m.profile.profile_image_url };
    }
    return { name: "Member", initials: "?", imageUrl: null };
  }, [members, currentUser]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !currentUser || !groupId) return;
    setDraft("");
    setShowEmoji(false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: groupId,
      sender_id: currentUser.id,
      content: text,
      message_type: "text",
      created_at: new Date().toISOString(),
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const saved = await sendMessage({ groupId, senderId: currentUser.id, content: text });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [draft, groupId, currentUser]);

  function handleDraftChange(e) {
    setDraft(e.target.value);
    presenceRef.current?.sendTyping();
  }

  function handleEmojiPick(emoji) {
    setDraft((prev) => prev + emoji);
  }

  async function handleMediaPick(e, type) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !currentUser || !groupId) return;
    setUploading(true);
    try {
      const saved = await sendMediaMessage({ groupId, senderId: currentUser.id, file, type });
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    } catch (err) {
      console.error("Failed to send attachment:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleVoiceClick() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        setRecording(false);
        setRecordSeconds(0);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size === 0 || !currentUser || !groupId) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try {
          const saved = await sendMediaMessage({ groupId, senderId: currentUser.id, file, type: "voice" });
          setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
        } catch (err) {
          console.error("Failed to send voice message:", err);
        } finally {
          setUploading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
    }
  }

  function handleStartEdit(msg) {
    setEditingId(msg.id);
    setEditDraft(msg.content || "");
  }

  async function handleSaveEdit() {
    const text = editDraft.trim();
    if (!text) return;
    const id = editingId;
    setEditingId(null);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: text, edited_at: new Date().toISOString() } : m)));
    try {
      await editMessage(id, text);
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  }

  async function handleDeleteMessage(msg) {
    if (!window.confirm("Delete this message? This can't be undone.")) return;
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    try {
      await deleteMessage(msg.id);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }

  const typingSender = typingUserId ? resolveSender({ sender_id: typingUserId }) : null;

  return (
    <div className="lc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .lc-root {
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg);
          width:100%; height:90dvh; max-height:680px; display:flex; border:1px solid var(--border);
          border-radius:16px; overflow:hidden; position:relative;
        }
        .lc-root * { box-sizing:border-box; }
        .lc-root button { font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; }
        .lc-root input { font-family:inherit; border:none; outline:none; background:none; color:inherit; font-size:14px; }
        .muted { color:var(--muted); font-size:12.5px; }
        .row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
        .line1 { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:170px; }
        .lc-spin { animation:lc-rotate .8s linear infinite; }
        @keyframes lc-rotate { to { transform:rotate(360deg); } }

        .lc-rail { width:64px; background:var(--ink); display:flex; flex-direction:column; align-items:center;
          padding:14px 0; gap:6px; flex-shrink:0; overflow-y:auto; }
        .lc-logo { width:34px; height:34px; border-radius:10px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
        .lc-rail-btn { width:40px; height:40px; border-radius:10px; color:#9498B8; display:flex;
          align-items:center; justify-content:center; }
        .lc-rail-btn:hover { background:#22224A; color:#fff; }
        .lc-rail-btn.on { background:var(--primary); color:#fff; }
        .lc-rail-spacer { flex:1; }

        .lc-groups { width:280px; background:var(--surface); border-right:1px solid var(--border);
          display:flex; flex-direction:column; flex-shrink:0; }
        .lc-groups-head { padding:16px 16px 8px; font-family:'Space Grotesk'; font-weight:600; font-size:15px;
          display:flex; justify-content:space-between; align-items:center; }
        .lc-search { margin:6px 14px 10px; background:var(--bg); border-radius:9px; padding:8px 10px;
          display:flex; align-items:center; gap:8px; color:var(--muted); }
        .lc-groups-list { overflow-y:auto; flex:1; padding:0 8px 8px; }
        .lc-groups-status { padding:24px 14px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .lc-groups-create-btn { background:var(--primary); color:#fff; border:none; border-radius:9px; padding:8px 14px; font-size:12.5px; font-weight:600; }
        .lc-group-item { width:100%; display:flex; align-items:center; gap:10px; padding:9px 8px;
          border-radius:10px; text-align:left; position:relative; }
        .lc-group-item:hover { background:var(--bg); }
        .lc-group-item.active { background:var(--primary-soft); }
        .lc-group-item-text { flex:1; min-width:0; }
        .lc-group-item-text strong { font-size:13.5px; }

        .lc-avatar { border-radius:50%; background:var(--primary-soft); color:var(--primary); font-weight:600;
          display:inline-flex; align-items:center; justify-content:center; position:relative; flex-shrink:0;
          font-family:'Space Grotesk'; overflow:hidden; }
        .lc-dot { position:absolute; bottom:-1px; right:-1px; width:10px; height:10px; border-radius:50%;
          background:#C7C9DA; border:2px solid var(--surface); }
        .lc-dot.on { background:var(--accent); }

        .lc-center { flex:1; display:flex; flex-direction:column; min-width:0; }
        .lc-header { height:64px; border-bottom:1px solid var(--border); display:flex; align-items:center;
          gap:12px; padding:0 18px; flex-shrink:0; }
        .lc-header-text { flex:1; min-width:0; }
        .lc-header-text strong { font-family:'Space Grotesk'; font-size:15.5px; display:block; }
        .lc-icon-btn { width:34px; height:34px; border-radius:9px; display:flex; align-items:center;
          justify-content:center; color:var(--muted); position:relative; flex-shrink:0; }
        .lc-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .lc-messages { flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:14px; }
        .lc-messages-status { flex:1; display:flex; align-items:center; justify-content:center; }

        .lc-announcement { background:linear-gradient(135deg, var(--primary-soft), var(--surface)); border:1px solid var(--border);
          border-radius:12px; padding:12px 14px; display:flex; gap:10px; font-size:13.5px; color:var(--ink); }
        .lc-ann-head { font-weight:600; font-size:11.5px; text-transform:none; color:var(--primary); margin-bottom:2px; }

        .lc-msg-row { display:flex; gap:8px; max-width:72%; }
        .lc-msg-row.own { align-self:flex-end; flex-direction:row-reverse; max-width:65%; }
        .lc-msg-col { display:flex; flex-direction:column; gap:3px; min-width:0; }
        .lc-msg-row.own .lc-msg-col { align-items:flex-end; }
        .lc-msg-sender { font-size:12px; font-weight:600; color:var(--primary); margin-left:2px; }

        .lc-msg-wrap { position:relative; display:flex; align-items:flex-start; gap:4px; }
        .lc-msg-row.own .lc-msg-wrap { flex-direction:row-reverse; }
        .lc-msg-menu-btn { width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); flex-shrink:0; margin-top:8px; opacity:0.5; }
        .lc-msg-menu-btn:hover { opacity:1; background:var(--bg); }
        .lc-msg-menu { position:absolute; top:0; right:0; background:var(--surface); border:1px solid var(--border);
          border-radius:10px; box-shadow:0 10px 24px -8px rgba(20,20,43,.3); padding:5px; z-index:5; min-width:110px; }
        .lc-msg-row.own .lc-msg-menu { right:auto; left:0; }
        .lc-msg-menu button { width:100%; display:flex; align-items:center; gap:7px; padding:7px 9px; font-size:12.5px;
          border-radius:7px; text-align:left; }
        .lc-msg-menu button:hover { background:var(--bg); }
        .lc-msg-menu button.danger { color:var(--danger); }

        .lc-bubble { background:var(--surface); border:1px solid var(--border); padding:9px 13px; border-radius:14px 14px 14px 4px;
          font-size:14px; line-height:1.45; }
        .lc-bubble.own { background:var(--primary); color:#fff; border:none; border-radius:14px 14px 4px 14px; }
        .lc-bubble.media { padding:6px; }
        .lc-media-image { max-width:220px; max-height:220px; border-radius:10px; display:block; object-fit:cover; }
        .lc-media-audio { max-width:220px; height:38px; }
        .lc-media-file { display:flex; align-items:center; gap:8px; padding:6px 8px; color:inherit; text-decoration:none; }
        .lc-media-file-name { font-size:13px; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .lc-edit-box { display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--primary);
          border-radius:12px; padding:4px 4px 4px 10px; }
        .lc-edit-input { font-size:14px; min-width:120px; }
        .lc-edit-btn { width:24px; height:24px; border-radius:7px; display:flex; align-items:center; justify-content:center;
          color:var(--primary); flex-shrink:0; }
        .lc-edit-btn:hover { background:var(--bg); }

        .lc-msg-meta { display:flex; gap:6px; align-items:center; font-size:11px; color:var(--muted); padding:0 4px; }
        .lc-reaction { background:var(--bg); border-radius:20px; padding:1px 7px; font-size:11.5px; }
        .lc-edited-tag { font-style:italic; }
        .lc-typing { background:var(--surface); border:1px solid var(--border); border-radius:14px 14px 14px 4px;
          padding:11px 14px; display:flex; gap:4px; align-items:center; }
        .lc-typing i { width:6px; height:6px; border-radius:50%; background:var(--muted); animation:lc-bounce 1.1s infinite ease-in-out; }
        .lc-typing i:nth-child(2){ animation-delay:.15s } .lc-typing i:nth-child(3){ animation-delay:.3s }
        @keyframes lc-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.5 } 30%{ transform:translateY(-4px); opacity:1 } }

        .lc-composer { border-top:1px solid var(--border); padding:12px 16px; display:flex; align-items:center; gap:6px; flex-shrink:0; position:relative; }
        .lc-composer input { flex:1; padding:10px 4px; font-size:14px; }
        .lc-send { width:36px; height:36px; border-radius:10px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lc-send:disabled { background:#C7C9DA; }

        .lc-emoji-pop { position:absolute; bottom:56px; left:12px; background:var(--surface); border:1px solid var(--border);
          border-radius:14px; box-shadow:0 14px 32px -10px rgba(20,20,43,.3); padding:10px; display:grid;
          grid-template-columns:repeat(6, 1fr); gap:2px; z-index:8; width:230px; }
        .lc-emoji-pop button { font-size:19px; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
        .lc-emoji-pop button:hover { background:var(--bg); }

        .lc-recording-bar { position:absolute; inset:0; background:var(--surface); display:flex; align-items:center;
          gap:10px; padding:0 16px; }
        .lc-rec-dot { width:10px; height:10px; border-radius:50%; background:var(--danger); animation:lc-pulse 1s infinite; }
        @keyframes lc-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .lc-rec-time { font-size:13px; font-weight:600; flex:1; }
        .lc-rec-stop { background:var(--danger); color:#fff; border-radius:9px; padding:8px 14px; font-size:12.5px; font-weight:600;
          display:flex; align-items:center; gap:6px; }

        .lc-info { width:280px; background:var(--surface); border-left:1px solid var(--border); flex-shrink:0;
          display:flex; flex-direction:column; overflow-y:auto; }
        .lc-info-body { padding:0 16px 16px; }
        .lc-info-hero { display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 0 18px; text-align:center; }
        .lc-info-hero strong { font-family:'Space Grotesk'; font-size:15px; }
        .lc-info-desc { font-size:13px; color:var(--muted); line-height:1.5; margin:0 0 18px; }
        .lc-info-label { font-size:11.5px; font-weight:600; color:var(--muted); margin-bottom:8px; display:flex; justify-content:space-between; }
        .lc-info-section { margin-bottom:18px; }
        .lc-member-row { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; }
        .lc-badge { display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:600; padding:2px 6px;
          border-radius:6px; margin-left:auto; }
        .lc-badge.host { background:#FFF1D6; color:#946200; }
        .lc-badge.admin { background:var(--primary-soft); color:var(--primary); }
        .lc-invite-chip { background:var(--bg); border:1px dashed var(--border); border-radius:9px; padding:9px 11px;
          font-size:12px; color:var(--ink); font-family:monospace; word-break:break-all; }
        .lc-info-link-btn { width:100%; text-align:left; font-size:12px; font-weight:600; color:var(--primary);
          background:none; border:none; padding:6px 2px; margin-top:2px; }
        .lc-info-admin-btn { width:100%; background:var(--ink); color:var(--surface); border:none; border-radius:10px;
          padding:11px; font-size:13px; font-weight:600; margin-top:6px; }

        .lc-groups.drawer, .lc-info.drawer { position:absolute; top:0; bottom:0; z-index:5; box-shadow:0 0 24px rgba(20,20,43,.18); }
        .lc-groups.drawer { left:0; } .lc-info.drawer { right:0; }

        @media (max-width: 820px) {
          .lc-groups:not(.drawer), .lc-info:not(.drawer) { display:none; }
        }
        @media (min-width: 821px) {
          .lc-groups.drawer, .lc-info.drawer { display:none; }
        }
      `}</style>

      <GroupRail onDrawerToggle={() => setShowGroups(true)} />
      <GroupList
        groups={myGroups}
        loading={groupsLoading}
        activeId={groupId}
        isDrawer={showGroups}
        onClose={() => setShowGroups(false)}
      />

      <div className="lc-center">
        <div className="lc-header">
          <button className="lc-icon-btn" onClick={() => setShowGroups(true)} title="Groups"><Menu size={18} /></button>
          <Avatar initials={initialsOf(groupDetails?.name)} imageUrl={groupDetails?.image_url} size={38} />
          <div className="lc-header-text">
            <strong>{groupDetails?.name || "Loading…"}</strong>
            <span className="muted">{onlineIds.length} online · {members.length} members</span>
          </div>
          <button className="lc-icon-btn" onClick={() => setShowInfo(true)} title="Group info"><Info size={18} /></button>
          <button className="lc-icon-btn"><MoreVertical size={18} /></button>
        </div>

        <div className="lc-messages" ref={listRef}>
          {messagesLoading ? (
            <div className="lc-messages-status"><Loader2 size={22} className="lc-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="lc-messages-status muted">This conversation is just getting started. Send the first message.</div>
          ) : (
            messages.map((m) => (
              <Message
                key={m.id}
                msg={m}
                isOwn={m.sender_id === currentUser?.id}
                resolveSender={resolveSender}
                isEditing={editingId === m.id}
                editDraft={editDraft}
                onEditDraftChange={setEditDraft}
                onStartEdit={() => handleStartEdit(m)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => handleDeleteMessage(m)}
              />
            ))
          )}
          {typingSender && <TypingIndicator name={typingSender.name} initials={typingSender.initials} />}
        </div>

        <div className="lc-composer">
          {recording && (
            <div className="lc-recording-bar">
              <span className="lc-rec-dot" />
              <span className="lc-rec-time">Recording… {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}</span>
              <button className="lc-rec-stop" onClick={handleVoiceClick}><Square size={12} />Stop & send</button>
            </div>
          )}

          {showEmoji && (
            <div className="lc-emoji-pop">
              {EMOJIS.map((e) => <button key={e} onClick={() => handleEmojiPick(e)}>{e}</button>)}
            </div>
          )}

          <button className="lc-icon-btn" title="Emoji" onClick={() => setShowEmoji((v) => !v)}><Smile size={18} /></button>
          <button className="lc-icon-btn" title="Attach" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="lc-spin" /> : <Paperclip size={18} />}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => handleMediaPick(e, "file")} />
          <button className="lc-icon-btn" title="Image" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
            <ImageIcon size={18} />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleMediaPick(e, "image")} />
          <input
            placeholder="Write a message..."
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="lc-icon-btn" title="Voice message" onClick={handleVoiceClick}><Mic size={18} /></button>
          <button className="lc-send" disabled={!draft.trim()} onClick={handleSend}><Send size={16} /></button>
        </div>
      </div>

      <InfoPanel
        isDrawer={showInfo}
        onClose={() => setShowInfo(false)}
        groupId={groupId}
        groupDetails={groupDetails}
        members={members}
        onlineIds={onlineIds}
      />
    </div>
  );
}
