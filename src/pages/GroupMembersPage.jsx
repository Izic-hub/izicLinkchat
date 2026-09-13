import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search, MoreVertical, Crown, Shield, ShieldPlus, UserMinus, VolumeX,
  Ban, User, ChevronLeft, Users, Loader2
} from "lucide-react";
import { getMembers, setMemberRole, setMemberStatus, removeMember } from "../lib/members";
import { useAuth } from "../lib/AuthContext";

const ROLE_ORDER = { host: 0, admin: 1, member: 2 };

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function RoleBadge({ role }) {
  if (role === "host") return <span className="mp-badge host"><Crown size={11} />Host</span>;
  if (role === "admin") return <span className="mp-badge admin"><Shield size={11} />Admin</span>;
  return null;
}

function MemberMenu({ member, onAction, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const isMuted = member.status === "muted";

  return (
    <div className="mp-menu" ref={ref}>
      <button onClick={() => onAction("view")}><User size={14} />View profile</button>
      {member.role === "member" && <button onClick={() => onAction("promote")}><ShieldPlus size={14} />Make admin</button>}
      {member.role === "admin" && <button onClick={() => onAction("demote")}><ShieldPlus size={14} />Remove admin</button>}
      <button onClick={() => onAction("mute")}><VolumeX size={14} />{isMuted ? "Unmute member" : "Mute member"}</button>
      <button className="danger" onClick={() => onAction("remove")}><UserMinus size={14} />Remove member</button>
      <button className="danger" onClick={() => onAction("ban")}><Ban size={14} />Ban member</button>
    </div>
  );
}

export default function GroupMembersPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user: authUser } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth
  const currentUserId = authUser?.id || null;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    getMembers(groupId).then(setMembers).finally(() => setLoading(false));
  }, [groupId]);

  const myRole = members.find((m) => m.profile.id === currentUserId)?.role;
  const isCurrentUserAdmin = myRole === "host" || myRole === "admin";

  const filtered = members
    .filter((m) => {
      const name = m.profile.display_name || m.profile.username;
      return name.toLowerCase().includes(query.toLowerCase()) || m.profile.username.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 2400);
  }

  async function handleAction(member, action) {
    setOpenMenuId(null);
    const displayName = member.profile.display_name || member.profile.username;
    try {
      if (action === "view") {
        showToast(`${displayName}'s profile page isn't built yet.`);
      }
      if (action === "promote") {
        await setMemberRole(member.id, "admin");
        setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: "admin" } : m)));
        showToast(`${displayName} is now an admin.`);
      }
      if (action === "demote") {
        await setMemberRole(member.id, "member");
        setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: "member" } : m)));
        showToast(`${displayName} is no longer an admin.`);
      }
      if (action === "mute") {
        const newStatus = member.status === "muted" ? "active" : "muted";
        await setMemberStatus(member.id, newStatus);
        setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m)));
        showToast(newStatus === "muted" ? `${displayName} muted.` : `${displayName} unmuted.`);
      }
      if (action === "remove") {
        await removeMember(member.id);
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        showToast(`${displayName} removed from the group.`);
      }
      if (action === "ban") {
        await setMemberStatus(member.id, "banned");
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        showToast(`${displayName} banned from the group.`);
      }
    } catch (err) {
      showToast(err.message || "That action failed — try again.");
    }
  }

  return (
    <div className="mp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .mp-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0; --danger:#E5484D;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; max-width:560px;
          min-height:600px; display:flex; flex-direction:column; position:relative; }
        .mp-root * { box-sizing:border-box; }
        .mp-root button { font-family:inherit; cursor:pointer; }
        .mp-root input { font-family:inherit; outline:none; border:none; background:none; }
        .mp-spin { animation:mp-rotate .8s linear infinite; }
        @keyframes mp-rotate { to { transform:rotate(360deg); } }

        .mp-header { padding:18px 20px 14px; border-bottom:1px solid var(--border); }
        .mp-header-top { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .mp-icon-btn { width:32px; height:32px; border-radius:9px; display:flex; align-items:center;
          justify-content:center; color:var(--muted); border:none; background:none; }
        .mp-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .mp-title { font-family:'Space Grotesk'; font-size:16.5px; font-weight:600; flex:1; }
        .mp-count { font-size:12.5px; color:var(--muted); display:flex; align-items:center; gap:5px; }
        .mp-search { background:var(--bg); border-radius:10px; padding:9px 12px; display:flex; align-items:center;
          gap:8px; color:var(--muted); }
        .mp-search input { flex:1; font-size:13.5px; color:var(--ink); }

        .mp-list { flex:1; overflow-y:auto; padding:8px 10px; }
        .mp-status { padding:40px 20px; text-align:center; color:var(--muted); display:flex; justify-content:center; }
        .mp-row { display:flex; align-items:center; gap:11px; padding:10px 10px; border-radius:12px; position:relative; }
        .mp-row:hover { background:var(--bg); }
        .mp-avatar { width:42px; height:42px; border-radius:12px; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:14px; display:flex; align-items:center;
          justify-content:center; position:relative; flex-shrink:0; }
        .mp-info { flex:1; min-width:0; }
        .mp-name-row { display:flex; align-items:center; gap:7px; }
        .mp-name-row strong { font-size:13.5px; }
        .mp-you { font-size:10.5px; color:var(--muted); background:var(--bg); padding:1px 6px; border-radius:6px; }
        .mp-username { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:6px; }
        .mp-muted-tag { color:var(--danger); font-weight:600; }
        .mp-badge { display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:600;
          padding:3px 7px; border-radius:7px; }
        .mp-badge.host { background:#FFF1D6; color:#946200; }
        .mp-badge.admin { background:var(--primary-soft); color:var(--primary); }

        .mp-menu { position:absolute; right:10px; top:52px; background:#fff; border:1px solid var(--border);
          border-radius:12px; box-shadow:0 14px 32px -12px rgba(20,20,43,.28); padding:6px; z-index:10; min-width:180px; }
        .mp-menu button { width:100%; display:flex; align-items:center; gap:9px; padding:9px 10px; font-size:13px;
          border-radius:8px; text-align:left; color:var(--ink); background:none; border:none; }
        .mp-menu button:hover { background:var(--bg); }
        .mp-menu button.danger { color:var(--danger); }

        .mp-toast { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); background:var(--ink);
          color:#fff; font-size:12.5px; padding:10px 16px; border-radius:10px; box-shadow:0 10px 24px -8px rgba(20,20,43,.4);
          max-width:90%; text-align:center; }
      `}</style>

      <div className="mp-header">
        <div className="mp-header-top">
          <button className="mp-icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
          <span className="mp-title">Members</span>
          <span className="mp-count"><Users size={13} />{members.length}</span>
        </div>
        <div className="mp-search">
          <Search size={15} />
          <input placeholder="Search members" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="mp-list">
        {loading && <div className="mp-status"><Loader2 size={20} className="mp-spin" /></div>}
        {!loading && filtered.map((m) => {
          const displayName = m.profile.display_name || m.profile.username;
          const isYou = m.profile.id === currentUserId;
          return (
            <div className="mp-row" key={m.id}>
              <div className="mp-avatar">{initialsOf(displayName)}</div>
              <div className="mp-info">
                <div className="mp-name-row">
                  <strong>{displayName}</strong>
                  {isYou && <span className="mp-you">You</span>}
                  <RoleBadge role={m.role} />
                </div>
                <div className="mp-username">
                  @{m.profile.username}
                  {m.status === "muted" && <span className="mp-muted-tag">· Muted</span>}
                </div>
              </div>
              {isCurrentUserAdmin && !isYou && m.role !== "host" && (
                <button className="mp-icon-btn" onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}>
                  <MoreVertical size={16} />
                </button>
              )}
              {openMenuId === m.id && (
                <MemberMenu member={m} onAction={(a) => handleAction(m, a)} onClose={() => setOpenMenuId(null)} />
              )}
            </div>
          );
        })}
      </div>

      {toast && <div className="mp-toast">{toast}</div>}
    </div>
  );
}
