# LINKCHAT — project structure

## Folder layout

```
linkchat/
├── .env.example
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx                 <- routes every screen together
    ├── lib/
    │   └── supabaseClient.js   <- single Supabase client, imported everywhere
    ├── components/             <- (empty for now) shared bits: Avatar, Toast, etc.
    │   └── .gitkeep
    └── pages/
        ├── LandingPage.jsx
        ├── AuthScreen.jsx
        ├── CreateGroupFlow.jsx
        ├── JoinGroupFlow.jsx
        ├── GroupChatInterface.jsx
        ├── GroupMembersPage.jsx
        ├── GroupAdminDashboard.jsx
        ├── UserProfile.jsx
        ├── SearchDiscovery.jsx
        ├── NotificationsPage.jsx
        └── EmptyErrorStates.jsx   <- dev-only reference, not linked from the UI
```

## Setup

1. Run the commands in `SETUP.md` (or just below) once to scaffold + install.
2. Copy the 10 screen `.jsx` files you already downloaded into `src/pages/` —
   their filenames already match what `App.jsx` imports, so no renaming needed.
3. Copy `.env.example` to `.env` and fill in your real Supabase project URL + anon key
   once you create the project (next step, backend).
4. `npm run dev`.

## Why this shape

- **One route per screen** — `App.jsx` is the only file that knows the whole
  app exists; every page component stays self-contained, same as when they
  were single-file previews.
- **`lib/supabaseClient.js`** is the one place a Supabase client gets created.
  Every page will eventually `import { supabase } from '../lib/supabaseClient'`
  instead of using its mock data array — that swap happens page by page.
- **`components/`** is empty on purpose. Right now every screen defines its
  own `Avatar`, badge, etc. inline. Once we start wiring real data, shared
  pieces (Avatar, RoleBadge, Toast) should move here so all screens render
  members/roles identically — worth doing once, not per-screen.


# LINKCHAT — backend package (so far)

## What's in here

```
linkchat-backend/
└── src/
    ├── lib/
    │   ├── auth.js       <- sign up, sign in, sign out, auth state
    │   ├── groups.js     <- create/join/list groups, invite codes
    │   ├── messages.js   <- fetch, send, realtime subscription, typing
    │   ├── members.js    <- roster, roles, mute/remove/ban
    │   └── profiles.js   <- get/update profile, search
    └── pages/
        └── AuthScreen.jsx  <- the only page wired to real backend calls so far
```

This is not a standalone project — it's meant to be merged into your existing
`linkchat-scaffold` project, matching the folder structure it already has.

## How to merge it

1. Unzip this.
2. Copy everything inside `src/lib/` here into your project's `src/lib/`
   (next to the `supabaseClient.js` that's already there — don't replace
   that file, just add these five alongside it).
3. Copy `src/pages/AuthScreen.jsx` here into your project's `src/pages/`,
   **overwriting** the existing `AuthScreen.jsx`.
4. Nothing else changes — `App.jsx`, `main.jsx`, and the other 9 page files
   stay exactly as they are.

## What still needs `.env`

Every function in `lib/` calls the shared Supabase client, so none of this
does anything until your project's `.env` has real values:

```
VITE_SUPABASE_URL=https://nhqkgzxwwcghizlafiey.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kT3dvpAtiqdpx2M4kcw6yQ_ol_Yea62
```

Restart `npm run dev` after editing `.env` — Vite only reads it on startup.

## What's wired vs. what's still mock data

| Page | Status |
|---|---|
| AuthScreen | ✅ Wired — real sign up / sign in |
| CreateGroupFlow | ⏳ Still mock data — next up |
| JoinGroupFlow | ⏳ Still mock data |
| GroupChatInterface | ⏳ Still mock data |
| GroupMembersPage | ⏳ Still mock data |
| GroupAdminDashboard | ⏳ Still mock data |
| UserProfile | ⏳ Still mock data |
| SearchDiscovery | ⏳ Still mock data |
| NotificationsPage | Not backed by a `notifications` table yet — schema.sql doesn't include one |

As each page gets wired, it'll come with the same treatment: updated file +
this table updated so it's always clear what's real and what's still mock.
