import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, ArrowRight, MessagesSquare, Check, Lock, Loader2, AlertCircle } from "lucide-react";
import { getGroupByInviteCode, joinGroup } from "../lib/groups";
import { signOut } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";

export default function JoinGroupFlow() {
  const navigate = useNavigate();
  const { code } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState("preview"); // preview | joined
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    getGroupByInviteCode(code)
      .then((data) => setGroup(data))
      .catch(() => setLoadError("This invitation link may have expired or been disabled."))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleSwitchAccount() {
    setSwitching(true);
    await signOut();
    setSwitching(false);
    // user becomes null via AuthContext's listener — the "continue as" line
    // disappears and Join Group now falls through to the signup redirect.
  }

  // Real accounts, not per-join display names — a group_members row needs a
  // real profiles.id, so joining requires being signed in. If you want true
  // "type a name and go" anonymous joining later, that's Supabase anonymous
  // auth (a different sign-up path), not something this screen alone can do.
  async function handleJoinClick() {
    setJoinError("");
    setJoining(true);
    try {
      if (!user) {
        navigate(`/signup?redirect=/join/${code}`);
        return;
      }
      await joinGroup({ groupId: group.id, userId: user.id });
      setStep("joined");
    } catch (err) {
      // Unique constraint violation = already a member, which is fine — just continue.
      if (err.code === "23505") {
        setStep("joined");
      } else {
        setJoinError(err.message || "Couldn't join this group — try again.");
      }
    } finally {
      setJoining(false);
    }
  }

  const memberCount = group?.members?.[0]?.count ?? 0;

  return (
    <div className="jg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .jg-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0; --danger:#E5484D;
          font-family:'Inter',sans-serif; color:var(--ink); background:
            radial-gradient(circle at 20% 0%, #EEF0FD 0%, var(--bg) 55%);
          min-height:480px; display:flex; align-items:center; justify-content:center; padding:28px;
          border-radius:16px; }
        .jg-root * { box-sizing:border-box; }
        .jg-root button { font-family:inherit; cursor:pointer; }
        .jg-card { width:100%; max-width:420px; background:var(--surface); border:1px solid var(--border);
          border-radius:18px; padding:32px 30px 28px; text-align:center; }
        .jg-brand { display:flex; align-items:center; justify-content:center; gap:8px; color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:13px; margin-bottom:24px; }
        .jg-brand-icon { width:24px; height:24px; border-radius:7px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; }
        .jg-avatar { width:76px; height:76px; border-radius:20px; background:var(--primary); color:#fff;
          font-family:'Space Grotesk'; font-weight:700; font-size:22px; display:flex; align-items:center;
          justify-content:center; margin:0 auto 16px; }
        h2.jg-title { font-family:'Space Grotesk'; font-size:21px; margin:0 0 6px; }
        .jg-meta { display:flex; align-items:center; justify-content:center; gap:6px; color:var(--muted);
          font-size:12.5px; margin-bottom:14px; }
        .jg-desc { font-size:13.5px; color:#464A68; line-height:1.55; margin:0 0 18px; text-align:left;
          background:var(--bg); border-radius:12px; padding:13px 15px; }
        .jg-host { font-size:12.5px; color:var(--muted); margin-bottom:22px; }
        .jg-account-note { font-size:12px; color:var(--muted); margin-bottom:14px; }
        .jg-account-note button { color:var(--primary); font-weight:600; background:none; border:none; cursor:pointer; }
        .jg-join-btn { width:100%; background:var(--primary); color:#fff; border:none; border-radius:11px;
          padding:13px; font-size:14.5px; font-weight:600; display:flex; align-items:center; justify-content:center;
          gap:8px; }
        .jg-join-btn:disabled { background:#C7C9DA; cursor:not-allowed; }
        .jg-spin { animation:jg-rotate .8s linear infinite; }
        @keyframes jg-rotate { to { transform:rotate(360deg); } }
        .jg-error { display:flex; align-items:center; gap:7px; justify-content:center; font-size:12.5px;
          color:var(--danger); margin-top:10px; }
        .jg-joined-icon { width:56px; height:56px; border-radius:50%; background:var(--accent); color:#fff;
          display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .jg-joined-sub { color:var(--muted); font-size:13.5px; margin-bottom:22px; }
        .jg-enter-btn { width:100%; background:var(--ink); color:#fff; border:none; border-radius:11px;
          padding:13px; font-size:14.5px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; }
      `}</style>

      <div className="jg-card">
        <div className="jg-brand"><span className="jg-brand-icon"><MessagesSquare size={13} /></span>LINKCHAT</div>

        {loading && (
          <div style={{ padding: "30px 0" }}><Loader2 size={22} className="jg-spin" /></div>
        )}

        {!loading && loadError && (
          <>
            <div className="jg-avatar"><Lock size={26} /></div>
            <h2 className="jg-title">Invalid invite link</h2>
            <p className="jg-joined-sub">{loadError}</p>
            <button className="jg-join-btn" onClick={() => navigate("/")}>Back to Home</button>
          </>
        )}

        {!loading && !loadError && group && step === "preview" && (
          <>
            <div className="jg-avatar">{group.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
            <h2 className="jg-title">{group.name}</h2>
            <div className="jg-meta"><Users size={13} />{memberCount} members · {group.privacy === "public" ? "Public group" : "Private group"}</div>
            <p className="jg-desc">{group.description || "No description yet."}</p>
            {!authLoading && user && (
              <div className="jg-account-note">
                Continuing as {user.email}. <button onClick={handleSwitchAccount} disabled={switching}>{switching ? "…" : "Not you?"}</button>
              </div>
            )}
            <button className="jg-join-btn" disabled={joining || authLoading} onClick={handleJoinClick}>
              {joining || authLoading ? <Loader2 size={16} className="jg-spin" /> : <>Join Group <ArrowRight size={16} /></>}
            </button>
            {joinError && <div className="jg-error"><AlertCircle size={13} />{joinError}</div>}
          </>
        )}

        {step === "joined" && group && (
          <>
            <div className="jg-joined-icon"><Check size={24} /></div>
            <h2 className="jg-title">You're in!</h2>
            <p className="jg-joined-sub">Welcome to {group.name}.</p>
            <button className="jg-enter-btn" onClick={() => navigate(`/groups/${group.id}`)}>Enter Group Chat <ArrowRight size={16} /></button>
          </>
        )}
      </div>
    </div>
  );
}
