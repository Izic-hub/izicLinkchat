import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessagesSquare, ArrowRight, Link2, Users, AtSign, Phone, Megaphone,
  Image as ImageIcon, Shield, Lock, Check
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Create groups instantly", text: "No setup wizard. Name it, set who can join, done." },
  { icon: Link2, title: "Join with a link", text: "One URL gets anyone straight into the conversation." },
  { icon: AtSign, title: "Connect with usernames", text: "Find people already in your groups by @username." },
  { icon: Phone, title: "Phone-number discovery", text: "Optional, and always under the member's own control." },
  { icon: Megaphone, title: "Group announcements", text: "Host messages that stand out from regular chat." },
  { icon: ImageIcon, title: "Media sharing", text: "Photos, files, and voice notes, right in the thread." },
  { icon: Shield, title: "Admin controls", text: "Mute, remove, or promote — hosts stay in charge." },
  { icon: Lock, title: "Secure conversations", text: "Private groups stay invisible to anyone outside them." },
];

const STEPS = [
  { n: "01", title: "Create", text: "Name your group and set who can join — takes under a minute." },
  { n: "02", title: "Share", text: "Send your one invite link anywhere: WhatsApp, SMS, email." },
  { n: "03", title: "Connect", text: "Everyone who opens it lands straight in the conversation." },
];

export default function LandingPage() {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinValue, setJoinValue] = useState ("");
  const navigate = useNavigate();

  function handleJoinSubmit(e) {
    e.preventDefault();
    const raw = joinValue.trim();
    if (!raw) return;
    // Accept either a bare code ("ABX72K") or a full pasted link
    // (".../join/ABX72K") — pull just the code out either way.
    const code = raw.includes("/join/") ? raw.split("/join/").pop().split(/[?#]/)[0] : raw;
    navigate(`/join/${code}`);
  }

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .lp-root {
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; overflow:hidden; border:1px solid var(--border); }
        .lp-root * { box-sizing:border-box; }
        .lp-root button { font-family:inherit; cursor:pointer; }

        /* nav */
        .lp-nav { display:flex; align-items:center; justify-content:space-between; padding:18px 40px;
          border-bottom:1px solid var(--border); }
        .lp-brand { display:flex; align-items:center; gap:9px; font-family:'Space Grotesk'; font-weight:600;
          font-size:16px; color:var(--ink); }
        .lp-brand-icon { width:30px; height:30px; border-radius:9px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; }
        .lp-nav-actions { display:flex; align-items:center; gap:14px; }
        .lp-nav-signin { background:none; border:none; color:var(--muted); font-size:13.5px; font-weight:600; }
        .lp-nav-signin:hover { color:var(--ink); }
        .lp-nav-cta { background:var(--ink); color:var(--surface); border:none; border-radius:9px; padding:9px 18px;
          font-size:13.5px; font-weight:600; }

        @media (max-width: 640px) {
          .lp-nav { flex-direction:column; gap:12px; padding:16px 20px; align-items:stretch; }
          .lp-nav-actions { justify-content:center; }
          .lp-brand { justify-content:center; }
        }

        /* hero */
        .lp-hero { display:grid; grid-template-columns:1.05fr 0.95fr; gap:40px; padding:64px 40px 70px;
          align-items:center; }
        .lp-eyebrow { display:inline-flex; align-items:center; gap:7px; background:var(--primary-soft);
          color:var(--primary); font-size:12px; font-weight:600; padding:6px 12px; border-radius:20px; margin-bottom:20px; }
        h1.lp-headline { font-family:'Space Grotesk'; font-size:42px; line-height:1.12; margin:0 0 18px;
          letter-spacing:-0.5px; max-width:480px; }
        p.lp-subhead { font-size:16px; color:#565A78; line-height:1.55; max-width:420px; margin:0 0 30px; }
        .lp-hero-ctas { display:flex; gap:12px; margin-bottom:34px; }
        .lp-cta-primary { background:var(--primary); color:#fff; border:none; border-radius:11px;
          padding:13px 22px; font-size:14.5px; font-weight:600; display:flex; align-items:center; gap:8px; }
        .lp-cta-secondary { background:#fff; color:var(--ink); border:1px solid var(--border); border-radius:11px;
          padding:13px 22px; font-size:14.5px; font-weight:600; }
        .lp-join-inline { display:flex; gap:8px; margin:-12px 0 20px; max-width:420px; }
        .lp-join-inline input { flex:1; border:1px solid var(--border); background:var(--surface); border-radius:10px;
          padding:11px 13px; font-size:13.5px; color:var(--ink); outline:none; font-family:inherit; }
        .lp-join-inline input:focus { border-color:var(--primary); }
        .lp-join-inline button { background:var(--ink); color:#fff; border:none; border-radius:10px; padding:0 16px;
          font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .lp-join-inline button:disabled { background:#C7C9DA; cursor:not-allowed; }
        .lp-trust { display:flex; gap:22px; font-size:12.5px; color:var(--muted); }
        .lp-trust span { display:flex; align-items:center; gap:6px; }

        /* hero mockup */
        .lp-illustration { padding:10px; }
        .lp-illustration svg { width:100%; height:auto; display:block; }
        .lp-illus-float-slow, .lp-illus-float-fast, .lp-illus-float-med, .lp-illus-float-slow2, .lp-illus-float-fast2 {
          transform-origin:center; }
        .lp-illus-float-slow { animation:lp-float-a 4.5s ease-in-out infinite; }
        .lp-illus-float-fast { animation:lp-float-b 3.2s ease-in-out infinite; }
        .lp-illus-float-med { animation:lp-float-a 3.8s ease-in-out infinite; animation-delay:.3s; }
        .lp-illus-float-slow2 { animation:lp-float-b 4.2s ease-in-out infinite; animation-delay:.6s; }
        .lp-illus-float-fast2 { animation:lp-float-a 3s ease-in-out infinite; animation-delay:.9s; }
        @keyframes lp-float-a { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-8px); } }
        @keyframes lp-float-b { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(7px); } }

        /* features */
        .lp-section { padding:60px 40px; }
        .lp-section-head { max-width:520px; margin-bottom:38px; }
        h2.lp-h2 { font-family:'Space Grotesk'; font-size:26px; margin:0 0 8px; }
        p.lp-section-sub { color:#565A78; font-size:14.5px; margin:0; }
        .lp-features { display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; }
        .lp-feature-card { border:1px solid var(--border); border-radius:14px; padding:18px; background:var(--surface); }
        .lp-feature-icon { width:36px; height:36px; border-radius:10px; background:var(--primary-soft);
          color:var(--primary); display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .lp-feature-card strong { display:block; font-size:13.5px; margin-bottom:4px; }
        .lp-feature-card p { font-size:12.5px; color:var(--muted); margin:0; line-height:1.45; }

        /* steps */
        .lp-steps-wrap { background:var(--ink); border-radius:20px; padding:44px 40px; color:#fff; margin:0 40px; }
        .lp-steps-head { max-width:480px; margin-bottom:32px; }
        .lp-steps-head h2 { font-family:'Space Grotesk'; font-size:24px; margin:0 0 8px; }
        .lp-steps-head p { color:#A5A8C2; font-size:14px; margin:0; }
        .lp-steps { display:grid; grid-template-columns:repeat(3, 1fr); gap:24px; }
        .lp-step-num { font-family:'Space Grotesk'; font-size:13px; color:var(--accent); font-weight:600;
          margin-bottom:10px; }
        .lp-step strong { display:block; font-size:16px; margin-bottom:6px; }
        .lp-step p { font-size:13px; color:#A5A8C2; line-height:1.5; margin:0; }

        .lp-bottom-cta { text-align:center; padding:64px 40px 56px; }
        .lp-bottom-cta h2 { font-family:'Space Grotesk'; font-size:26px; margin:0 0 20px; }

        @media (max-width: 860px) {
          .lp-hero { grid-template-columns:1fr; padding:40px 22px; }
          .lp-features { grid-template-columns:1fr 1fr; }
          .lp-steps { grid-template-columns:1fr; }
          .lp-section { padding:44px 22px; }
          .lp-steps-wrap { margin:0 22px; padding:32px 24px; }
          h1.lp-headline { font-size:32px; }
        }
        @media (max-width: 560px) {
          .lp-nav { justify-content:center; padding:16px 18px; }
          .lp-nav-actions { display:none; }
        }
      `}</style>

      <nav className="lp-nav">
        <div className="lp-brand"><span className="lp-brand-icon"><MessagesSquare size={16} /></span>LINKCHAT</div>
        <div className="lp-nav-actions">
          <button className="lp-nav-signin" onClick={() => navigate("/login")}>Sign In</button>
          <button className="lp-nav-cta" onClick={() => navigate("/create")}>Create a Group</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div>
          <div className="lp-eyebrow"><Link2 size={13} />One link, one group</div>
          <h1 className="lp-headline">Your Group. Your People. One Conversation.</h1>
          <p className="lp-subhead">Create a group, share one link, and bring everyone into the conversation — no downloads, no invites one by one.</p>
          <div className="lp-hero-ctas">
            <button className="lp-cta-primary" onClick={() => navigate("/create")}>Create a Group <ArrowRight size={16} /></button>
            <button className="lp-cta-secondary" onClick={() => setShowJoinInput((v) => !v)}>Join a Group</button>
          </div>
          {showJoinInput && (
            <form className="lp-join-inline" onSubmit={handleJoinSubmit}>
              <input
                autoFocus
                placeholder="Paste an invite link or code…"
                value={joinValue}
                onChange={(e) => setJoinValue(e.target.value)}
              />
              <button type="submit" disabled={!joinValue.trim()}>Go <ArrowRight size={14} /></button>
            </form>
          )}
          <div className="lp-trust">
            <span><Check size={14} color="#16C7A6" />Free to create</span>
            <span><Check size={14} color="#16C7A6" />No app required</span>
            <span><Check size={14} color="#16C7A6" />Private by default</span>
          </div>
        </div>

        <div className="lp-illustration">
          <svg viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg">
            <path d="M55,195 C48,95 145,25 235,42 C328,60 385,135 368,228 C351,320 250,365 155,338 C62,312 62,290 55,195 Z" fill="var(--primary-soft)" />

            <g className="lp-illus-float-slow">
              <circle cx="118" cy="262" r="48" fill="var(--primary)" />
              <circle cx="118" cy="246" r="17" fill="var(--surface)" opacity="0.95" />
              <path d="M86,300 Q118,270 150,300 L150,318 L86,318 Z" fill="var(--surface)" opacity="0.95" />
            </g>

            <g className="lp-illus-float-fast">
              <circle cx="298" cy="118" r="38" fill="var(--accent)" />
              <circle cx="298" cy="105" r="13" fill="var(--surface)" opacity="0.95" />
              <path d="M270,143 Q298,120 326,143 L326,156 L270,156 Z" fill="var(--surface)" opacity="0.95" />
            </g>

            <g className="lp-illus-float-med">
              <rect x="150" y="188" width="98" height="46" rx="16" fill="var(--surface)" stroke="var(--border)" />
              <circle cx="172" cy="211" r="4.5" fill="var(--primary)" />
              <circle cx="194" cy="211" r="4.5" fill="var(--primary)" />
              <circle cx="216" cy="211" r="4.5" fill="var(--primary)" />
            </g>

            <g className="lp-illus-float-slow2">
              <rect x="208" y="88" width="104" height="42" rx="16" fill="var(--primary)" />
              <line x1="228" y1="109" x2="292" y2="109" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            </g>

            <g className="lp-illus-float-fast2">
              <circle cx="340" cy="224" r="19" fill="var(--surface)" stroke="var(--border)" />
              <path d="M340,232 C331,224 331,215 337,215 C339.5,215 340,217 340,217 C340,217 340.5,215 343,215 C349,215 349,224 340,232 Z" fill="#EF4444" />
            </g>
          </svg>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2 className="lp-h2">Everything a group needs, nothing it doesn't</h2>
          <p className="lp-section-sub">Built around one job — getting a group of people talking, fast.</p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon"><f.icon size={17} /></div>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-steps-wrap">
        <div className="lp-steps-head">
          <h2>From nothing to a full group chat, in three steps</h2>
          <p>No account required to preview a group — only to join or host one.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="lp-bottom-cta">
        <h2 className="lp-h2">Bring your people together today</h2>
        <button className="lp-cta-primary" style={{ margin: "0 auto" }} onClick={() => navigate("/signup")}>Create Account <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}
