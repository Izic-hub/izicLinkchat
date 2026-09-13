import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Settings, Users, MessageSquare, Link2, ChevronLeft, Image as ImageIcon,
  Globe, Lock, Copy, RefreshCw, XCircle, QrCode, Check, Loader2,
  Crown, Shield, UserMinus, Ban, AlertTriangle, UserPlus
} from "lucide-react";
import { getGroupDetails, updateGroupSettings, regenerateInviteCode, inviteUserToGroup } from "../lib/groups";
import { getMembers, setMemberRole, setMemberStatus, removeMember } from "../lib/members";
import { uploadImage } from "../lib/storage";
import { useAuth } from "../lib/AuthContext";

const TABS = [
  { id: "settings", label: "Group Settings", icon: Settings },
  { id: "members", label: "Member Management", icon: Users },
  { id: "chat", label: "Chat Controls", icon: MessageSquare },
  { id: "invite", label: "Invite Management", icon: Link2 },
];

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button className={`ad-toggle ${on ? "on" : ""}`} disabled={disabled} onClick={() => onChange(!on)}>
      <span className="ad-toggle-knob" />
    </button>
  );
}

function SettingsTab({ groupId, group, onSaved }) {
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description || "");
  const [privacy, setPrivacy] = useState(group.privacy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateGroupSettings(groupId, { name: name.trim(), description: desc.trim() || null, privacy });
      onSaved({ ...group, name: name.trim(), description: desc.trim(), privacy });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage("group-images", file);
      await updateGroupSettings(groupId, { image_url: url });
      onSaved({ ...group, image_url: url });
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="ad-panel">
      <div className="ad-field">
        <span className="ad-label">Group image</span>
        <div className="ad-upload">
          <div className="ad-avatar-lg">
            {group.image_url ? <img src={group.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(group.name)}
          </div>
          <label className="ad-btn-ghost" style={{ cursor: "pointer" }}>
            {uploadingPhoto ? <Loader2 size={14} className="ad-spin" /> : "Change photo"}
            <input type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: "none" }} />
          </label>
        </div>
      </div>
      <div className="ad-field">
        <span className="ad-label">Group name</span>
        <input className="ad-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="ad-field">
        <span className="ad-label">Description</span>
        <textarea className="ad-textarea" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="ad-field">
        <span className="ad-label">Privacy</span>
        <div className="ad-privacy">
          <button className={`ad-priv-opt ${privacy === "public" ? "active" : ""}`} onClick={() => setPrivacy("public")}>
            <Globe size={14} />Public
          </button>
          <button className={`ad-priv-opt ${privacy === "private" ? "active" : ""}`} onClick={() => setPrivacy("private")}>
            <Lock size={14} />Private
          </button>
        </div>
      </div>
      <button className="ad-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="ad-spin" /> : saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === "host") return <span className="ad-badge host"><Crown size={10} />Host</span>;
  if (role === "admin") return <span className="ad-badge admin"><Shield size={10} />Admin</span>;
  return null;
}

function MembersTab({ groupId, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    getMembers(groupId).then(setMembers).finally(() => setLoading(false));
  }, [groupId]);

  async function handleInvite() {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    setInviteMsg("");
    try {
      await inviteUserToGroup({ groupId, inviterId: currentUserId, username: inviteUsername.trim() });
      setInviteMsg(`Invite sent to @${inviteUsername.trim().replace(/^@/, "")}.`);
      setInviteUsername("");
    } catch (err) {
      setInviteMsg(err.message || "Couldn't send that invite.");
    } finally {
      setInviting(false);
      setTimeout(() => setInviteMsg(""), 3000);
    }
  }

  async function promote(m) {
    const newRole = m.role === "admin" ? "member" : "admin";
    await setMemberRole(m.id, newRole);
    setMembers((prev) => prev.map((row) => (row.id === m.id ? { ...row, role: newRole } : row)));
  }
  async function remove(m) {
    await removeMember(m.id);
    setMembers((prev) => prev.filter((row) => row.id !== m.id));
  }
  async function ban(m) {
    await setMemberStatus(m.id, "banned");
    setMembers((prev) => prev.filter((row) => row.id !== m.id));
  }

  if (loading) return <div className="ad-panel"><Loader2 size={18} className="ad-spin" /></div>;

  return (
    <div className="ad-panel">
      <div className="ad-field">
        <span className="ad-label">Invite someone by username</span>
        <div className="ad-invite-row">
          <input
            className="ad-input"
            placeholder="@username"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <button className="ad-btn-primary" style={{ minWidth: 90 }} onClick={handleInvite} disabled={inviting || !inviteUsername.trim()}>
            {inviting ? <Loader2 size={14} className="ad-spin" /> : <><UserPlus size={14} />Invite</>}
          </button>
        </div>
        {inviteMsg && <div className="ad-invite-msg">{inviteMsg}</div>}
      </div>
      <div className="ad-label" style={{ marginBottom: 10 }}>{members.length} members</div>
      {members.map((m) => {
        const name = m.profile.display_name || m.profile.username;
        return (
          <div className="ad-member-row" key={m.id}>
            <div className="ad-avatar-sm">{initialsOf(name)}</div>
            <div className="ad-member-text">
              <div className="row"><strong>{name}</strong><RoleBadge role={m.role} /></div>
              <span className="ad-muted">@{m.profile.username}</span>
            </div>
            {m.role !== "host" && m.profile.id !== currentUserId && (
              <div className="ad-member-actions">
                <button className="ad-icon-btn" title={m.role === "admin" ? "Remove admin" : "Promote to admin"} onClick={() => promote(m)}><Shield size={14} /></button>
                <button className="ad-icon-btn danger" title="Remove" onClick={() => remove(m)}><UserMinus size={14} /></button>
                <button className="ad-icon-btn danger" title="Ban" onClick={() => ban(m)}><Ban size={14} /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChatControlsTab({ groupId, group, onSaved }) {
  async function update(field, value) {
    await updateGroupSettings(groupId, { [field]: value });
    onSaved({ ...group, [field]: value });
  }

  return (
    <div className="ad-panel">
      <div className="ad-control-row">
        <div><strong>Media sharing</strong><p>Allow members to post photos and videos.</p></div>
        <Toggle on={group.media_enabled} onChange={(v) => update("media_enabled", v)} />
      </div>
      <div className="ad-control-row">
        <div><strong>File sharing</strong><p>Allow members to attach documents.</p></div>
        <Toggle on={group.files_enabled} onChange={(v) => update("files_enabled", v)} />
      </div>
      <div className="ad-control-row">
        <div><strong>Slow mode</strong><p>Limit members to one message every 30 seconds.</p></div>
        <Toggle on={group.slow_mode_seconds > 0} onChange={(v) => update("slow_mode_seconds", v ? 30 : 0)} />
      </div>
      <div className="ad-control-row">
        <div><strong>Announcement mode</strong><p>Only host and admins can post messages.</p></div>
        <Toggle on={group.announcement_mode} onChange={(v) => update("announcement_mode", v)} />
      </div>
    </div>
  );
}

function InviteTab({ groupId, group, onSaved }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const inviteLink = `${window.location.host}/join/${group.invite_code}`;

  async function regenerate() {
    setRegenerating(true);
    try {
      const code = await regenerateInviteCode(groupId);
      onSaved({ ...group, invite_code: code });
    } finally {
      setRegenerating(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function toggleEnabled(v) {
    await updateGroupSettings(groupId, { invite_enabled: v });
    onSaved({ ...group, invite_enabled: v });
  }

  return (
    <div className="ad-panel">
      <div className="ad-field">
        <span className="ad-label">Invite link</span>
        <div className="ad-link-row">
          <code>{inviteLink}</code>
          <button className="ad-copy" onClick={copyLink}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="ad-invite-actions">
        <button className="ad-btn-ghost" onClick={regenerate} disabled={regenerating}>
          {regenerating ? <Loader2 size={14} className="ad-spin" /> : <><RefreshCw size={14} />Regenerate link</>}
        </button>
        <button className="ad-btn-ghost"><QrCode size={14} />Show QR code</button>
      </div>
      <div className="ad-control-row" style={{ marginTop: 6 }}>
        <div><strong>Invite link active</strong><p>Turn off to stop new people from joining via this link.</p></div>
        <Toggle on={group.invite_enabled} onChange={toggleEnabled} />
      </div>
      {!group.invite_enabled && (
        <div className="ad-disabled-note"><XCircle size={14} />This link is currently disabled — no one can join with it.</div>
      )}
    </div>
  );
}

export default function GroupAdminDashboard() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user: authUser } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth

  const [tab, setTab] = useState("settings");
  const [group, setGroup] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    async function load() {
      setCurrentUserId(authUser.id);
      const [groupData, members] = await Promise.all([
        getGroupDetails(groupId),
        getMembers(groupId),
      ]);
      const myRole = members.find((m) => m.profile.id === authUser.id)?.role;
      if (myRole !== "host" && myRole !== "admin") {
        setForbidden(true);
      } else {
        setGroup(groupData);
      }
      setLoading(false);
    }
    load();
  }, [groupId, authUser]);

  if (loading) {
    return <div className="ad-root ad-status"><Loader2 size={22} className="ad-spin" /></div>;
  }

  if (forbidden) {
    return (
      <div className="ad-root ad-status" style={{ flexDirection: "column", gap: 10, padding: 30 }}>
        <AlertTriangle size={22} color="#E5484D" />
        <strong>You don't have permission to manage this group.</strong>
        <button className="ad-btn-ghost" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="ad-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ad-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0; --danger:#E5484D;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; display:flex;
          max-width:680px; min-height:560px; }
        .ad-root * { box-sizing:border-box; }
        .ad-root button { font-family:inherit; cursor:pointer; }
        .ad-root input, .ad-root textarea { font-family:inherit; outline:none; }
        .ad-status { align-items:center; justify-content:center; text-align:center; }
        .muted, .ad-muted { color:var(--muted); font-size:12px; }
        .row { display:flex; align-items:center; gap:7px; }
        .ad-spin { animation:ad-rotate .8s linear infinite; }
        @keyframes ad-rotate { to { transform:rotate(360deg); } }

        .ad-nav { width:190px; background:var(--bg); border-right:1px solid var(--border); padding:16px 10px; flex-shrink:0; }
        .ad-nav-head { display:flex; align-items:center; gap:8px; padding:6px 8px 16px; font-family:'Space Grotesk';
          font-weight:600; font-size:14px; }
        .ad-nav-item { width:100%; display:flex; align-items:center; gap:10px; padding:10px 10px; border-radius:10px;
          font-size:13px; font-weight:500; color:#565A78; background:none; border:none; text-align:left; margin-bottom:2px; }
        .ad-nav-item:hover { background:#fff; }
        .ad-nav-item.active { background:var(--primary); color:#fff; }

        .ad-main { flex:1; padding:24px 26px; overflow-y:auto; }
        .ad-main-head { font-family:'Space Grotesk'; font-size:17px; font-weight:600; margin-bottom:18px; }

        .ad-panel { display:flex; flex-direction:column; gap:16px; }
        .ad-field { display:flex; flex-direction:column; gap:8px; }
        .ad-label { font-size:12px; font-weight:600; color:#464A68; }
        .ad-input, .ad-textarea { border:1px solid var(--border); background:var(--bg); border-radius:10px;
          padding:10px 12px; font-size:13.5px; color:var(--ink); }
        .ad-textarea { resize:vertical; min-height:64px; }
        .ad-upload { display:flex; align-items:center; gap:12px; }
        .ad-avatar-lg { width:52px; height:52px; border-radius:14px; background:var(--primary); color:#fff;
          font-family:'Space Grotesk'; font-weight:600; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .ad-btn-ghost { border:1px solid var(--border); background:#fff; border-radius:9px; padding:8px 13px;
          font-size:12.5px; font-weight:600; display:inline-flex; align-items:center; gap:7px; }
        .ad-btn-ghost:hover { background:var(--bg); }
        .ad-btn-primary { align-self:flex-start; background:var(--primary); color:#fff; border:none; border-radius:10px;
          padding:10px 18px; font-size:13.5px; font-weight:600; min-width:130px; display:flex; align-items:center; justify-content:center; }
        .ad-privacy { display:flex; gap:8px; }
        .ad-priv-opt { flex:1; display:flex; align-items:center; justify-content:center; gap:7px; border:1.5px solid var(--border);
          border-radius:10px; padding:10px; font-size:13px; font-weight:600; background:#fff; color:var(--muted); }
        .ad-priv-opt.active { border-color:var(--primary); background:var(--primary-soft); color:var(--primary); }

        .ad-member-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border); }
        .ad-member-row:last-child { border-bottom:none; }
        .ad-avatar-sm { width:36px; height:36px; border-radius:10px; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:12.5px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ad-member-text { flex:1; min-width:0; }
        .ad-member-text strong { font-size:13.5px; }
        .ad-badge { display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:600; padding:2px 6px; border-radius:6px; }
        .ad-badge.host { background:#FFF1D6; color:#946200; }
        .ad-badge.admin { background:var(--primary-soft); color:var(--primary); }
        .ad-member-actions { display:flex; gap:4px; }
        .ad-icon-btn { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); border:none; background:none; }
        .ad-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .ad-icon-btn.danger:hover { background:#FDEAEA; color:var(--danger); }

        .ad-control-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 0;
          border-bottom:1px solid var(--border); }
        .ad-control-row:last-child { border-bottom:none; }
        .ad-control-row strong { font-size:13.5px; display:block; margin-bottom:2px; }
        .ad-control-row p { font-size:12px; color:var(--muted); margin:0; line-height:1.4; }
        .ad-toggle { width:40px; height:23px; border-radius:12px; background:#D5D7E5; border:none; position:relative;
          flex-shrink:0; transition:background .15s; }
        .ad-toggle.on { background:var(--accent); }
        .ad-toggle-knob { position:absolute; top:2.5px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff;
          transition:transform .15s; box-shadow:0 1px 2px rgba(0,0,0,.2); }
        .ad-toggle.on .ad-toggle-knob { transform:translateX(16px); }

        .ad-invite-row { display:flex; gap:8px; }
        .ad-invite-row .ad-input { flex:1; }
        .ad-invite-msg { font-size:11.5px; color:var(--muted); margin-top:6px; }
        .ad-link-row { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px dashed #C7C9DA;
          border-radius:10px; padding:10px 12px; }
        .ad-link-row code { flex:1; font-size:12px; word-break:break-all; }
        .ad-copy { color:var(--primary); background:none; border:none; flex-shrink:0; }
        .ad-invite-actions { display:flex; gap:8px; }
        .ad-disabled-note { display:flex; align-items:center; gap:7px; background:#FDEAEA; color:var(--danger);
          font-size:12px; padding:9px 12px; border-radius:9px; }
      `}</style>

      <div className="ad-nav">
        <div className="ad-nav-head">
          <button className="ad-icon-btn" onClick={() => navigate(-1)} style={{ marginRight: 2 }}><ChevronLeft size={16} /></button>
          <Settings size={16} color="var(--primary)" />Admin
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={`ad-nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      <div className="ad-main">
        <div className="ad-main-head">{TABS.find((t) => t.id === tab).label}</div>
        {tab === "settings" && <SettingsTab groupId={groupId} group={group} onSaved={setGroup} />}
        {tab === "members" && <MembersTab groupId={groupId} currentUserId={currentUserId} />}
        {tab === "chat" && <ChatControlsTab groupId={groupId} group={group} onSaved={setGroup} />}
        {tab === "invite" && <InviteTab groupId={groupId} group={group} onSaved={setGroup} />}
      </div>
    </div>
  );
}
