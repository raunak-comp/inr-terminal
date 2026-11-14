# INR Stress Terminal

**Live site:** https://raunak-comp.github.io/inr-terminal/


Macro and corporate balance-sheet stress engine for the Indian rupee.
The Black Swans · MacroMinds 3.0 (live companion to slide 5).

## v2 screens (9, in 4 groups)

| Key | Screen | What you can do |
|---|---|---|
| 1 | Stress Engine | Presets, levers, KPI strip, Monte Carlo fan, crisis meter, plain-English read-out |
| 2 | Transmission Lab | Animated cause-and-effect network (click nodes, "Try it" shocks), Sankey of dollar flows, waterfall, sensitivity tornado, clickable Brent × FPI stress map |
| 3 | Scenario Compare | Overlay up to 4 presets: driver radar, 4-quarter paths, severity table, cost-vs-calm bubble chart, Monte Carlo histogram |
| 4 | Markets | Daily USD/INR (ECB), Brent, reserves, FPI flows + running total, liquidity, RBI corridor |
| 5 | Macro Pulse | Rupee calculator, twin-deficit path, import treemap, outflow waffle, inflation dot plot, vulnerability bullet charts |
| 6 | 2026 Replay | Play / pause / scrub the year with the event tape and synced gauges |
| 7 | Balance Sheets | ECB exposure, hedging cost, refinancing cliff, sector heatmap, liquidity chain, corporate hit |
| 8 | Policy Lab | Ideal-rupee gauge, zone table, scorecard + radar, roadmap, our answer, tripwires |
| 9 | Sources | Data catalogue, editable coefficients, method, source list |

**Simulated news wire** (top bar "WIRE ON/OFF"): every 40–70 s a clearly-labelled SIMULATED headline pops up. "Apply shock" moves the model and shows before → after numbers; "Undo" (or Ctrl+Z) reverts. History lives in the right-rail "Wire" tab. Headlines are invented for demonstration, not real news.

## Stack
Next.js 15 (App Router) · TypeScript strict · Tailwind v4 tokens · TradingView Lightweight Charts · Apache ECharts ·
Zustand with URL sync · Monte Carlo in a Web Worker · cmdk command palette · Framer Motion · Vitest.

## Screens
1. Stress Engine (`/`): presets, sliders, KPI strip, Monte Carlo fan, Crisis Meter, RBI corridor, transmission waterfall, corporate hit, plain-English readout
2. Market Overview (`/overview`)
3. Balance Sheets (`/balance-sheets`)
4. Policy Lab (`/policy`): option rows deep-link into the Stress Engine
5. Sources & Assumptions (`/sources`): editable model coefficients

## Keyboard
`/` or `Ctrl+K` command palette (`GO STRESS`, `PRESET OIL130`, `SET BRENT 125`, `PRESENT`) · `F` presentation mode · `1–5` screens · `Esc` close.

## Shareable scenarios
`/?preset=oil130` · `/?preset=plan&h=4` · `/?rbi=50` · `/?brent=130&fpi=-8&rbi=6`
Preset ids: base, oil130, fed25, book200, stagflation, defend90, plan.

## Data
- Deck snapshot (10 Nov 2026): `lib/data/deck.ts` (team figures, unchanged)
- Live: `/api/market/usdinr` (ECB via Frankfurter, no key) and `/api/market/fred?series=DGS10|DCOILBRENTEU|DTWEXBGS` (needs `FRED_API_KEY`)
- 4 s timeout, 15 min cache, silent fallback to the deck snapshot with an honest status badge.

## Model
`lib/model/` (pure TypeScript). Coefficients in `lib/model/coefficients.ts`. Run tests: `npm test`.

## Run locally
```
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Deploy to Vercel
Import the folder or repo at vercel.com/new (framework auto-detected: Next.js).
Optionally add the env var `FRED_API_KEY`. No other configuration is needed.


## GitHub Pages (static) build

GitHub Pages serves static files only, so the static build fetches USD/INR straight from Frankfurter in the browser and uses deck snapshots for FRED series.

```bash
# from a copy of the project without app/api
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 BASE_PATH=/inr-terminal npx next build
# publish the generated out/ folder (plus an empty .nojekyll file) to the gh-pages branch
```
