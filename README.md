<!-- xonettn -->
<div align="center">

# ⚛️ Mentorship Marketplace

A project by Neal Frazier


![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=three.js&logoColor=white) ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)

![Deploy](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)

</div>

---

## 📋 Overview
This repository is part of Neal Frazier project collection.

## 📦 Tech Stack
- React
- Vite
- Express
- Netlify (deployed)

## 🗂️ Project Structure
```
mentorship-marketplace/
  - netlify
  - public
  - server
  - src
  (34 files total)
```

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (v18+)
- npm or yarn

### 📦 Installation
```bash
git clone https://github.com/1nc0gn30/mentorship-marketplace.git
cd mentorship-marketplace
npm install
```

### 💻 Development
```bash
npm run dev
```

### 🔨 Build
```bash
npm run build
```

### ⚙️ Available Scripts
  npm run dev - vite
  npm run build - tsc -b && vite build
  npm run lint - eslint .
  npm run preview - vite preview
  npm run server - node server/index.js

## 📂 Original README
<details>
<summary>Click to expand original README</summary>

# Unstuck

Tactical office hours with proven builders, marketers, and operators.

**Get unstuck in one call with someone who has already solved your exact founder problem.**

A managed niche marketplace for indie builders, SaaS founders, and creator-founders — not an
"Intro.co for small creators" clone. The differentiation is **trust + specificity**, not scheduling
or payments. Every session is a product, not a random call.

> Concept build. Seed experts are drawn from the CreatorPlaybooks builder network (14 verified
> builders/operators). Booking runs through **Stripe Payment Links (test mode)** via Netlify
> Functions, with signed webhooks. Netlify Forms capture expert applications + leads.

## The core promise

> "Book a working session with someone who has already solved the exact problem you're stuck on."

Outcome-based sessions, not generic advice:
landing page teardown · SaaS idea validation · launch plan · X/content strategy ·
offer/positioning review · first-users strategy · growth audit · newsletter growth call.

## Start narrow — three wedges

1. **Launch & distribution** — launch plan, first-users, growth audit
2. **Landing page / positioning** — teardown, offer/positioning review
3. **Founder content / X growth** — X strategy, newsletter growth call

## How a session works (productized)

1. **Pre-call intake** — tell us what you're stuck on; we match you with the right builder
2. **AI-generated brief** — your expert gets a short brief so the 30 min go straight at your problem
3. **30-minute working session** — a live, tactical call
4. **Post-call action plan** — the exact next moves, in order
5. **Templates & resources** — frameworks and checklists from the call

## Vetting (our moat)

We vet for proof, not polish:
- Proof of work
- Real audience or traction
- Clear niche skill
- Specific outcomes they can help with
- No fake "guru" energy (no income screenshots, no guaranteed-results promises)

## Business model

- **10%** fee when the expert brings their own buyer
- **20–30%** fee when the platform brings the buyer
- Optional expert subscription later

## Pricing (per person · 30-min session)

- **$89** everyone else (rising builders)
- **$249** Lynn · **$259** Jai · **$279** Ash · **$299** Conor (high-status)
- **$449** KP (highest)

## 📦 Stack

- Vite + React 19 + TypeScript
- No CSS framework — hand-rolled neon/sci-fi theme in `src/index.css`
- `lucide-react` icons
- **Stripe** Payment Links (test mode) via **Netlify Functions** (`netlify/functions/`)
- **Netlify Forms** for expert applications + lead capture (`public/forms.html`)

## 🚀 Run locally

```bash
npm install
cp .env.example .env        # fill STRIPE_SECRET_KEY (test) + STRIPE_WEBHOOK_SECRET
npm run dev                 # http://localhost:5186  (frontend)
npm run server              # local API on :4242 (optional; Netlify Functions also work)
stripe listen --forward-to localhost:4242/webhook   # forward webhooks locally
```

## 🚀 Deploy (Netlify)

```bash
netlify deploy --prod --build
```

Set these in the Netlify dashboard / `netlify env`:

- `STRIPE_SECRET_KEY` — Stripe **test** secret key
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen --print-secret`

The SPA's `/api/checkout`, `/api/events`, and `/webhook` are routed to Netlify Functions
via `netlify.toml`. `/webhook` is the Stripe webhook destination (point your Stripe
webhook endpoint at `https://<site>/.netlify/functions/webhook` for live test events).

## 🗂️ Structure

- `src/data.ts` — categories (3 wedges), 8 session types, tiers, and the 14-expert dataset (avatars in `public/mentors/`)
- `src/App.tsx` — intake, wedges, session products, expert grid, booking drawer, mobile drawer, Netlify Forms
- `src/types.ts` — `Expert`, `Category`, `SessionType`, `Tier` types
- `netlify/functions/` — `checkout.mjs` (create Payment Link), `webhook.mjs` (signed), `events.mjs`
- `public/forms.html` — hidden Netlify Forms definitions (`apply`, `lead`)
- `public/success.html` — post-payment confirmation

## 📝 Notes

- Interactions use **document-level event delegation** so they work even where React's synthetic
  event layer is suppressed — see the `useEffect` in `App.tsx`.
- GitHub star/fork links point at `1nc0gn30/mentorship-marketplace`.
- Booking is real Stripe **test mode** — no actual charge is made.

</details>

## 📝 TODO / Roadmap
- [ ] Add unit tests
- [ ] Add LICENSE file
- [ ] Add Dockerfile for containerized deployment
- [ ] Consider adding Tailwind CSS
- [ ] Add CI/CD pipeline
- [ ] Add contribution guidelines (CONTRIBUTING.md)
- [ ] Improve error handling and edge cases
- [ ] Add environment variable documentation
- [ ] Update dependencies to latest versions
- [ ] Add code comments and inline documentation

## 🚀 Deployment
This project is deployed on Netlify. See netlify.toml for configuration.

## 👤 Author
**Neal Frazier** - [@AshAmplifies](https://github.com/1nc0gn30)

## 🔗 Links
- GitHub: https://github.com/1nc0gn30/mentorship-marketplace

---
*This README was enhanced as part of the neals-projects-2026 batch update.*

---

<div align="center">

**[xonettn]** · Built by [Neal Frazier](https://github.com/1nc0gn30) · [@AshAmplifies](https://twitter.com/AshAmplifies)

</div>
