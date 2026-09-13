# LINKCHAT — production checklist

## 1. Supabase Auth settings (currently set up for local testing only)

- [ ] **Re-enable email confirmation.** You turned this off earlier to speed up
      testing (Authentication → Providers → Email → "Confirm email"). Turn it
      back ON before real users sign up, or anyone can register with a fake
      email address.
- [ ] **Set Site URL and Redirect URLs.** Authentication → URL Configuration
      currently points at `http://localhost:5173`. Once you have a real
      domain (from deployment, step 3 below), update:
      - Site URL → `https://yourdomain.com`
      - Redirect URLs → add `https://yourdomain.com/**`
      Leaving this on localhost means password-reset emails and auth
      redirects will send people to their own computer, not your live site.

## 2. Run the remaining SQL files (if you haven't already, in this order)

1. `schema.sql`
2. `fix_profile_trigger.sql`
3. `fix_membership_policy.sql`
4. `notifications_schema.sql`
5. `storage_setup.sql`
6. `fix_phone_privacy.sql`

Each is idempotent-ish (uses `if not exists` / `on conflict do nothing`
where it matters) but run them in order regardless, since later ones
sometimes depend on earlier ones (e.g. `is_group_admin()` from schema.sql
is used by `group_invites`' policy in notifications_schema.sql).

## 3. Environment variables for deployment

Your `.env` only exists on your computer — it's in `.gitignore` on purpose,
so it will **not** come along when you push to GitHub or deploy. Whatever
host you pick needs the same two values entered into its own dashboard:

```
VITE_SUPABASE_URL=https://nhqkgzxwwcghizlafiey.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kT3dvpAtiqdpx2M4kcw6yQ_ol_Yea62
```

**Recommended host: Vercel** (built for exactly this — Vite + React, free tier, zero config):
1. Push this repo to GitHub (step 4).
2. Go to vercel.com → New Project → import the GitHub repo.
3. Vercel auto-detects Vite. Before deploying, add the two env vars above
   under Environment Variables.
4. Deploy. You'll get a `yourproject.vercel.app` URL — that's what goes
   into Supabase's Site URL setting (step 1).

(Netlify works the same way if you'd rather use that instead.)

## 4. Push to GitHub

```bash
cd linkchat-scaffold
git init
git add .
git commit -m "Initial commit"
```
Then create a new empty repo on GitHub (no README/license, so it doesn't
conflict with what you already have), and:
```bash
git remote add origin https://github.com/yourusername/linkchat.git
git branch -M main
git push -u origin main
```

**Before you run `git add .` the first time**, double check `.env` is
NOT about to be committed:
```bash
git status
```
`.env` should not appear in the list (that's what `.gitignore` is for).
If it does appear, something's wrong with `.gitignore` — stop and fix
that before committing, don't push a key to a public repo.

## 5. Known gaps — not blocking launch, but worth knowing about

These are real limitations in what's built so far, not bugs — things that
were out of scope for this pass rather than broken:

- **Composer icons are decorative.** Emoji, attach, image, and voice-message
  buttons in the chat don't do anything yet — only text messages actually send.
- **No message edit/delete UI**, even though the database supports it
  (`edited_at` column, and RLS already allows senders to update their own
  messages) — there's just no button for it yet.
- **"Continue with Google" is decorative** — no OAuth provider is wired up
  in Supabase yet.
- **Avatars only show real photos in the screens touched today**
  (GroupChatInterface, UserProfile, CreateGroupFlow, GroupAdminDashboard).
  GroupMembersPage, SearchDiscovery, and NotificationsPage still render
  initials-only avatars even if a real photo exists — the data's there,
  those specific components just weren't updated to display it.
- **"Who can see my username" only controls search visibility** — it
  doesn't hide your username from people already in a shared group (that's
  intentional — hiding it there would break mentions and message
  attribution — but it's worth knowing the toggle is narrower than its
  label implies).
- **No automated tests.** Everything's been tested by hand through this
  conversation.

None of these will break what's already working — they're just features
that aren't built yet, distinct from the actual bugs that were fixed
along the way.

## 6. Final smoke test before calling it live

Once deployed, run through this once on the real URL (not localhost):

- [ ] Sign up with a real email, confirm it, log in
- [ ] Create a group, upload a group photo, copy the invite link
- [ ] Open the invite link in an incognito window, sign up as a second
      account, join the group
- [ ] Send a message from each account — confirm both appear live without
      refreshing
- [ ] From the admin dashboard, promote the second account to admin, then
      demote and remove them
- [ ] Send a message with `@theirusername` in it — confirm they get a
      mention notification
- [ ] Log out, log back in — confirm your groups and messages are still there
