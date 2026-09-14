import React, { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { MessagesSquare, Eye, EyeOff, ArrowRight, Chrome, Loader2 } from "lucide-react";
import { signUp, signIn, signOut, signInWithGoogle } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";

export default function AuthScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  // The route itself (/login vs /signup) decides which tab opens, not a
  // hardcoded default — landing on /login should show the Log In tab.
  const [mode, setMode] = useState(location.pathname === "/login" ? "login" : "signup");
  const [switching, setSwitching] = useState(false);

  async function handleGoogleSignIn() {
    setFormError("");
    try {
      await signInWithGoogle();
      // browser redirects to Google now — nothing else to do here
    } catch (err) {
      setFormError(err.message || "Couldn't start Google sign-in.");
    }
  }

  async function handleSwitchAccount() {
    setSwitching(true);
    await signOut();
    setSwitching(false);
    // signOut clears the session; AuthContext's listener sets user to null
    // automatically, which re-renders this component into the normal form.
  }
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // signup fields
  const [suUsername, setSuUsername] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suPw2, setSuPw2] = useState("");

  // login fields
  const [liId, setLiId] = useState("");
  const [liPw, setLiPw] = useState("");
  const [remember, setRemember] = useState(true);

  const pwMismatch = suPw2.length > 0 && suPw !== suPw2;
  const canSignUp = suUsername.trim().length >= 3 && suEmail.includes("@") && suPw.length >= 8 && !pwMismatch;
  const canLogin = liId.trim().length >= 2 && liPw.length >= 1;

  async function handleSignUp() {
    setFormError("");
    setLoading(true);
    try {
      const result = await signUp({ email: suEmail, password: suPw, username: suUsername, phone: suPhone });
      if (result.pendingConfirmation) {
        setFormError("Check your email to confirm your account, then log in.");
        setMode("login");
      } else {
        navigate(redirectTo || "/create");
      }
    } catch (err) {
      setFormError(err.message || "Something went wrong creating your account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setFormError("");
    setLoading(true);
    try {
      // liId doubles as username/phone/email in the UI; Supabase Auth itself
      // only accepts email — swap in a profiles lookup here once usernames
      // need to log in directly.
      await signIn({ email: liId, password: liPw });
      navigate(redirectTo || "/profile");
    } catch (err) {
      setFormError(err.message || "Couldn't sign you in — check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="au-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .au-root {
          font-family:'Inter',sans-serif; color:var(--ink);
          background:radial-gradient(circle at 15% 0%, var(--primary-soft) 0%, var(--bg) 55%);
          min-height:660px; display:flex; align-items:center; justify-content:center; padding:28px;
          border-radius:16px; }
        .au-root * { box-sizing:border-box; }
        .au-root button { font-family:inherit; cursor:pointer; }
        .au-root input { font-family:inherit; }
        .au-card { width:100%; max-width:400px; background:var(--surface); border:1px solid var(--border);
          border-radius:18px; padding:28px 28px 26px; }
        .au-brand { display:flex; align-items:center; justify-content:center; gap:8px; color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:14px; margin-bottom:22px; }
        .au-brand-icon { width:26px; height:26px; border-radius:8px; background:var(--primary); color:#fff;
          display:flex; align-items:center; justify-content:center; }

        .au-tabs { display:flex; background:var(--bg); border-radius:11px; padding:4px; margin-bottom:22px; }
        .au-tab { flex:1; border:none; background:none; padding:9px; border-radius:8px; font-size:13.5px;
          font-weight:600; color:var(--muted); }
        .au-tab.active { background:#fff; color:var(--ink); box-shadow:0 1px 3px rgba(20,20,43,.08); }

        h2.au-title { font-family:'Space Grotesk'; font-size:20px; margin:0 0 4px; }
        p.au-sub { color:var(--muted); font-size:13px; margin:0 0 20px; }

        .au-field { margin-bottom:14px; }
        .au-label { display:block; font-size:12.5px; font-weight:600; color:#464A68; margin-bottom:7px; }
        .au-input-wrap { position:relative; }
        .au-input { width:100%; border:1px solid var(--border); background:var(--bg); border-radius:10px;
          padding:11px 13px; font-size:14px; color:var(--ink); outline:none; }
        .au-input:focus { border-color:var(--primary); background:#fff; }
        .au-input.err { border-color:var(--danger); }
        .au-eye { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:var(--muted);
          background:none; border:none; display:flex; }
        .au-err-text { color:var(--danger); font-size:11.5px; margin-top:5px; }

        .au-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; font-size:12.5px; }
        .au-remember { display:flex; align-items:center; gap:7px; color:#464A68; }
        .au-forgot { color:var(--primary); font-weight:600; }

        .au-submit { width:100%; background:var(--primary); color:#fff; border:none; border-radius:11px;
          padding:12.5px; font-size:14.5px; font-weight:600; display:flex; align-items:center; justify-content:center;
          gap:8px; margin-bottom:16px; }
        .au-submit:disabled { background:#C7C9DA; cursor:not-allowed; }
        .au-form-error { font-size:12px; color:var(--danger); text-align:center; margin:-8px 0 14px; }
        .au-spin { animation:au-rotate .8s linear infinite; }
        @keyframes au-rotate { to { transform:rotate(360deg); } }

        .au-divider { display:flex; align-items:center; gap:10px; color:var(--muted); font-size:11.5px;
          margin-bottom:16px; }
        .au-divider::before, .au-divider::after { content:''; flex:1; height:1px; background:var(--border); }

        .au-google { width:100%; border:1px solid var(--border); background:#fff; border-radius:11px;
          padding:11px; font-size:13.5px; font-weight:600; color:var(--ink); display:flex; align-items:center;
          justify-content:center; gap:9px; }
        .au-google:hover { background:var(--bg); }

        .au-switch { text-align:center; font-size:12.5px; color:var(--muted); margin-top:18px; }
        .au-switch b { color:var(--primary); cursor:pointer; }
      `}</style>

      <div className="au-card">
        <div className="au-brand"><span className="au-brand-icon"><MessagesSquare size={15} /></span>LINKCHAT</div>

        {!authLoading && user ? (
          <>
            <h2 className="au-title">You're already signed in</h2>
            <p className="au-sub">Continue as {user.email}, or switch to a different account.</p>
            <button className="au-submit" onClick={() => navigate(redirectTo || "/profile")}>
              Continue <ArrowRight size={16} />
            </button>
            <button className="au-google" onClick={handleSwitchAccount} disabled={switching}>
              {switching ? <Loader2 size={16} className="au-spin" /> : "Log out & use a different account"}
            </button>
          </>
        ) : (
          <>
        <div className="au-tabs">
          <button className={`au-tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Sign Up</button>
          <button className={`au-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Log In</button>
        </div>

        {mode === "signup" && (
          <>
            <h2 className="au-title">Create your account</h2>
            <p className="au-sub">One account gets you into every group you join.</p>

            <div className="au-field">
              <span className="au-label">Username</span>
              <input className="au-input" placeholder="Pick a unique username" value={suUsername} onChange={(e) => setSuUsername(e.target.value)} />
            </div>
            <div className="au-field">
              <span className="au-label">Phone number</span>
              <input className="au-input" placeholder="+234" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} />
            </div>
            <div className="au-field">
              <span className="au-label">Email</span>
              <input className="au-input" type="email" placeholder="you@example.com" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
            </div>
            <div className="au-field">
              <span className="au-label">Password</span>
              <div className="au-input-wrap">
                <input className="au-input" type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={suPw} onChange={(e) => setSuPw(e.target.value)} style={{ paddingRight: 40 }} />
                <button className="au-eye" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div className="au-field">
              <span className="au-label">Confirm password</span>
              <div className="au-input-wrap">
                <input className={`au-input ${pwMismatch ? "err" : ""}`} type={showPw2 ? "text" : "password"} placeholder="Re-enter password" value={suPw2} onChange={(e) => setSuPw2(e.target.value)} style={{ paddingRight: 40 }} />
                <button className="au-eye" onClick={() => setShowPw2((v) => !v)}>{showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {pwMismatch && <div className="au-err-text">Passwords don't match.</div>}
            </div>

            <button className="au-submit" disabled={!canSignUp || loading} onClick={handleSignUp}>
              {loading ? <Loader2 size={16} className="au-spin" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
            {formError && <div className="au-form-error">{formError}</div>}

            <div className="au-divider">or</div>
            <button className="au-google" onClick={handleGoogleSignIn}><Chrome size={16} />Continue with Google</button>

            <div className="au-switch">Already have an account? <b onClick={() => setMode("login")}>Log in</b></div>
          </>
        )}

        {mode === "login" && (
          <>
            <h2 className="au-title">Welcome back</h2>
            <p className="au-sub">Log in to pick up your conversations.</p>

            <div className="au-field">
              <span className="au-label">Username, phone, or email</span>
              <input className="au-input" placeholder="How you signed up" value={liId} onChange={(e) => setLiId(e.target.value)} />
            </div>
            <div className="au-field">
              <span className="au-label">Password</span>
              <div className="au-input-wrap">
                <input className="au-input" type={showPw ? "text" : "password"} placeholder="Your password" value={liPw} onChange={(e) => setLiPw(e.target.value)} style={{ paddingRight: 40 }} />
                <button className="au-eye" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <div className="au-row">
              <label className="au-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <span className="au-forgot">Forgot password?</span>
            </div>

            <button className="au-submit" disabled={!canLogin || loading} onClick={handleLogin}>
              {loading ? <Loader2 size={16} className="au-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
            {formError && <div className="au-form-error">{formError}</div>}

            <div className="au-divider">or</div>
            <button className="au-google" onClick={handleGoogleSignIn}><Chrome size={16} />Continue with Google</button>

            <div className="au-switch">New to LINKCHAT? <b onClick={() => setMode("signup")}>Create an account</b></div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
