import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Lock, Globe, Image as ImageIcon, Check, Copy, Share2,
  QrCode, ArrowRight, ChevronLeft, MessagesSquare, Loader2, AlertCircle
} from "lucide-react";
import { createGroup } from "../lib/groups";
import { useAuth } from "../lib/AuthContext";

const CATEGORIES = ["Study & Learning", "Work & Career", "Community", "Sports & Fitness", "Hobby & Interest", "Family & Friends"];

// Minimal deterministic QR-style placeholder grid (visual only — swap for a real
// QR lib like `qrcode` when wiring the invite link to a live URL).
function QrGrid({ seed }) {
  const cells = [];
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 997;
  for (let i = 0; i < 49; i++) {
    n = (n * 1103515245 + 12345) % 2147483648;
    cells.push(n % 5 === 0);
  }
  return (
    <svg viewBox="0 0 70 70" className="cg-qr">
      <rect width="70" height="70" fill="#fff" rx="6" />
      {cells.map((on, i) => on && (
        <rect key={i} x={4 + (i % 7) * 9} y={4 + Math.floor(i / 7) * 9} width="7" height="7" rx="1.5" fill="#14142B" />
      ))}
      <rect x="2" y="2" width="16" height="16" fill="none" stroke="#14142B" strokeWidth="2.5" rx="3" />
      <rect x="52" y="2" width="16" height="16" fill="none" stroke="#14142B" strokeWidth="2.5" rx="3" />
      <rect x="2" y="52" width="16" height="16" fill="none" stroke="#14142B" strokeWidth="2.5" rx="3" />
    </svg>
  );
}

export default function CreateGroupFlow() {
  const navigate = useNavigate();
  const { user } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth
  const [step, setStep] = useState("form"); // form | success
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [privacy, setPrivacy] = useState("public");
  const [copied, setCopied] = useState(false);
  const [group, setGroup] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const canCreate = name.trim().length >= 3;

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleCreate() {
    if (!canCreate) return;
    setFormError("");
    setCreating(true);
    try {
      const created = await createGroup({
        name: name.trim(),
        description: desc.trim() || null,
        category,
        privacy,
        imageFile,
        userId: user.id,
      });
      setGroup(created);
      setStep("success");
    } catch (err) {
      setFormError(err.message || "Couldn't create the group — try again.");
    } finally {
      setCreating(false);
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/join/${group.invite_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="cg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .cg-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg);
          min-height:640px; display:flex; align-items:center; justify-content:center; padding:28px;
          border-radius:16px; }
        .cg-root * { box-sizing:border-box; }
        .cg-root button { font-family:inherit; cursor:pointer; }
        .cg-card { width:100%; max-width:460px; background:var(--surface); border:1px solid var(--border);
          border-radius:18px; padding:30px 30px 26px; }
        .cg-brand { display:flex; align-items:center; gap:8px; color:var(--primary); font-family:'Space Grotesk';
          font-weight:600; font-size:14px; margin-bottom:20px; }
        .cg-brand-icon { width:26px; height:26px; border-radius:8px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; }
        h2.cg-title { font-family:'Space Grotesk'; font-size:22px; margin:0 0 4px; }
        p.cg-sub { color:var(--muted); font-size:13.5px; margin:0 0 24px; }
        .cg-field { margin-bottom:16px; }
        .cg-label { display:block; font-size:12.5px; font-weight:600; color:#464A68; margin-bottom:7px; }
        .cg-input, .cg-textarea, .cg-select { width:100%; border:1px solid var(--border); background:var(--bg);
          border-radius:10px; padding:11px 13px; font-size:14px; font-family:inherit; color:var(--ink); outline:none; }
        .cg-input:focus, .cg-textarea:focus, .cg-select:focus { border-color:var(--primary); background:#fff; }
        .cg-textarea { resize:vertical; min-height:70px; }
        .cg-upload { display:flex; align-items:center; gap:12px; }
        .cg-upload-box { width:56px; height:56px; border-radius:14px; border:1.5px dashed #C7C9DA; background:var(--bg);
          display:flex; align-items:center; justify-content:center; color:var(--muted); flex-shrink:0; cursor:pointer; }
        .cg-upload-text { font-size:12.5px; color:var(--muted); }
        .cg-upload-link { display:inline; cursor:pointer; }
        .cg-upload-text b { color:var(--primary); font-weight:600; cursor:pointer; }
        .cg-privacy { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .cg-priv-opt { border:1.5px solid var(--border); border-radius:12px; padding:13px; text-align:left;
          background:var(--surface); }
        .cg-priv-opt.active { border-color:var(--primary); background:var(--primary-soft); }
        .cg-priv-opt-head { display:flex; align-items:center; gap:7px; font-weight:600; font-size:13.5px; margin-bottom:3px; }
        .cg-priv-opt p { margin:0; font-size:11.5px; color:var(--muted); line-height:1.4; }
        .cg-submit { width:100%; background:var(--primary); color:#fff; border:none; border-radius:11px;
          padding:13px; font-size:14.5px; font-weight:600; display:flex; align-items:center; justify-content:center;
          gap:8px; margin-top:6px; }
        .cg-submit:disabled { background:#C7C9DA; cursor:not-allowed; }
        .cg-spin { animation:cg-rotate .8s linear infinite; }
        @keyframes cg-rotate { to { transform:rotate(360deg); } }
        .cg-auth-warning { display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--muted);
          margin-top:10px; }
        .cg-auth-warning.error { color:#E5484D; }
        .cg-auth-warning a { color:var(--primary); font-weight:600; cursor:pointer; }

        /* success */
        .cg-success-icon { width:52px; height:52px; border-radius:50%; background:var(--accent); color:#fff;
          display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .cg-success-head { text-align:center; margin-bottom:22px; }
        .cg-group-card { display:flex; gap:12px; align-items:center; background:var(--bg); border-radius:12px;
          padding:13px; margin-bottom:18px; }
        .cg-group-avatar { width:44px; height:44px; border-radius:11px; background:var(--primary); color:#fff;
          font-family:'Space Grotesk'; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        .cg-group-card strong { font-size:14px; display:block; }
        .cg-link-row { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px dashed #C7C9DA;
          border-radius:10px; padding:11px 13px; margin-bottom:14px; }
        .cg-link-row code { flex:1; font-size:12.5px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cg-copy-btn { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:var(--primary);
          flex-shrink:0; }
        .cg-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .cg-action-btn { border:1px solid var(--border); border-radius:10px; padding:11px; font-size:13px;
          font-weight:600; display:flex; align-items:center; justify-content:center; gap:7px; background:#fff; }
        .cg-qr-wrap { display:flex; align-items:center; gap:14px; background:var(--bg); border-radius:12px; padding:14px; margin-bottom:20px; }
        .cg-qr { width:64px; height:64px; border-radius:8px; flex-shrink:0; }
        .cg-qr-text strong { font-size:13px; display:block; margin-bottom:2px; }
        .cg-qr-text span { font-size:11.5px; color:var(--muted); }
        .cg-open-btn { width:100%; background:var(--ink); color:#fff; border:none; border-radius:11px; padding:13px;
          font-size:14.5px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; }
      `}</style>

      <div className="cg-card">
        <div className="cg-brand"><span className="cg-brand-icon"><MessagesSquare size={15} /></span>LINKCHAT</div>

        {step === "form" && (
          <>
            <h2 className="cg-title">Create your group</h2>
            <p className="cg-sub">Give it a name, set who can join, and you're ready to share one link.</p>

            <div className="cg-field">
              <span className="cg-label">Group image</span>
              <div className="cg-upload">
                <label className="cg-upload-box" style={imagePreview ? { padding: 0, overflow: "hidden" } : {}}>
                  {imagePreview ? <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} /> : <ImageIcon size={20} />}
                  <input type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} />
                </label>
                <div className="cg-upload-text"><label className="cg-upload-link"><b>Upload a photo</b><input type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} /></label> or skip for now — you can add one later.</div>
              </div>
            </div>

            <div className="cg-field">
              <span className="cg-label">Group name</span>
              <input className="cg-input" placeholder="e.g. Tech Learners Hub" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="cg-field">
              <span className="cg-label">Description</span>
              <textarea className="cg-textarea" placeholder="What's this group about?" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>

            <div className="cg-field">
              <span className="cg-label">Category</span>
              <select className="cg-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="cg-field">
              <span className="cg-label">Who can join</span>
              <div className="cg-privacy">
                <button className={`cg-priv-opt ${privacy === "public" ? "active" : ""}`} onClick={() => setPrivacy("public")}>
                  <div className="cg-priv-opt-head"><Globe size={15} />Public</div>
                  <p>Anyone with the link can join instantly.</p>
                </button>
                <button className={`cg-priv-opt ${privacy === "private" ? "active" : ""}`} onClick={() => setPrivacy("private")}>
                  <div className="cg-priv-opt-head"><Lock size={15} />Private</div>
                  <p>New members need host approval to join.</p>
                </button>
              </div>
            </div>

            <button className="cg-submit" disabled={!canCreate || creating} onClick={handleCreate}>
              {creating ? <Loader2 size={16} className="cg-spin" /> : <>Create Group <ArrowRight size={16} /></>}
            </button>
            {formError && <div className="cg-auth-warning error"><AlertCircle size={14} />{formError}</div>}
          </>
        )}

        {step === "success" && group && (
          <>
            <div className="cg-success-icon"><Check size={26} /></div>
            <div className="cg-success-head">
              <h2 className="cg-title">Your group is ready!</h2>
              <p className="cg-sub">Share the link below to start bringing people in.</p>
            </div>

            <div className="cg-group-card">
              <div className="cg-group-avatar">{group.image_url ? <img src={group.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : group.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
              <div>
                <strong>{group.name}</strong>
                <span className="muted" style={{ fontSize: 12, color: "var(--muted)" }}>1 member · {group.privacy === "public" ? "Public" : "Private"}</span>
              </div>
            </div>

            <div className="cg-link-row">
              <code>{window.location.host}/join/{group.invite_code}</code>
              <button className="cg-copy-btn" onClick={copyLink}>
                {copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy</>}
              </button>
            </div>

            <div className="cg-actions">
              <button className="cg-action-btn"><Share2 size={15} />Share Link</button>
              <button className="cg-action-btn"><QrCode size={15} />Show QR</button>
            </div>

            <div className="cg-qr-wrap">
              <QrGrid seed={group.invite_code} />
              <div className="cg-qr-text">
                <strong>Scan to join</strong>
                <span>Print it, post it, or share it in stories.</span>
              </div>
            </div>

            <button className="cg-open-btn" onClick={() => navigate(`/groups/${group.id}`)}>Open Group <ArrowRight size={16} /></button>
          </>
        )}
      </div>
    </div>
  );
}
