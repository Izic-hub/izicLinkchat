import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Users, AtSign, UserPlus, X, Loader2, Check } from "lucide-react";
import { searchGroups, searchPeople } from "../lib/profiles";
import { getMyGroups, joinGroup } from "../lib/groups";
import { useAuth } from "../lib/AuthContext";

function initialsOf(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function SearchDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth(); // guaranteed non-null — this route is wrapped in RequireAuth

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("groups");
  const [groupResults, setGroupResults] = useState([]);
  const [peopleResults, setPeopleResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [myGroupIds, setMyGroupIds] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);
  const [toast, setToast] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    getMyGroups(user.id).then((groups) => setMyGroupIds(new Set(groups.map((g) => g.id))));
  }, [user]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setGroupResults([]);
      setPeopleResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      Promise.all([searchGroups(q), searchPeople(q)])
        .then(([groups, people]) => {
          setGroupResults(groups);
          setPeopleResults(people.filter((p) => p.id !== user.id));
        })
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, user]);

  async function handleJoin(group) {
    setJoiningId(group.id);
    try {
      await joinGroup({ groupId: group.id, userId: user.id });
      setMyGroupIds((prev) => new Set([...prev, group.id]));
    } catch (err) {
      setToast(err.message || "Couldn't join that group.");
      setTimeout(() => setToast(null), 2200);
    } finally {
      setJoiningId(null);
    }
  }

  function handleConnect(person) {
    // No connections/friends table in the schema yet — that's a separate
    // feature (a `connections` table + requests) beyond search itself.
    setToast(`Direct connections aren't available yet — for now, you'll cross paths with ${person.display_name || person.username} inside shared groups.`);
    setTimeout(() => setToast(null), 3200);
  }

  const showEmpty = query.trim().length > 0 && !searching && groupResults.length === 0 && peopleResults.length === 0;
  const showPrompt = query.trim().length === 0;

  return (
    <div className="sd-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .sd-root { --ink:#14142B; --bg:#F3F4FA; --surface:#FFFFFF; --border:#E3E5F2; --primary:#4338CA;
          --primary-soft:#EEF0FD; --accent:#16C7A6; --muted:#8A8FB0;
          font-family:'Inter',sans-serif; color:var(--ink); background:var(--surface);
          border-radius:16px; border:1px solid var(--border); overflow:hidden; max-width:460px; min-height:560px;
          display:flex; flex-direction:column; position:relative; }
        .sd-root * { box-sizing:border-box; }
        .sd-root button { font-family:inherit; cursor:pointer; }
        .sd-root input { font-family:inherit; outline:none; border:none; background:none; }
        .sd-spin { animation:sd-rotate .8s linear infinite; }
        @keyframes sd-rotate { to { transform:rotate(360deg); } }

        .sd-header { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--border); }
        .sd-icon-btn { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center;
          color:var(--muted); border:none; background:none; flex-shrink:0; }
        .sd-icon-btn:hover { background:var(--bg); color:var(--ink); }
        .sd-search-bar { flex:1; background:var(--bg); border-radius:10px; padding:9px 12px; display:flex;
          align-items:center; gap:8px; }
        .sd-search-bar input { flex:1; font-size:13.5px; }

        .sd-tabs { display:flex; border-bottom:1px solid var(--border); padding:0 16px; }
        .sd-tab { flex:1; padding:11px 0; text-align:center; font-size:13px; font-weight:600; color:var(--muted);
          background:none; border:none; border-bottom:2px solid transparent; display:flex; align-items:center;
          justify-content:center; gap:6px; }
        .sd-tab.active { color:var(--primary); border-color:var(--primary); }
        .sd-tab-count { background:var(--bg); color:var(--muted); font-size:10.5px; padding:1px 6px; border-radius:8px; }
        .sd-tab.active .sd-tab-count { background:var(--primary-soft); color:var(--primary); }

        .sd-list { padding:10px 14px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:6px; }

        .sd-group-row, .sd-person-row { display:flex; align-items:center; gap:11px; padding:9px 8px; border-radius:12px; }
        .sd-group-row:hover, .sd-person-row:hover { background:var(--bg); }
        .sd-g-avatar { width:42px; height:42px; border-radius:12px; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        .sd-p-avatar { width:42px; height:42px; border-radius:50%; background:var(--primary-soft); color:var(--primary);
          font-family:'Space Grotesk'; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        .sd-item-text { flex:1; min-width:0; }
        .sd-item-text strong { font-size:13.5px; display:block; }
        .sd-item-text span { font-size:11.5px; color:var(--muted); }
        .sd-item-desc { font-size:11.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }

        .sd-join-btn { border:1px solid var(--border); background:#fff; border-radius:9px; padding:7px 13px;
          font-size:12px; font-weight:600; flex-shrink:0; display:flex; align-items:center; gap:5px; min-width:60px; justify-content:center; }
        .sd-join-btn.joined { color:var(--accent); border-color:transparent; background:none; }
        .sd-connect-btn { display:flex; align-items:center; gap:5px; border:1px solid var(--border); background:#fff;
          border-radius:9px; padding:7px 12px; font-size:12px; font-weight:600; flex-shrink:0; color:var(--primary); }

        .sd-status-wrap { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          text-align:center; padding:40px 30px; gap:10px; }
        .sd-status-wrap strong { font-size:14px; }
        .sd-status-wrap p { font-size:12.5px; color:var(--muted); margin:0; line-height:1.5; }

        .sd-toast { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); background:var(--ink);
          color:#fff; font-size:12px; padding:10px 16px; border-radius:10px; max-width:88%; text-align:center;
          box-shadow:0 10px 24px -8px rgba(20,20,43,.4); }
      `}</style>

      <div className="sd-header">
        <button className="sd-icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
        <div className="sd-search-bar">
          <Search size={15} color="var(--muted)" />
          <input placeholder="Search groups or usernames…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          {query && <button className="sd-icon-btn" style={{ width: 22, height: 22 }} onClick={() => setQuery("")}><X size={13} /></button>}
        </div>
      </div>

      {!showPrompt && !showEmpty && (
        <div className="sd-tabs">
          <button className={`sd-tab ${tab === "groups" ? "active" : ""}`} onClick={() => setTab("groups")}>
            Groups <span className="sd-tab-count">{groupResults.length}</span>
          </button>
          <button className={`sd-tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>
            People <span className="sd-tab-count">{peopleResults.length}</span>
          </button>
        </div>
      )}

      {showPrompt ? (
        <div className="sd-status-wrap">
          <Search size={22} color="var(--muted)" />
          <strong>Search for groups or people</strong>
          <p>Find public groups by name, or people by username.</p>
        </div>
      ) : searching ? (
        <div className="sd-status-wrap"><Loader2 size={22} className="sd-spin" color="var(--primary)" /></div>
      ) : showEmpty ? (
        <div className="sd-status-wrap">
          <Search size={22} color="var(--muted)" />
          <strong>No results for "{query}"</strong>
          <p>Try a different name, username, or check the spelling.</p>
        </div>
      ) : (
        <div className="sd-list">
          {tab === "groups" && groupResults.map((g) => {
            const joined = myGroupIds.has(g.id);
            return (
              <div className="sd-group-row" key={g.id} onClick={() => joined && navigate(`/groups/${g.id}`)} style={{ cursor: joined ? "pointer" : "default" }}>
                <div className="sd-g-avatar">
                  {g.image_url ? <img src={g.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(g.name)}
                </div>
                <div className="sd-item-text">
                  <strong>{g.name}</strong>
                  <span className="sd-item-desc">{g.description || "No description yet."}</span>
                </div>
                <button
                  className={`sd-join-btn ${joined ? "joined" : ""}`}
                  disabled={joined || joiningId === g.id}
                  onClick={(e) => { e.stopPropagation(); handleJoin(g); }}
                >
                  {joiningId === g.id ? <Loader2 size={13} className="sd-spin" /> : joined ? <><Check size={13} />Joined</> : "Join"}
                </button>
              </div>
            );
          })}
          {tab === "people" && peopleResults.map((p) => (
            <div className="sd-person-row" key={p.id}>
              <div className="sd-p-avatar">
                {p.profile_image_url ? <img src={p.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : initialsOf(p.display_name || p.username)}
              </div>
              <div className="sd-item-text">
                <strong>{p.display_name || p.username}</strong>
                <span>@{p.username}</span>
              </div>
              <button className="sd-connect-btn" onClick={() => handleConnect(p)}><UserPlus size={13} />Connect</button>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="sd-toast">{toast}</div>}
    </div>
  );
}
