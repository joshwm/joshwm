## Fantasy Football Dashboard

Compare NFL player and defense (DST) stats side by side across scoring
categories, powered by the [FantasyPros](https://www.fantasypros.com/) API.

### Features

- Filter by position (QB/RB/WR/TE/K/DST), scoring format (Standard / Half /
  Full PPR), and week (full season projections or a specific week 1-18).
- Select up to 8 players/defenses and compare them in a sortable stats table
  and a bar chart, with the best value per category highlighted.
- **Points Allowed by Position** tab: a 32-team heatmap of average fantasy
  points each defense allows to opposing QB/RB/WR/TE, for finding favorable
  start/sit matchups (separate from a single defense's own real points
  allowed, which lives in the Player Comparison tab under the DST position).
- Works immediately on generated mock data with no API key configured.

### FantasyPros API budget handling

This account's FantasyPros key is capped at **50 requests/day**, so the app
is built to spend that budget carefully:

- **On-disk response cache** (`.data/cache/`) - identical queries (same
  season/week/position/scoring) are served from cache for
  `FANTASYPROS_CACHE_TTL_HOURS` (default 12h) before another live call is made.
- **Daily request budget tracker** (`.data/budget.json`) - live calls are
  capped at `FANTASYPROS_DAILY_LIMIT` (default **45**, a few below the real
  50 cap as headroom) and refuse once exhausted, per UTC day.
- **Manual refresh only** - the dashboard fetches once per filter change and
  never polls; a "Refresh data" button is the only way to force a re-fetch.
- **"Force mock data" toggle** - lets you explore the UI freely (new
  positions, scoring formats, weeks) without spending any budget at all.
- If a live call fails or the budget is exhausted, the app transparently
  falls back to mock data with a visible warning banner rather than erroring out.

The budget/cache files are stored under `.data/` (gitignored) using the
filesystem, which is fine for local dev or a single long-running server.
**If you deploy to a serverless platform (e.g. Vercel)**, the filesystem is
ephemeral/read-only outside `/tmp`, so the budget tracker won't persist
across invocations - swap `lib/fantasypros/cache.ts` and `budget.ts` for a
real KV store (Vercel KV, Redis, etc.) before relying on it in production.

### Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set FANTASYPROS_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without an API key set,
the dashboard runs entirely on mock data.

### A note on the FantasyPros field mapping

FantasyPros' `/projections` endpoint response shape in
`src/lib/fantasypros/client.ts` is mapped from their public API
documentation. Since every live call spends part of the 50/day budget, this
mapping hasn't been verified against a real response yet. If live data comes
back with missing/mismatched stats after you add your key, the only place
that needs adjusting is `normalizePlayer()` in that file - everything else
(cache, budget, UI) is decoupled from the exact response shape.

The **Points Allowed by Position** tab is a bigger unknown: that report
isn't documented anywhere in FantasyPros' public v2 JSON API reference, and
may only exist as an HTML page (`fantasypros.com/nfl/points-allowed.php`)
rather than a JSON endpoint at all. `fetchLivePointsAllowed()` in
`client.ts` points at a guessed URL/shape; if it's wrong the app falls back
to mock data automatically with a warning banner rather than breaking, but
you'll want to confirm the real endpoint (check the FantasyPros API docs
under your account, or their partner support) before trusting live numbers
on that tab.

### Project structure

```
src/lib/fantasypros/
  types.ts     Position/scoring/stat-category definitions
  client.ts    Real FantasyPros API call + response normalization
  mock.ts      Deterministic mock data generator
  cache.ts     On-disk TTL cache for live responses
  budget.ts    Daily request budget tracker
  service.ts   Orchestrates cache -> budget -> live call -> mock fallback
src/app/api/
  stats/route.ts    GET ?season&week&position&scoring&source
  budget/route.ts   GET current budget usage
src/components/     Dashboard UI (filters, player picker, table, chart)
```
