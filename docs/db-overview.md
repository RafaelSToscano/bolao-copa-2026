# Database Overview

## How the database is accessed

This app uses **Supabase** as its backend database service.

In `src/app/page.tsx`, the app creates a Supabase client with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

The app uses this `supabase` client to query and update these tables:

- `players`
- `games`
- `predictions`

### Read operations

The main data load happens in `loadData()`:

- `supabase.from("players").select("*")`
- `supabase.from("games").select("*")`
- `supabase.from("predictions").select("*")`

### Write operations

- Predictions are saved with `supabase.from("predictions").upsert(payload, { onConflict: "player_id,game_id" })`
- Official game results are updated with `supabase.from("games").update(...).eq("id", gameId)`

## How the database is used in the app

- `players` stores user records and access codes.
- `games` stores match fixtures, group names, official scores, and lock status.
- `predictions` stores each players predicted scores per game.

From those tables, the app computes:

- user-specific prediction forms and saved drafts
- group standings
- best third-place rankings
- knockout stage qualified teams
- overall ranking by points and exact results

## Clonando dados para staging

Para popular um projeto de staging com os dados de produção, use
`scripts/db-clone.sh`. O passo-a-passo (setup do `.env.clone`, qual
connection string do painel usar, salvaguardas e erros comuns) está
em [`db-clone.md`](./db-clone.md).

## Running migrations

This repository does not include any Supabase migration files, `supabase.toml`, or local database migration scripts.

That means the database schema is not managed from within this codebase, and migrations are not available in the repo itself.

### Recommended approach

If you need to run or manage migrations, use one of these methods:

1. **Supabase Dashboard**
   - Open your Supabase project at `app.supabase.com`
   - Use the SQL editor to create or modify tables
   - Run SQL directly for schema changes

2. **Supabase CLI (external setup)**
   - Install the Supabase CLI if you want local migration management
   - Initialize a Supabase project externally
   - Create migrations with `supabase migration new <name>`
   - Apply them with `supabase db push` or `supabase db reset`

### Sample migration file

This repo now includes an example migration at:

- `supabase/migrations/0001_create_notifications_table.sql`

That file contains a sample Postgres table creation statement for Supabase.

### Running the sample migration

If you use the Supabase CLI:

- install the CLI if needed (`npm install -g supabase` or `brew install supabase/tap/supabase`)
- run `supabase init` in the repo root to create Supabase project config
- link or login to your Supabase project
- run `supabase migration new create_notifications_table`
- copy the SQL below into the generated migration file or use the sample file directly
- run `supabase db push`

### Important note

Because the repo does not include migration config, you should verify the Supabase project schema manually and ensure it contains the expected tables and columns used by this app.

Expected columns by usage:

- `players`: `id`, `name`, `access_code`, `is_admin`, `created_at`
- `games`: `id`, `phase`, `group_name`, `match_order`, `match_date`, `team_a`, `team_b`, `official_score_a`, `official_score_b`, `locked`
- `predictions`: `id`, `player_id`, `game_id`, `predicted_score_a`, `predicted_score_b`
