# Mentor Ledge

Intro.com for the rest of us — a **tiered mentorship marketplace for small creators**,
inspired by @buildwithmaya's idea: real mentorship broken out by **topic** (AI, growth,
marketing, product, design, community, no-code) and by **stage** (cheap early guides →
premium operators), so nobody has to spend $1,000s for 15 minutes with a founder.

> Concept build. Seed data is drawn from the CreatorPlaybooks mentor set (14 verified
> builders/operators). Booking is a UI demo — wire it to Stripe + Cal.com next.

## Stack
- Vite + React 19 + TypeScript
- No CSS framework — hand-rolled neon/sci-fi theme in `src/index.css`
- `lucide-react` icons

## Run
```bash
npm install
npm run dev      # http://localhost:5186
npm run build    # tsc -b && vite build
```

## Structure
- `src/data.ts` — tiers, topics, and the 14-mentor dataset (real avatars in `public/mentors/`)
- `src/App.tsx` — hero, tier ladder, filters, mentor grid, booking drawer, mobile drawer
- `src/types.ts` — `Mentor`, `Tier`, `Topic` types

## Notes
- Interactions are wired with **document-level event delegation** so they work even where
  React's synthetic event layer is suppressed — see the `useEffect` in `App.tsx`.
- GitHub star/fork links point at `1nc0gn30/mentorship-marketplace`.
- Booking and "Become a mentor" are **concept demos** — no real backend yet (Stripe + Cal.com wiring is next).
