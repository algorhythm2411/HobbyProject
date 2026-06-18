# 🏆 DILR Arena

> Gamified DILR practice for CAT aspirants — solve sets under time pressure, earn XP, beat your rival, and climb the leaderboard.

Inspired by LeetCode, built for the one section that separates 95 percentilers from 99 percentilers.

---

## Tech stack

| Layer      | Choice                          | Why                              |
|------------|---------------------------------|----------------------------------|
| Framework  | Next.js 14 (App Router)         | API + frontend in one repo       |
| Database   | MongoDB Atlas (free 512 MB)     | Flexible schema for DILR sets    |
| Auth       | NextAuth.js v4 + Google OAuth   | One-click sign-in, free          |
| Styling    | Tailwind CSS                    | Fast, dark-mode ready            |
| Hosting    | Vercel (frontend) + free tier   | Deploy from GitHub in 2 minutes  |

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo>
cd dilr-arena
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in these three things (see below for how to get each):

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MONGODB_URI=...
```

### 3. Seed the database

```bash
npm run seed
```

Inserts 2 original sample DILR sets (1 DI table + 1 LR seating) so you have data to work with immediately.

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Setting up Google OAuth (5 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project called **DILR Arena**
3. **APIs & Services → OAuth consent screen** → External → fill in app name
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorised redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://yourdomain.com/api/auth/callback/google` (prod)
5. Copy **Client ID** and **Client Secret** into `.env.local`

---

## Setting up MongoDB Atlas (5 min)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Create a **free M0 cluster** (512 MB, plenty for Phase 1–3)
3. **Database Access** → Add a database user with a password
4. **Network Access** → Add IP `0.0.0.0/0` (allow all — fine for dev)
5. **Connect → Drivers** → Copy the connection string
6. Replace `<password>` and paste into `MONGODB_URI` in `.env.local`

---

## Project structure

```
dilr-arena/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth endpoint
│   │   ├── sets/                    # GET list (filters + pagination)
│   │   ├── sets/[setId]/            # GET one set, answer key stripped
│   │   ├── solve/                   # POST submit attempt, GET result by session
│   │   └── leaderboard/             # GET top 50 + your rank
│   ├── dashboard/                   # Protected dashboard
│   ├── sets/                        # Set browser (filter pills)
│   ├── solve/[setId]/               # Game screen (timer + questions)
│   ├── solve/[setId]/result/        # Post-solve breakdown
│   ├── leaderboard/                 # Full leaderboard (auto-refreshing)
│   ├── globals.css
│   ├── layout.jsx                   # Root layout + session provider
│   └── page.jsx                     # Public landing page
├── components/
│   ├── SessionProvider.jsx          # Client-side NextAuth wrapper
│   ├── SignInButton.jsx
│   └── SignOutButton.jsx
├── lib/
│   ├── auth.js                      # NextAuth config + callbacks
│   ├── levels.js                    # XP → level system (6 tiers)
│   ├── mongodb.js                   # Cached Mongoose connection
│   └── scoring.js                   # CAT scoring + XP calculation
├── models/
│   ├── DilrSet.js                   # DILR set schema
│   ├── SolveSession.js              # Per-attempt record
│   └── User.js                      # User + game stats
└── scripts/
    └── seed.js                      # Database seeder
```

---

## Adding new DILR sets (Phase 4 plan)

No Claude API integration for now — to keep this free, sets are generated manually:

1. Open Claude (web/app) and prompt it to generate a DILR set as JSON matching the `DilrSet` schema (see format below).
2. Save the JSON file(s) to a shared Google Drive folder.
3. A small import script (Phase 4) pulls files from that Drive folder via the Drive API and upserts them into MongoDB using `driveFileId` as the dedupe key — so re-running the import is safe.
4. Community-submitted sets follow the same JSON shape, tagged `source: "community"`.

---

## Adding PYQ sets

CAT question papers (2017–2024) are publicly released by IIMs after each exam.
You can find them on the official CAT website and IIM Ahmedabad's resources page.

Format a PYQ set as:

```json
{
  "title": "Set title",
  "category": "DI",
  "type": "table",
  "source": "pyq",
  "year": 2023,
  "slot": 1,
  "difficulty": 3,
  "timeLimit": 600,
  "passage": "...",
  "dataTable": [["Header1", "H2"], ["Row1C1", "R1C2"]],
  "questions": [...]
}
```

Then add it to `scripts/seed.js` → `SAMPLE_SETS` array and re-run `npm run seed`.

---

## Build roadmap

- [x] **Phase 1** — Auth, DB schemas, landing page, scoring engine
- [x] **Phase 2** — Set browser, timer UI, leaderboard, score submission
- [ ] **Phase 3** — Streaks/lives polish, badges, set of the day automation
- [ ] **Phase 4** — Bulk DILR sets generated manually via Claude (web/app), exported as JSON and uploaded to Google Drive for the app to fetch; open to community submissions
- [ ] **Phase 5** — Clans, rivals, weekly tournaments
