# NearNest — Nearby Chat

A location-based **DM-only** chat. Users see a list of nearby users (within ~1km) and can message them individually. No public feed. No exact location is ever shown.

Built with **only free resources**:
- **Frontend:** Vite + React + TypeScript
- **Backend:** Supabase (Auth, Postgres, Realtime) — free tier
- **Hosting:** GitHub Pages
- **No paid APIs**

## Tech Stack

- **Auth:** Supabase anonymous sign-in (no email; random handle auto-generated)
- **Database:** PostgreSQL + PostGIS (geospatial queries at DB level)
- **Security:** RLS enforces "nearby only" — `ST_DWithin(geog, 1000m)`
- **Privacy:** Coarse location only (lat/lon rounded to 3 decimals ≈ 100m)
- **Realtime:** Supabase Realtime for new message notifications

---

## Setup (Step-by-Step)

### 1. Create Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose organization, name the project (e.g. `nearnest`), set a DB password, pick a region, then create.

### 2. Enable Extensions

1. In the Supabase Dashboard, go to **Database** → **Extensions**.
2. Enable **PostGIS** (search for `postgis`, enable it).
3. Enable **pgcrypto** (search for `pgcrypto`, enable it).

### 3. Run SQL Scripts

1. Go to **SQL Editor** in the Supabase Dashboard.
2. Open `supabase/schema.sql` in this repo and copy its full contents.
3. Paste into a new query, then **Run**.
4. Open `supabase/realtime.sql` and copy its contents.
5. Paste into a new query, then **Run**.  
6. Open `supabase/migration_dm.sql` and copy its full contents.
7. Paste into a new query, then **Run** (adds DM support and nearby user list).  
   (If you see "already a member" for publications or "already exists" for policies, that's fine.)

### 4. Enable Anonymous Auth

1. Go to **Authentication** → **Providers**.
2. Find **Anonymous sign-ins** and enable it (no email needed; users join with a random handle).

### 5. Configure Auth URLs (optional)

1. Go to **Authentication** → **URL Configuration**.
2. Add your app URLs for Site URL and Redirect URLs (e.g. `http://localhost:5173`, `https://your-app.vercel.app`).

### 6. Add API Keys to the App

1. In Supabase, go to **Project Settings** → **API**.
2. Copy the **Project URL** and **anon public** (or Publishable) key.
3. Copy the config template and add your keys:
   ```bash
   cp src/config.example.ts src/config.ts
   ```
4. Edit `src/config.ts` and replace the placeholders:

```ts
export const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key-or-sb_publishable-key-here";
```

> **Important:** Do not commit real keys if the repo is public. For production, consider environment variables or a separate config. For GitHub Pages, you can use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and set them as repository secrets in GitHub Actions.

### 7. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 8. Deploy to GitHub Pages

1. Create a GitHub repo (e.g. `NearNest`).
2. Set the base path for Vite. In `vite.config.ts`, ensure the base is your repo name:

```ts
const base = process.env.VITE_BASE_PATH || "/";
```

For GitHub Pages, when building use:

```bash
VITE_BASE_PATH=/NearNest/ npm run build
```

(Replace `NearNest` with your repo name if different.)

3. Build and deploy:

```bash
npm run build
```

4. Push the built `dist` folder to the `gh-pages` branch (or use GitHub Actions):

   - **Option A — Manual:**
     ```bash
     npm run build
     npx gh-pages -d dist
     ```
     (Install `gh-pages` first: `npm install -D gh-pages`)

   - **Option B — GitHub Actions:** Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npm run build
           env:
             VITE_BASE_PATH: /NearNest/
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

5. In the repo, go to **Settings** → **Pages**:
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` (or `main` with folder `/docs` if using that setup)
   - Save.

6. Add your Supabase redirect URL for the GitHub Pages URL in **Authentication** → **URL Configuration** (as in step 4).

---

## App Flow

1. **Join:** Click "Join" → anonymous sign-in (no email).
2. **Profile:** Random handle (e.g. `User_a1b2c3d4`) is auto-generated.
3. **Location:** Click "Enable location" → browser asks for permission → coarse location stored.
4. **Nearby users:** See a list of other users within ~1km (their handles only).
5. **DM:** Tap a user to open a direct message conversation. Send and receive messages in real time.
6. **Anti-spam:** 1 message per 1.5 seconds.

---

## Database Schema

- **profiles:** `id` (auth.users), `handle`, `lat_rounded`, `lon_rounded`, `geog` (PostGIS)
- **messages:** `handle`, `body`, `lat_rounded`, `lon_rounded`, `geog`, `created_at`
- **reports:** `message_id`, `reporter_id`, `reason`, `created_at`

RLS ensures:
- Profiles: user reads/writes only their own.
- Messages: insert only with matching profile handle; select only if `ST_DWithin(geog, 1000m)`.
- Reports: authenticated users can insert; no public read (admins can query via service role).

---

## License

MIT
