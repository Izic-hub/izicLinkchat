import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getPublicProfile } from "../lib/profiles";

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/** Usage: <MemberProfileModal userId={someId} onClose={() => setViewingId(null)} />
 *  Renders nothing if userId is null/undefined — safe to always mount. */
export default function MemberProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getPublicProfile(userId).then(setProfile).finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="mpm-backdrop" onClick={onClose}>
      <style>{`
        .mpm-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center;
          justify-content:center; z-index:100; padding:20px; }
        .mpm-card { background:var(--surface); border-radius:18px; padding:26px; width:100%; max-width:340px;
          text-align:center; position:relative; font-family:'Inter',sans-serif; color:var(--ink); }
        .mpm-close { position:absolute; top:12px; right:12px; width:30px; height:30px; border-radius:9px;
          display:flex; align-items:center; justify-content:center; color:var(--muted); background:none; border:none; }
        .mpm-close:hover { background:var(--bg); }
        .mpm-avatar { width:76px; height:76px; border-radius:20px; background:var(--primary); color:#fff;
          font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:22px; display:flex; align-items:center;
          justify-content:center; margin:8px auto 14px; overflow:hidden; }
        .mpm-name { font-family:'Space Grotesk',sans-serif; font-size:17px; font-weight:600; }
        .mpm-username { color:var(--muted); font-size:13px; margin:2px 0 14px; }
        .mpm-bio { font-size:13px; color:var(--ink); line-height:1.5; background:var(--bg); border-radius:10px; padding:12px; }
        .mpm-spin { animation:mpm-rotate .8s linear infinite; }
        @keyframes mpm-rotate { to { transform:rotate(360deg); } }
      `}</style>
      <div className="mpm-card" onClick={(e) => e.stopPropagation()}>
        <button className="mpm-close" onClick={onClose}><X size={16} /></button>
        {loading || !profile ? (
          <div style={{ padding: "30px 0" }}><Loader2 size={22} className="mpm-spin" /></div>
        ) : (
          <>
            <div className="mpm-avatar">
              {profile.profile_image_url
                ? <img src={profile.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initialsOf(profile.display_name || profile.username)}
            </div>
            <div className="mpm-name">{profile.display_name || profile.username}</div>
            <div className="mpm-username">@{profile.username}</div>
            <div className="mpm-bio">{profile.bio || "No bio yet."}</div>
          </>
        )}
      </div>
    </div>
  );
}
