import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Users, MessagesSquare, Trash2, Ban, ChevronLeft, Loader2,
  Crown, Lock, Globe
} from "lucide-react";
import { getAllGroups, getAllUsers, platformDeleteGroup, setUserBanned } from "../lib/superadmin";

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getAllGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  async function handleDelete(g) {
    if (!window.confirm(`Delete "${g.name}" platform-wide? This removes it and everything in it for every member, permanently.`)) return;
    setDeletingId(g.id);
    try {
      await platformDeleteGroup(g.id);
      setGroups((prev) => prev.filter((row) => row.id !== g.id));
    } catch (err) {
      alert(err.message || "Couldn't delete that group.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="sa-status"><Loader2 size={20} className="sa-spin" /></div>;

  return (
    <div className="sa-list">
      <div className="sa-count">{groups.length} groups total</div>
      {groups.map((g) => (
        <div className="sa-row" key={g.id}>
          <div className="sa-avatar">
            {g.image_url ? <img src={g.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(g.name)}
          </div>
          <div className="sa-row-text">
            <strong>{g.name}</strong>
            <span className="sa-muted">
              {g.privacy === "private" ? <Lock size={11} /> : <Globe size={11} />} {g.privacy}
              {" · hosted by "}{g.host?.display_name || g.host?.username || "unknown"}
            </span>
          </div>
          <button className="sa-danger-btn" onClick={() => handleDelete(g)} disabled={deletingId === g.id}>
            {deletingId === g.id ? <Loader2 size={13} className="sa-spin" /> : <><Trash2 size={13} />Delete</>}
          </button>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  async function toggleBan(u) {
    setBusyId(u.id);
    try {
      await setUserBanned(u.id, !u.banned);
      setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, banned: !u.banned } : row)));
    } catch (err) {
      alert(err.message || "Couldn't update that user.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="sa-status"><Loader2 size={20} className="sa-spin" /></div>;

  return (
    <div className="sa-list">
      <div className="sa-count">{users.length} users total</div>
      {users.map((u) => (
        <div className="sa-row" key={u.id}>
          <div className="sa-avatar">
            {u.profile_image_url ? <img src={u.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(u.display_name || u.username)}
          </div>
          <div className="sa-row-text">
            <strong>{u.display_name || u.username} {u.is_platform_admin && <Crown size={12} color="#946200" style={{ marginLeft: 4 }} />}</strong>
            <span className="sa-muted">@{u.username}{u.banned && <span className="sa-banned-tag"> · Banned</span>}</span>
          </div>
          {!u.is_platform_admin && (
            <button className={u.banned ? "sa-btn-ghost" : "sa-danger-btn"} onClick={() => toggleBan(u)} disabled={busyId === u.id}>
              {busyId === u.id ? <Loader2 size={13} className="sa-spin" /> : u.banned ? "Unban" : <><Ban size={13} />Ban</>}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("groups");

  return (
    <div className="sa-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .sa-root { font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; max-width:560px; min-height:600px;
          display:flex; flex-direction:column; }
        .sa-root * { box-sizing:border-box; }
        .sa-root button { font-family:inherit; cursor:pointer; }
        .sa-spin { animation:sa-rotate .8s linear infinite; }
        @keyframes sa-rotate { to { transform:rotate(360deg); } }

        .sa-header { padding:16px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
        .sa-icon-btn { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); background:none; border:none; }
        .sa-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .sa-header strong { font-family:'Space Grotesk'; font-size:16px; flex:1; display:flex; align-items:center; gap:7px; }

        .sa-tabs { display:flex; border-bottom:1px solid var(--border); padding:0 16px; }
        .sa-tab { flex:1; padding:12px 0; text-align:center; font-size:13px; font-weight:600; color:var(--muted);
          background:none; border:none; border-bottom:2px solid transparent; display:flex; align-items:center;
          justify-content:center; gap:6px; }
        .sa-tab.active { color:var(--primary); border-color:var(--primary); }

        .sa-status { flex:1; display:flex; align-items:center; justify-content:center; padding:60px 0; }
        .sa-list { padding:12px 14px; overflow-y:auto; flex:1; }
        .sa-count { font-size:11.5px; color:var(--muted); font-weight:600; margin-bottom:10px; padding:0 6px; }

        .sa-row { display:flex; align-items:center; gap:11px; padding:9px 6px; border-radius:12px; }
        .sa-row:hover { background:var(--bg); }
        .sa-avatar { width:40px; height:40px; border-radius:11px; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; overflow:hidden; }
        .sa-row-text { flex:1; min-width:0; }
        .sa-row-text strong { font-size:13.5px; display:flex; align-items:center; }
        .sa-muted { font-size:11.5px; color:var(--muted); display:flex; align-items:center; gap:4px; }
        .sa-banned-tag { color:var(--danger); font-weight:600; }

        .sa-danger-btn { display:flex; align-items:center; gap:5px; background:none; border:1px solid var(--danger);
          color:var(--danger); border-radius:8px; padding:6px 11px; font-size:12px; font-weight:600; flex-shrink:0; }
        .sa-danger-btn:hover { background:#FDEAEA; }
        .sa-btn-ghost { border:1px solid var(--border); background:#fff; border-radius:8px; padding:6px 11px;
          font-size:12px; font-weight:600; flex-shrink:0; }
      `}</style>

      <div className="sa-header">
        <button className="sa-icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
        <strong><ShieldCheck size={16} color="var(--primary)" />Platform Admin</strong>
      </div>

      <div className="sa-tabs">
        <button className={`sa-tab ${tab === "groups" ? "active" : ""}`} onClick={() => setTab("groups")}>
          <MessagesSquare size={14} />Groups
        </button>
        <button className={`sa-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          <Users size={14} />Users
        </button>
      </div>

      {tab === "groups" ? <GroupsTab /> : <UsersTab />}
    </div>
  );
}
