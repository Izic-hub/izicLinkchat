# Setup commands

Run these once, from the folder where you want the project to live:

```bash
npm create vite@latest linkchat -- --template react
cd linkchat
npm install
npm install lucide-react react-router-dom @supabase/supabase-js
```

Then:

1. Delete the default `src/App.jsx`, `src/App.css`, and `src/assets/` that Vite generates.
2. Copy every file from this scaffold (`README.md` folder structure) into your new
   `linkchat/` project, keeping the same paths — `src/main.jsx`, `src/App.jsx`,
   `src/lib/supabaseClient.js`, `.env.example`.
3. Copy your 10 downloaded screen files into `linkchat/src/pages/`.
4. `cp .env.example .env` and leave it blank for now — the app runs fine on mock
   data with empty env vars, since no page has been wired to Supabase yet.
5. `npm run dev` and open the printed localhost URL.

Route map once it's running:

| Path | Screen |
|---|---|
| `/` | Landing |
| `/login` | Auth (login tab) |
| `/signup` | Auth (signup tab) |
| `/create` | Create Group |
| `/join/:code` | Join Group |
| `/groups/:groupId` | Group Chat |
| `/groups/:groupId/members` | Group Members |
| `/groups/:groupId/admin` | Admin Dashboard |
| `/profile` | User Profile |
| `/search` | Search & Discovery |
| `/notifications` | Notifications |
| `/dev/states` | Empty/error states reference (not linked in nav) |
