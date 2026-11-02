# LINKCHAT

Group chat built around one invite link: create a group, share the link,
everyone lands in the same conversation. React + Vite on the frontend,
Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) behind it.

**What's in it:** real-time messaging with edit/delete, image/file/voice
attachments, public and private groups (private ones need host approval),
member management, direct invites, notifications, **private 1-to-1 chats
inside a group**, 4 themes, PWA install, a platform-admin dashboard for one
account, and session security (24-hour sessions, one device at a time,
instant revocation).

## Structure

```
.env.example            copy to .env and fill in your own Supabase values
vite.config.js          includes the PWA plugin
vercel.json             SPA rewrite (needed for client-side routing)
supabase/
  01_ ... 16_*.sql      run in SQL Editor, in numbered order
  functions/
    register-session/         Edge Function: one device at a time, 24h session
    revoke-user-sessions/     Edge Function: instant sign-out (self or admin ban)
src/
  App.jsx               every route
  lib/                  supabase client, auth/theme contexts, one service file per area,
                        sessionGuard.js, directMessages.js, theme.css
  components/           ThemeSwitcher, MemberProfileModal, PrivateChat
  pages/                one file per screen
```

## Routes

| Path | Screen | Needs sign-in |
|---|---|---|
| `/` | Landing (the logo links here from every screen) | No |
| `/login`, `/signup` | Auth | No |
| `/join/:code` | Join preview | Joining does |
| `/create` | Create group | Yes |
| `/groups/:groupId` | Chat (lock icon = private chats; `?dm=USERID` opens one) | Yes |
| `/groups/:groupId/members`, `/admin` | Members, admin dashboard | Yes (admin for `/admin`) |
| `/profile`, `/search`, `/notifications` | Profile, search, notifications | Yes |
| `/superadmin` | Platform admin | One account only |

## Setup

```bash
npm install
cp .env.example .env     # then fill in your Supabase URL + anon key
npm run dev
```

In Supabase: run `supabase/01_…` through `16_…` in order (10 and 11 must be
two separate runs). Then deploy the two Edge Functions (see
`PRODUCTION_CHECKLIST.md`). Deploying to Vercel and the pre-launch list are
in the same file.
