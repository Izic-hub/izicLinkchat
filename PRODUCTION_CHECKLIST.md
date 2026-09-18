# LINKCHAT — production checklist

## 1. Supabase Auth settings (confirm these before real users sign up)

- [ ] **Email confirmation is ON.** Authentication → Providers → Email →
      "Confirm email". If this was ever turned off for faster testing,
      turn it back on — otherwise anyone can register with a fake address.
- [ ] **Site URL and Redirect URLs point at your real domain**, not
      localhost. Authentication → URL Configuration:
      - Site URL → `https://yourdomain.com`
      - Redirect URLs → add `https://yourdomain.com/**`
- [ ] **Google OAuth is configured** (if you want "Continue with Google"
      to actually work) — Authentication → Providers → Google, with a
      Client ID/Secret from Google Cloud Console. The redirect URI
      Google needs is shown right there in that settings panel.

## 2. Run every file in `supabase/`, in order (01 through 14)

They're numbered because later ones depend on earlier ones — e.g.
`04_fix_membership_policy.sql` needs the `group_members` table from
`01_schema.sql`, and `11_fix_granular_notifications_part2.sql` needs the
enum values `10_..._part1.sql` adds first (Postgres won't let a new enum
value be used in the same transaction that created it — that's the one
pair that must run as two *separate* executions, not pasted together).

If you've already run some of these individually over the course of
building this, that's fine — running them again is safe (they all use
`if not exists` / `on conflict do nothing` / `create or replace` where
it matters), just run the full numbered set once through if you're ever
setting this up against a **fresh** Supabase project.

## 3. Environment variables for deployment

`.env` never leaves your computer (it's gitignored). Whatever host you
deploy to needs the same two values entered into its own dashboard —
copy them from your own `.env`, not from `.env.example` (which only has
placeholders on purpose).

**Vercel:** Project → Settings → Environment Variables → add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

## 4. Push to GitHub

```bash
git init
git add .
git status   # confirm .env does NOT appear in this list before continuing
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/linkchat.git
git branch -M main
git push -u origin main
```

## 5. Current status — what's real vs. what's still a known gap

Everything below is accurate as of the latest round of work. Anything
not listed as a gap is fully wired to Supabase — no mock data left
anywhere in the app.

**Fully working:** auth (email + Google), group create/join/leave/delete,
public and private groups (private ones create a pending request that
needs host/admin approval), real-time messaging with edit/delete
(including admins deleting any member's message), image/file/voice
message attachments, emoji picker, live typing indicators and online
presence, member management (promote/demote/mute/ban/unban), direct
invites by username, notifications (mentions, replies, invites, new
members, announcements, group setting changes, member removal) with live
push, 4 switchable themes, PWA installability, a platform-wide
Super-Admin dashboard (delete any group, ban any user — restricted to
one specific account, enforced at the database level not just the UI).

**Known gaps — not bugs, just not built yet:**
- **No automated tests.** Everything's been tested by hand.
- **No group video/voice calling.** This needs real signaling
  infrastructure (TURN/STUN servers) — the sane path is a third-party
  SDK (LiveKit, Daily.co, Twilio Video, Agora) rather than building
  WebRTC from scratch. Worth scoping as its own project when ready.
- **Member counts aren't shown in the Super-Admin group list** — kept
  out of the first version to avoid one extra query per group; easy to
  add later if useful.

## 6. Final smoke test before calling it live

Run through this once on the real deployed URL (not localhost):

- [ ] Sign up with a real email, confirm it, log in
- [ ] Create a group, upload a group photo, copy the invite link
- [ ] Open the invite link in an incognito window, sign up as a second
      account, join the group
- [ ] Send a message from each account — confirm both appear live
      without refreshing
- [ ] Send an image, a file, and a voice note
- [ ] Edit one of your own messages; as an admin, delete someone else's
- [ ] From the admin dashboard, promote the second account to admin,
      then demote and remove them; confirm they actually stay removed
      after a refresh
- [ ] Create a private group and confirm joining it creates a pending
      request, not instant access
- [ ] Send a message with `@theirusername` in it — confirm they get a
      mention notification
- [ ] Switch themes on the Profile page and confirm it applies app-wide
- [ ] Log out, log back in — confirm your groups and messages are still there
