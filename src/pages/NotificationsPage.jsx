import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, AtSign, Reply, Link2, UserPlus, Megaphone, Check, BellOff, Loader2, Settings, UserMinus
} from "lucide-react";
import { getNotifications, markAllRead, subscribeToNotifications, getMutedGroupIds, setGroupMuted } from "../lib/notifications";
import { useAuth } from "../lib/AuthContext";

const ICONS = {
  mention: AtSign,
  reply: Reply,
  invite: Link2,
  member_joined: UserPlus,
  announcement: Megaphone,
  group_updated: Settings,
  member_removed: UserMinus,
};

const ICON_COLORS = {
  mention: "#4338CA",
  reply: "#4338CA",
  invite: "#946200",
  member_joined: "#16C7A6",
  announcement: "#E5484D",
  group_updated: "#4338CA",
  member_removed: "#E5484D",
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutedIds, setMutedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([getNotifications(user.id), getMutedGroupIds(user.id)])
      .then(([n, muted]) => {
        setNotifs(n);
        setMutedIds(muted);
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifs((prev) => (prev.some((n) => n.id === newNotif.id) ? prev : [newNotif, ...prev]));
    });
    return unsubscribe;
  }, [user]);

  async function handleMarkAllRead() {
    await markAllRead(user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleToggleMute(groupId) {
    const isMuted = mutedIds.has(groupId);
    await setGroupMuted(user.id, groupId, !isMuted);
    setMutedIds((prev) => {
      const next = new Set(prev);
      isMuted ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  }

  function handleNotifClick(n) {
    if (n.type === "member_joined" || n.type === "member_removed") navigate(`/groups/${n.group_id}/members`);
    else if (n.type === "invite" && n.group?.invite_code) navigate(`/join/${n.group.invite_code}`);
    else if (n.group_id) navigate(`/groups/${n.group_id}`);
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="nt-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .nt-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; max-width:440px; min-height:560px;
          display:flex; flex-direction:column; }
        .nt-root * { box-sizing:border-box; }
        .nt-root button { font-family:inherit; cursor:pointer; }
        .nt-spin { animation:nt-rotate .8s linear infinite; }
        @keyframes nt-rotate { to { transform:rotate(360deg); } }

        .nt-header { display:flex; align-items:center; gap:10px; padding:16px 16px 14px; border-bottom:1px solid var(--border); }
        .nt-icon-btn { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); border:none; background:none; }
        .nt-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .nt-header strong { font-family:'Space Grotesk'; font-size:16px; flex:1; }
        .nt-unread-pill { background:var(--primary); color:#fff; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
        .nt-mark-read { font-size:12px; font-weight:600; color:var(--primary); background:none; border:none; display:flex;
          align-items:center; gap:4px; }

        .nt-list { flex:1; overflow-y:auto; padding:8px 10px; }
        .nt-status { padding:60px 20px; text-align:center; color:var(--muted); display:flex; justify-content:center; }
        .nt-row { display:flex; gap:11px; padding:11px 10px; border-radius:12px; position:relative; cursor:pointer; }
        .nt-row:hover { background:var(--bg); }
        .nt-row.unread { background:var(--primary-soft); }
        .nt-row.unread:hover { background:#E4E7FB; }
        .nt-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; background:#fff; }
        .nt-text { flex:1; min-width:0; }
        .nt-group-name { font-size:11.5px; font-weight:600; color:var(--primary); margin-bottom:2px; display:block; }
        .nt-body { font-size:13px; line-height:1.4; color:#2E2F4C; }
        .nt-time { font-size:11px; color:var(--muted); margin-top:4px; display:flex; align-items:center; gap:8px; }
        .nt-mute-btn { font-size:10.5px; color:var(--muted); background:none; border:none; display:flex; align-items:center; gap:3px; }
        .nt-mute-btn:hover { color:var(--ink); }
        .nt-mute-btn.on { color:var(--primary); }
        .nt-dot { width:7px; height:7px; border-radius:50%; background:var(--primary); position:absolute; top:14px; right:10px; }
      `}</style>

      <div className="nt-header">
        <button className="nt-icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
        <strong>Notifications</strong>
        {unreadCount > 0 && <span className="nt-unread-pill">{unreadCount}</span>}
        <button className="nt-mark-read" onClick={handleMarkAllRead}><Check size={13} />Mark all read</button>
      </div>

      <div className="nt-list">
        {loading && <div className="nt-status"><Loader2 size={20} className="nt-spin" /></div>}
        {!loading && notifs.length === 0 && (
          <div className="nt-status">Nothing here yet — mentions, replies, and group activity will show up here.</div>
        )}
        {!loading && notifs.map((n) => {
          const Icon = ICONS[n.type] || Megaphone;
          const isMuted = n.group_id ? mutedIds.has(n.group_id) : false;
          const actorName = n.actor?.display_name || n.actor?.username;
          return (
            <div className={`nt-row ${!n.read ? "unread" : ""}`} key={n.id} onClick={() => handleNotifClick(n)}>
              <div className="nt-icon"><Icon size={16} color={ICON_COLORS[n.type]} /></div>
              <div className="nt-text">
                <span className="nt-group-name">{n.group?.name || "LINKCHAT"}</span>
                <div className="nt-body">{n.content}</div>
                <div className="nt-time">
                  {timeAgo(n.created_at)}
                  {n.group_id && (
                    <button
                      className={`nt-mute-btn ${isMuted ? "on" : ""}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleMute(n.group_id); }}
                    >
                      <BellOff size={11} />{isMuted ? "Muted" : "Mute group"}
                    </button>
                  )}
                </div>
              </div>
              {!n.read && <span className="nt-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
