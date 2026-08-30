# Productivity Dashboard

A personal dashboard for tasks and habits. Next.js 14 (App Router) on Vercel,
with Neon Postgres for persistence.

- **Overview** — open/overdue/completed counts, tasks completed over the last 14
  days, habit consistency over the last 16 weeks, and what is due right now.
- **Tasks** — add, complete, reopen, and delete, with priority and due dates;
  filter by open / done / all.
- **Habits** — daily check-offs with current streak and a 30-day count.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 14, App Router | Server Components read the database directly; Server Actions handle writes with no API layer |
| Database | Neon Postgres via `@neondatabase/serverless` | HTTP driver, so it works from serverless functions without connection pooling |
| Styling | Plain CSS with custom properties | No build step, no framework weight, light and dark from one set of tokens |
| Auth | One password, HMAC-signed cookie | See [Access](#access) |

There is no client-side state library and no data-fetching library: every page
is a Server Component that queries Postgres and renders. The only client
component is the nav, which needs the current path.

## Setup

### 1. Create the Neon database

1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string from **Dashboard → Connection Details**. It looks
   like `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.

### 2. Configure the environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | The Neon connection string |
| `DASHBOARD_PASSWORD` | The password that unlocks the dashboard |
| `AUTH_SECRET` | A long random string used to sign the session cookie |
| `APP_TIMEZONE` | Your IANA timezone, e.g. `America/New_York` |

Generate a secret with:

```bash
node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

`APP_TIMEZONE` matters more than it looks. Postgres and Vercel both run in UTC,
so a task you finish at 9pm in New York is already tomorrow in UTC. Every
day-bucketing query converts to this timezone first, so leaving it as `UTC`
while living somewhere else will file evening activity under the wrong day and
break streaks.

### 3. Create the tables

```bash
npm install
npm run db:init          # add --seed via `npm run db:seed` for example rows
```

`db/schema.sql` is idempotent — re-running it is safe.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000 and sign in with `DASHBOARD_PASSWORD`.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, and import the repository.
3. Under **Storage**, either attach a Neon integration (which sets
   `DATABASE_URL` for you) or add `DATABASE_URL` manually.
4. Add `DASHBOARD_PASSWORD`, `AUTH_SECRET`, and `APP_TIMEZONE` under
   **Settings → Environment Variables**, for all three environments.
5. Deploy. If the database is new, run `npm run db:init` locally against the
   same `DATABASE_URL` first — the app does not create its own tables.

No `vercel.json` is needed; the defaults detect Next.js correctly.

## Access

Deploying this puts it on the public internet, so it ships with a door: a single
shared password, and a session cookie signed with HMAC-SHA256 (`AUTH_SECRET`) so
it cannot be forged. Middleware gates every route except `/login`. The cookie is
HttpOnly, SameSite=Lax, and Secure in production; sessions last 30 days.

What this is not: multi-user auth. There are no accounts, no per-user data, and
no password reset. It is the right size for one person's dashboard and the wrong
size for anything shared. If more than one person needs their own view, replace
`src/middleware.ts` and `src/lib/auth.ts` with a real provider (Auth.js, Clerk)
and add a `user_id` column to each table.

## Schema

```
tasks          id, title, notes, priority (1 high – 3 low), due_date,
               completed_at, created_at
habits         id, name, created_at, archived_at
habit_entries  habit_id → habits, entry_date, created_at
               primary key (habit_id, entry_date)
```

Dates you pick (`due_date`, `entry_date`) are stored as `date` — calendar days,
not instants. `completed_at` is a `timestamptz` because it records a moment, and
is converted to `APP_TIMEZONE` before being reduced to a day for charts.

The `(habit_id, entry_date)` primary key means checking a habit off twice in one
day is a no-op rather than a duplicate.

## Charts

Both charts are server-rendered inline SVG — no charting library. Each is a
single series, so both use one sequential hue rather than a categorical palette,
and neither needs a legend. The four heatmap steps were checked against a
palette validator in both light and dark for monotone lightness, adjacent
lightness gaps, and contrast against their surface; the values are commented in
`src/app/globals.css`. Every chart also has a "View as table" disclosure, so no
value is available only through color.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:init` | Apply `db/schema.sql` |
| `npm run db:seed` | Apply the schema and insert example rows |

## Known issue: Next.js 14 security advisories

This is pinned to Next.js 14.2.35, the latest 14.x release. `npm audit` still
reports open high-severity advisories against the whole 14.x line — cache
poisoning, request smuggling, and several DoS vectors — and there is no patched
14.x that clears them. The only fix npm offers is Next.js 16.

Next 14 was the stated requirement, so that is what this is built on. If you
want the advisories cleared, upgrading is a small change: the App Router,
Server Actions, and middleware APIs used here all carry forward, so it is
mostly `npm install next@16 eslint-config-next@16` plus a build. Worth doing
before this is exposed to anything sensitive.
