# LINKCHAT — production checklist

## 1. Supabase Auth settings
- [ ] Email confirmation is ON (Authentication → Providers → Email).
- [ ] Site URL and Redirect URLs point at your real domain, not localhost
      (Authentication → URL Configuration).
- [ ] Google OAuth configured if you want "Continue with Google" to work.

## 2. Database: run `supabase/` files in order
`01_schema` → `02_fix_profile_trigger` → `03_fix_google_signup_trigger` →
`04_fix_membership_policy` → `05_fix_phone_privacy` → `06_fix_delete_policies` →
`07_fix_member_delete_policy` → `08_fix_leave_and_admin_delete` →
`09_notifications_schema` → `10_…part1` (alone) → `11_…part2` →
`12_storage_setup` → `13_storage_setup_attachments` → `14_superadmin_schema` →
`15_direct_messages` → `16_session_security`

Already-applied files are safe to re-run. Only needed in full for a fresh project.

## 3. Deploy the two Edge Functions (needed for session security)
Dashboard → Edge Functions → Deploy a new function, once per function. The name
must match exactly. Paste the file's contents and deploy. No secrets to set.

| Name | File |
|---|---|
| `register-session` | `supabase/functions/register-session/index.ts` |
| `revoke-user-sessions` | `supabase/functions/revoke-user-sessions/index.ts` |

Until they're deployed the app still works. The session checks just do nothing
(they fail open), and "Sign out of all devices" / ban-revocation will report an error.

## 4. Environment variables on your host
`.env` is gitignored on purpose. Add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in your host's dashboard (Vercel: Settings →
Environment Variables) and redeploy.

## 5. How session security behaves (so it isn't a surprise)
- Each sign-in gets a 24-hour session. After that the app signs the user out.
- Signing in on a new device signs out the old one (within ~2 minutes, or
  immediately when that tab is next focused).
- Banning a user from the Platform Admin page ends their sessions at once.
- Limits worth knowing: expiry and kick-out are enforced by the app's own check
  plus Supabase revoking the old refresh token. A request already carrying a
  still-valid access token (up to ~1 hour old) can keep working until it
  refreshes, and someone deliberately tampering with the client could skip the
  24h check. Closing that fully needs Supabase's Pro "User Sessions" settings.

## 6. Smoke test on the real URL
- [ ] Sign up, confirm email, log in
- [ ] Create a group with a photo; open the invite link in a private window as a second account and join
- [ ] Messages appear live both ways; send an image, a file, a voice note
- [ ] Private group: join creates a pending request; host approves it
- [ ] Lock icon → private chat with the other account; the unread badge and the notification work
- [ ] Log in on a second device: the first device is signed out
- [ ] Profile → "Sign out of all devices" signs out everywhere
- [ ] Ban a test user from /superadmin: they're signed out
- [ ] Clicking the logo opens the landing page
