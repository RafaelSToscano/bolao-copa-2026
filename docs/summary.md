# Bolão Copa 2026 Project Summary

## Overview
- Next.js 16 app using the App Router.
- Client-heavy React SPA focused on a World Cup 2026 prediction pool (bolão).
- Uses Supabase for backend data storage and retrieval.

## Key Technologies
- `next` 16.2.6
- `react` 19.2.4
- `tailwindcss` v4
- `@supabase/supabase-js`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react` icons
- `radix-ui` (via `Slot` in button component)
- `shadcn` style utilities

## Important Files
- `package.json` — dependencies and scripts
- `next.config.ts` — default Next configuration
- `src/app/layout.tsx` — root HTML layout and fonts
- `src/app/page.tsx` — main app page, app logic, and UI
- `src/app/globals.css` — global Tailwind CSS imports and theme variables
- `src/lib/utils.ts` — shared `cn()` utility
- `src/components/ui/button.tsx` — reusable button component
- `src/components/ui/input.tsx` — reusable input component
- `src/components/ui/random-predictor.tsx` — random prediction components

## App Behavior
- Authentication by name + access code
- Stores logged-in user in `localStorage` under `bolao_user`
- Main application tabs:
  - `palpites` — user match predictions
  - `classificacao` — group standings
  - `matamata` — knockout stage bracket
  - `ranking` — leaderboard
  - `admin` — official result entry for admin users
- Random prediction feature in `palpites` tab:
  - Global "Palpites Aleatórios" button generates random predictions for all unlocked games
  - Individual dice buttons on each game row generate predictions for that match only
  - Uses weighted score distribution favoring lower scores (0-2) for realism
  - All random predictions auto-save to Supabase

## Data Model and Backend
- Uses Supabase tables:
  - `players`
  - `games`
  - `predictions`
- Loads data with Supabase client queries on app start
- Saves predictions with `upsert` on `player_id, game_id`

## Business Logic
- Prediction scoring:
  - exact score: 15 points
  - correct match outcome: 7 points
  - correct team score: 2 points each
- Group standings calculated from official scores
- Best third-place ranking calculation
- Knockout stage pairing generation based on group rankings
- Leaderboard sorted by total points and exact scores

## Random Predictor Feature
Provides two ways to generate random match predictions:

### Components
- **`RandomPredictor`** — Bulk predictor button that generates random scores for multiple games
  - Yellow button with dice icon at top of `palpites` tab
  - Generates realistic weighted random scores for all unlocked games
  - Auto-saves all predictions to Supabase
  
- **`SingleGameRandomPredictor`** — Per-game random predictor
  - Small dice button on each game row
  - Generates random prediction for individual match
  - Auto-saves to Supabase immediately

### Score Algorithm
- Uses weighted distribution favoring lower scores:
  - 30% → 0 goals
  - 25% → 1 goal
  - 20% → 2 goals
  - 13% → 3 goals
  - 7% → 4 goals
  - 5% → 5+ goals
- Disabled when phase is locked or game is locked

## Notes
- Environment variables required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Start commands:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
