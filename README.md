# LINKCHAT

A group-chat platform — create a group, share one link, everyone's in the
conversation. Built with React + Vite on the frontend, Supabase
(Postgres, Auth, Realtime, Storage) on the backend.

Live behavior: real-time messaging with edit/delete, image/file/voice
attachments, public and private groups (private ones require host/admin
approval to join), full member management, direct invites, notifications,
4 switchable themes, PWA installability, and a platform-wide Super-Admin
dashboard restricted to one specific account.

## Project structure

```
linkchat/
├── .env.example          ← copy to .env and fill in your own Supabase values
├── package.json
├── vite.config.js         (includes the PWA plugin config)
├── vercel.json             (SPA rewrite rule — needed for client-side routing)
├── index.html
├── public/
│   └── icon.svg
├── supabase/                ← run these in Supabase's SQL Editor, IN ORDER
│   ├── 01_schema.sql          (base tables, RLS, triggers)
│   ├── 02_fix_profile_trigger.sql
│   ├── 03_fix_google_signup_trigger.sql
│   ├── 04_fix_membership_policy.sql
│   ├── 05_fix_phone_privacy.sql
│   ├── 06_fix_delete_policies.sql
│   ├── 07_fix_member_delete_policy.sql
│   ├── 08_fix_leave_and_admin_delete.sql
│   ├── 09_notifications_schema.sql
│   ├── 10_fix_granular_notifications_part1.sql   ← run separately from part 2
│   ├── 11_fix_granular_notifications_part2.sql
│   ├── 12_storage_setup.sql
│   ├── 13_storage_setup_attachments.sql
│   └── 14_superadmin_schema.sql
├── PRODUCTION_CHECKLIST.md   ← current status + what's needed to go live
└── src/
    ├── main.jsx
    ├── App.jsx                 (every route lives here)
    ├── lib/
    │   ├── supabaseClient.js     (the one shared Supabase client)
    │   ├── AuthContext.jsx       (who's logged in, banned/admin flags — app-wide)
    │   ├── ThemeContext.jsx      (active theme — app-wide)
    │   ├── theme.css             (the 4 themes' color tokens + mobile layout fix)
    │   ├── auth.js, groups.js, members.js, messages.js,
    │   │   notifications.js, profiles.js, storage.js, superadmin.js
    │   └── useClickOutside.js
    ├── components/
    │   ├── ThemeSwitcher.jsx
    │   └── MemberProfileModal.jsx
    └── pages/
        ├── LandingPage.jsx, AuthScreen.jsx
        ├── CreateGroupFlow.jsx, JoinGroupFlow.jsx
        ├── GroupChatInterface.jsx, GroupMembersPage.jsx, GroupAdminDashboard.jsx
        ├── UserProfile.jsx, SearchDiscovery.jsx, NotificationsPage.jsx
        ├── SuperAdminDashboard.jsx   (restricted to one account, see below)
        └── EmptyErrorStates.jsx      (dev-only reference sheet, not linked in the UI)
```

## Route map

| Path | Screen | Auth required? |
|---|---|---|
| `/` | Landing | No |
| `/login`, `/signup` | Auth | No |
| `/join/:code` | Join Group preview | No (joining itself needs an account) |
| `/create` | Create Group | Yes |
| `/groups/:groupId` | Group Chat | Yes |
| `/groups/:groupId/members` | Group Members | Yes |
| `/groups/:groupId/admin` | Admin Dashboard | Yes (host/admin of that group) |
| `/profile` | User Profile | Yes |
| `/search` | Search & Discovery | Yes |
| `/notifications` | Notifications | Yes |
| `/superadmin` | Platform Admin | Yes, and only one specific account |
| `/dev/states` | Empty/error states reference | No (not linked anywhere in the UI) |

## Setup (fresh clone)

```bash
npm install
cp .env.example .env
# fill in .env with your Supabase project's URL + anon key
npm run dev
```

Then in Supabase, run everything in `supabase/` in numbered order (see
that folder's own ordering above — 10 and 11 are a matched pair that
must run as two separate executions, not pasted together in one go).

## Deploying

See `PRODUCTION_CHECKLIST.md` for the full pre-launch list (Auth
settings, environment variables on your host, GitHub push, final smoke
test). `vercel.json` already has the SPA rewrite rule Vercel needs for
client-side routing to work on direct page loads/refreshes.
