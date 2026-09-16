import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Camera, Users, PlusCircle, Eye, EyeOff, Phone, AtSign,
  Circle, Pencil, Check, Loader2, LogOut, ShieldCheck
} from "lucide-react";
import { getProfile, updateProfile } from "../lib/profiles";
import { getMyGroups } from "../lib/groups";
import { signOut } from "../lib/auth";
import { uploadImage } from "../lib/storage";
import { useAuth } from "../lib/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const VIS_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "groups", label: "My groups only" },
  { value: "nobody", label: "No one" },
];

function PrivacyRow({ icon: Icon, title, sub, value, onChange }) {
  return (
    <div className="pf-priv-row">
      <div className="pf-priv-icon"><Icon size={15} /></div>
      <div className="pf-priv-text">
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
      <select className="pf-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {VIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Schema stores each privacy setting as a boolean (visible/not) rather than
// three tiers — collapse the UI's "groups only" option down to boolean here.
function boolToVis(b) { return b ? "everyone" : "nobody"; }
function visToBool(v) { return v !== "nobody"; }

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: authUser, isPlatformAdmin } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [groupsJoined, setGroupsJoined] = useState([]);

  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [phoneVis, setPhoneVis] = useState("nobody");
  const [usernameVis, setUsernameVis] = useState("everyone");
  const [findByPhone, setFindByPhone] = useState("nobody");
  const [onlineVis, setOnlineVis] = useState("everyone");

  const [tab, setTab] = useState("joined");
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadImage("avatars", file);
      await updateProfile(userId, { profile_image_url: url });
      setProfile((prev) => ({ ...prev, profile_image_url: url }));
    } finally {
      setAvatarUploading(false);
    }
  }

  useEffect(() => {
    if (!authUser) return;
    async function load() {
      setUserId(authUser.id);
      const [profileData, groups] = await Promise.all([
        getProfile(authUser.id),
        getMyGroups(authUser.id),
      ]);
      setProfile(profileData);
      setBio(profileData.bio || "");
      setPhoneVis(boolToVis(profileData.phone_visible));
      setUsernameVis(boolToVis(profileData.username_visible));
      setFindByPhone(boolToVis(profileData.phone_discoverable));
      setOnlineVis(boolToVis(profileData.show_online_status));
      setGroupsJoined(groups);
      setLoading(false);
    }
    load();
  }, [authUser]);

  async function saveBio() {
    setSavingBio(true);
    try {
      await updateProfile(userId, { bio: bio.trim() });
      setEditingBio(false);
    } finally {
      setSavingBio(false);
    }
  }

  async function savePrivacy(field, value) {
    await updateProfile(userId, { [field]: visToBool(value) });
  }

  if (loading || !profile) {
    return (
      <div className="pf-root pf-loading">
        <style>{`.pf-root{--ink:#14142B;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;min-height:300px;} .pf-spin{animation:pf-rotate .8s linear infinite;} @keyframes pf-rotate{to{transform:rotate(360deg);}}`}</style>
        <Loader2 size={24} className="pf-spin" color="#4338CA" />
      </div>
    );
  }

  const displayName = profile.display_name || profile.username;
  const createdCount = groupsJoined.filter((g) => g.myRole === "host").length;

  return (
    <div className="pf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .pf-root { font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; max-width:460px; }
        .pf-root * { box-sizing:border-box; }
        .pf-root button { font-family:inherit; cursor:pointer; }
        .pf-root input, .pf-root textarea, .pf-root select { font-family:inherit; outline:none; }
        .pf-spin { animation:pf-rotate .8s linear infinite; }
        @keyframes pf-rotate { to { transform:rotate(360deg); } }

        .pf-header { display:flex; align-items:center; gap:10px; padding:16px 18px; border-bottom:1px solid var(--border); }
        .pf-icon-btn { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); border:none; background:none; }
        .pf-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .pf-header strong { font-family:'Space Grotesk'; font-size:15.5px; }

        .pf-hero { display:flex; flex-direction:column; align-items:center; padding:26px 20px 20px; background:
          linear-gradient(180deg, var(--primary-soft), transparent); }
        .pf-avatar-wrap { position:relative; margin-bottom:12px; }
        .pf-avatar { width:84px; height:84px; border-radius:22px; background:var(--primary); color:#fff;
          font-family:'Space Grotesk'; font-weight:700; font-size:26px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .pf-avatar-edit { position:absolute; bottom:-4px; right:-4px; width:28px; height:28px; border-radius:50%;
          background:var(--ink); color:#fff; display:flex; align-items:center; justify-content:center; border:3px solid #fff; cursor:pointer; }
        .pf-hero strong { font-family:'Space Grotesk'; font-size:18px; }
        .pf-hero .pf-username { color:var(--muted); font-size:13px; margin-bottom:12px; }

        .pf-bio-wrap { width:100%; max-width:340px; text-align:center; }
        .pf-bio-text { font-size:13.5px; color:#464A68; line-height:1.5; }
        .pf-bio-edit-row { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:6px; }
        .pf-bio-edit-row button { font-size:11.5px; color:var(--primary); font-weight:600; display:flex; align-items:center; gap:4px;
          background:none; border:none; }
        .pf-bio-textarea { width:100%; border:1px solid var(--border); background:var(--bg); border-radius:10px;
          padding:9px 11px; font-size:13px; resize:vertical; min-height:56px; }

        .pf-stats { display:flex; gap:0; margin-top:18px; }
        .pf-stat { flex:1; text-align:center; padding:0 14px; }
        .pf-stat strong { display:block; font-family:'Space Grotesk'; font-size:17px; }
        .pf-stat span { font-size:11.5px; color:var(--muted); }
        .pf-stat-divider { width:1px; background:var(--border); }

        .pf-tabs { display:flex; border-bottom:1px solid var(--border); padding:0 18px; }
        .pf-tab { flex:1; padding:12px 0; text-align:center; font-size:13px; font-weight:600; color:var(--muted);
          background:none; border:none; border-bottom:2px solid transparent; }
        .pf-tab.active { color:var(--primary); border-color:var(--primary); }

        .pf-groups-list { padding:12px 18px; display:flex; flex-direction:column; gap:8px; }
        .pf-group-row { display:flex; align-items:center; gap:10px; }
        .pf-group-avatar { width:38px; height:38px; border-radius:11px; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:12.5px; display:flex; align-items:center; justify-content:center; }
        .pf-group-row strong { font-size:13.5px; display:block; }
        .pf-group-row span { font-size:11.5px; color:var(--muted); }
        .pf-empty { text-align:center; padding:30px 20px; color:var(--muted); font-size:13px; }

        .pf-privacy { padding:16px 18px 20px; border-top:1px solid var(--border); }
        .pf-privacy-head { font-family:'Space Grotesk'; font-weight:600; font-size:13.5px; margin-bottom:12px; }
        .pf-priv-row { display:flex; align-items:center; gap:10px; padding:9px 0; }
        .pf-priv-icon { width:30px; height:30px; border-radius:9px; background:var(--bg); color:var(--muted);
          display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pf-priv-text { flex:1; min-width:0; }
        .pf-priv-text strong { font-size:12.5px; display:block; }
        .pf-priv-text span { font-size:11px; color:var(--muted); }
        .pf-select { border:1px solid var(--border); background:var(--bg); border-radius:8px; padding:5px 8px; font-size:11.5px; }
        .pf-logout-wrap { padding:4px 18px 20px; display:flex; flex-direction:column; gap:8px; }
        .pf-superadmin-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:7px;
          border:1px solid var(--primary); background:var(--primary-soft); color:var(--primary); border-radius:10px;
          padding:10px; font-size:13px; font-weight:600; }
        .pf-logout-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:7px;
          border:1px solid var(--border); background:#fff; color:#E5484D; border-radius:10px; padding:10px;
          font-size:13px; font-weight:600; }
        .pf-logout-btn:hover { background:#FDEAEA; }
      `}</style>

      <div className="pf-header">
        <button className="pf-icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
        <strong>Profile</strong>
      </div>

      <div className="pf-hero">
        <div className="pf-avatar-wrap">
          <div className="pf-avatar">
            {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(displayName)}
          </div>
          <label className="pf-avatar-edit">
            {avatarUploading ? <Loader2 size={13} className="pf-spin" /> : <Camera size={13} />}
            <input type="file" accept="image/*" onChange={handleAvatarPick} style={{ display: "none" }} />
          </label>
        </div>
        <strong>{displayName}</strong>
        <span className="pf-username">@{profile.username}</span>

        <div className="pf-bio-wrap">
          {!editingBio ? (
            <>
              <p className="pf-bio-text">{bio || "No bio yet."}</p>
              <div className="pf-bio-edit-row">
                <button onClick={() => setEditingBio(true)}><Pencil size={11} />Edit bio</button>
              </div>
            </>
          ) : (
            <>
              <textarea className="pf-bio-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
              <div className="pf-bio-edit-row">
                <button onClick={saveBio} disabled={savingBio}>
                  {savingBio ? <Loader2 size={11} className="pf-spin" /> : <><Check size={11} />Save</>}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="pf-stats">
          <div className="pf-stat"><strong>{groupsJoined.length}</strong><span>Groups joined</span></div>
          <div className="pf-stat-divider" />
          <div className="pf-stat"><strong>{createdCount}</strong><span>Groups created</span></div>
        </div>
      </div>

      <div className="pf-tabs">
        <button className={`pf-tab ${tab === "joined" ? "active" : ""}`} onClick={() => setTab("joined")}>Joined</button>
        <button className={`pf-tab ${tab === "created" ? "active" : ""}`} onClick={() => setTab("created")}>Created</button>
      </div>

      <div className="pf-groups-list">
        {(() => {
          const list = tab === "joined" ? groupsJoined : groupsJoined.filter((g) => g.myRole === "host");
          if (list.length === 0) return <div className="pf-empty">No groups here yet.</div>;
          return list.map((g) => (
            <div className="pf-group-row" key={g.id} onClick={() => navigate(`/groups/${g.id}`)} style={{ cursor: "pointer" }}>
              <div className="pf-group-avatar">{initialsOf(g.name)}</div>
              <div>
                <strong>{g.name}</strong>
                <span>{g.privacy === "public" ? "Public" : "Private"}</span>
              </div>
            </div>
          ));
        })()}
      </div>

      <div className="pf-privacy" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="pf-privacy-head">Appearance</div>
        <ThemeSwitcher />
      </div>

      <div className="pf-privacy">
        <div className="pf-privacy-head">Privacy</div>
        <PrivacyRow icon={Phone} title="Who can find me by phone" sub="Controls phone-number discovery" value={findByPhone} onChange={(v) => { setFindByPhone(v); savePrivacy("phone_discoverable", v); }} />
        <PrivacyRow icon={Eye} title="Who can see my phone number" sub="Shown on your profile" value={phoneVis} onChange={(v) => { setPhoneVis(v); savePrivacy("phone_visible", v); }} />
        <PrivacyRow icon={AtSign} title="Who can see my username" sub="Used to find you in groups" value={usernameVis} onChange={(v) => { setUsernameVis(v); savePrivacy("username_visible", v); }} />
        <PrivacyRow icon={Circle} title="Online status visibility" sub="Shows the green dot next to your name" value={onlineVis} onChange={(v) => { setOnlineVis(v); savePrivacy("show_online_status", v); }} />
      </div>

      <div className="pf-logout-wrap">
        {isPlatformAdmin && (
          <button className="pf-superadmin-btn" onClick={() => navigate("/superadmin")}>
            <ShieldCheck size={14} />Platform Admin
          </button>
        )}
        <button className="pf-logout-btn" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut size={14} />Log out
        </button>
      </div>
    </div>
  );
}
