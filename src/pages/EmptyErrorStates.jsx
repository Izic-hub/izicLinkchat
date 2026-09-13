import React, { useState } from "react";
import {
  Users, MessagesSquare, Link2, SearchX, AlertTriangle, UserX, ShieldAlert,
  UserCheck, RefreshCw, ArrowRight
} from "lucide-react";

const STATES = [
  {
    id: "no-groups",
    kind: "empty",
    icon: Users,
    title: "No groups yet",
    text: "Create your first group and bring your people together.",
    action: "Create Group",
  },
  {
    id: "empty-chat",
    kind: "empty",
    icon: MessagesSquare,
    title: "This conversation is just getting started.",
    text: "Send the first message.",
    action: null,
  },
  {
    id: "no-search-results",
    kind: "empty",
    icon: SearchX,
    title: "No results found",
    text: "Try a different name, username, or check the spelling.",
    action: null,
  },
  {
    id: "invalid-invite",
    kind: "error",
    icon: Link2,
    title: "Invalid invite link",
    text: "This invitation link may have expired or been disabled.",
    action: "Back to Home",
  },
  {
    id: "group-not-found",
    kind: "error",
    icon: AlertTriangle,
    title: "Group not found",
    text: "We couldn't find this group. It may have been deleted or renamed.",
    action: "Back to Home",
  },
  {
    id: "already-member",
    kind: "notice",
    icon: UserCheck,
    title: "You're already a member",
    text: "You're already part of this group — no need to join again.",
    action: "Open Group",
  },
  {
    id: "username-taken",
    kind: "field-error",
    icon: null,
    title: "Username unavailable",
    text: "That username is already taken. Try another.",
  },
  {
    id: "banned",
    kind: "error",
    icon: ShieldAlert,
    title: "You can't join this group",
    text: "You've been removed from this group by an admin.",
    action: null,
  },
  {
    id: "removed-mid-chat",
    kind: "error",
    icon: UserX,
    title: "You've left this group",
    text: "You no longer have access to this conversation.",
    action: "Back to My Groups",
  },
  {
    id: "connection-lost",
    kind: "error",
    icon: RefreshCw,
    title: "Connection lost",
    text: "Trying to reconnect you to the conversation…",
    action: "Retry now",
  },
];

const KIND_LABEL = {
  empty: "Empty state",
  error: "Error state",
  notice: "Notice",
  "field-error": "Field error",
};

function StateCard({ s }) {
  if (s.kind === "field-error") {
    return (
      <div className="es-card">
        <span className="es-kind">{KIND_LABEL[s.kind]}</span>
        <div className="es-field-demo">
          <span className="es-field-label">Username</span>
          <input className="es-input err" defaultValue="izic" readOnly />
          <span className="es-field-err">{s.text}</span>
        </div>
      </div>
    );
  }
  const Icon = s.icon;
  return (
    <div className="es-card">
      <span className="es-kind">{KIND_LABEL[s.kind]}</span>
      <div className={`es-icon ${s.kind}`}><Icon size={22} /></div>
      <strong className="es-title">{s.title}</strong>
      <p className="es-text">{s.text}</p>
      {s.action && <button className={`es-btn ${s.kind === "error" ? "ghost" : "primary"}`}>{s.action}{s.kind !== "error" && <ArrowRight size={14} />}</button>}
    </div>
  );
}

export default function EmptyErrorStates() {
  return (
    <div className="es-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .es-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0; --danger:#E5484D; --warn:#946200;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg); padding:28px;
          border-radius:16px; border:1px solid var(--border); }
        .es-root * { box-sizing:border-box; }
        .es-root button { font-family:inherit; cursor:pointer; }
        .es-head { font-family:'Space Grotesk'; font-size:18px; font-weight:600; margin:0 0 4px; }
        .es-sub { font-size:13px; color:var(--muted); margin:0 0 22px; }
        .es-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; }
        @media (max-width: 760px) { .es-grid { grid-template-columns:1fr 1fr; } }

        .es-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px 18px;
          display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; min-height:190px; }
        .es-kind { position:absolute; top:12px; left:14px; font-size:9.5px; font-weight:700; letter-spacing:0.02em;
          color:var(--muted); background:var(--bg); padding:2px 7px; border-radius:6px; }
        .es-icon { width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center;
          margin:20px 0 12px; }
        .es-icon.empty { background:var(--primary-soft); color:var(--primary); }
        .es-icon.error { background:#FDEAEA; color:var(--danger); }
        .es-icon.notice { background:#EAFBF6; color:var(--accent); }
        .es-title { font-size:13.5px; margin-bottom:5px; }
        .es-text { font-size:12px; color:var(--muted); line-height:1.5; margin:0 0 14px; }
        .es-btn { font-size:12px; font-weight:600; border-radius:9px; padding:8px 14px; display:inline-flex;
          align-items:center; gap:6px; margin-top:auto; }
        .es-btn.primary { background:var(--primary); color:#fff; border:none; }
        .es-btn.ghost { background:#fff; color:var(--ink); border:1px solid var(--border); }

        .es-field-demo { width:100%; text-align:left; padding-top:20px; }
        .es-field-label { font-size:12px; font-weight:600; color:#464A68; display:block; margin-bottom:7px; }
        .es-input { width:100%; border-radius:10px; padding:10px 12px; font-size:13.5px; background:var(--bg); }
        .es-input.err { border:1.5px solid var(--danger); }
        .es-field-err { display:block; font-size:11.5px; color:var(--danger); margin-top:6px; }
      `}</style>

      <h2 className="es-head">Empty &amp; error states</h2>
      <p className="es-sub">Reference sheet — the interface's voice for every gap and failure named in the brief.</p>

      <div className="es-grid">
        {STATES.map((s) => <StateCard s={s} key={s.id} />)}
      </div>
    </div>
  );
}
