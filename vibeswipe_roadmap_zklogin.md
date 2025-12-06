# VibeSwipe – Implementation Roadmap (Frontend-First, zkLogin)

This roadmap is designed so that an LLM can follow it and **immediately start generating code**, phase by phase.

The LLM should always prefer **implementation (code files)** over long prose, unless explicitly asked to explain.

---

## Phase 0 – Project Skeleton

**Goal:** Create a minimal but working multi-folder project layout.

**Expected code outputs:**

- `frontend/` – Next.js + TypeScript app
  - `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js` (if used)
  - `app/` or `src/` structure with a root layout

- `backend/` – Node.js + TypeScript + Express + SQLite
  - `package.json`, `tsconfig.json`
  - `src/server.ts`
  - `src/routes/` folder
  - `prisma/schema.prisma` or equivalent ORM schema

- `contracts/` – Sui Move package
  - `Move.toml`
  - `sources/` folder placeholder

The LLM should produce **real, compilable configs** and initial boilerplate.

---

## Phase 1 – Frontend Auth & Layout (zkLogin + Bottom Nav)

**Goal:** Implement zkLogin screen and the main logged-in layout with bottom navigation.

**Expected code outputs:**

- Frontend:
  - A `/login` (or similar) page with a zkLogin button/component.
  - A global layout for logged-in users that:
    - wraps main content
    - includes a bottom navigation bar with 3 tabs:
      - Tournaments
      - Create
      - Profile
  - A simple auth context/hook to store:
    - `userAddress`
    - `isAuthenticated`
  - Routing:
    - If not authenticated → show login/zkLogin screen.
    - If authenticated → show tournaments tab by default.

zkLogin integration can start as a **mock/stub** for local development, with real zkLogin wiring later.

---

## Phase 2 – Frontend Tournaments Tab (List + Detail + Leaderboard Placeholder)

**Goal:** Implement the UI for listing tournaments and viewing details.

**Expected code outputs:**

- `frontend`:
  - `Tournaments` page/component:
    - fetches tournament list from backend (`GET /tournaments`)
    - displays list (card/table style)
  - `TournamentDetail` page:
    - route e.g. `/tournaments/[id]`
    - shows tournament metadata
    - shows:
      - “Join tournament” button (calls backend `POST /tournaments/:id/join`)
      - If `status == finished`, shows a leaderboard view:
        - table with rank, user, score, rewardAmount
  - State/UX for:
    - loading
    - error
    - empty state (no tournaments)

Backend endpoints can initially return mocked/static data, then be wired to real DB in later phases.

---

## Phase 3 – Frontend Create Tournament Tab

**Goal:** Implement the “Create Tournament” form UI and wire it to a backend API.

**Expected code outputs:**

- `frontend`:
  - `Create` tab/page:
    - form fields:
      - entry fee
      - duration (select options)
    - validation
    - submit button → `POST /tournaments`
    - success handling:
      - either navigate to `TournamentDetail` of the new tournament or back to list.

- Temporary/backend placeholder:
  - Enough of the backend `POST /tournaments` implementation to accept JSON, store in SQLite, and return the created object.

---

## Phase 4 – Frontend Profile Tab

**Goal:** Show user profile, joined tournaments, and links to past leaderboards.

**Expected code outputs:**

- `frontend`:
  - `Profile` tab/page:
    - displays:
      - user address (zkLogin identity, e.g. Sui address)
      - “budget” or simple balance (can be a computed or placeholder value)
    - list of joined tournaments:
      - each with link to its `TournamentDetail` / leaderboard

- `backend`:
  - `GET /profile` endpoint that:
    - identifies user by address (from header, query, or body as per chosen convention)
    - returns:
      - joined tournaments
      - simple stats/budget placeholder

---

## Phase 5 – Backend Data Model & SQLite Wiring

**Goal:** Make the backend persistent and aligned with frontend.

**Expected code outputs:**

- ORM schema (e.g. Prisma `schema.prisma`) with:
  - User
  - Tournament
  - TournamentJoin
  - (optionally Prediction and Score models as stubs)

- Migration / DB init logic (for SQLite).

- Backend API implementations:
  - `GET /tournaments`
  - `GET /tournaments/:id`
  - `POST /tournaments`
  - `POST /tournaments/:id/join`
  - `GET /tournaments/:id/results` (leaderboard data – can be stubbed)
  - `GET /profile`

At this stage scores/leaderboards can be static or simple placeholders until scoring is added.

---

## Phase 6 – Prediction & Scoring Logic (Off-Chain)

**Goal:** Implement prediction storage and scoring off-chain.

**Expected code outputs:**

- Backend:
  - Model updates:
    - `Prediction` model
    - `Score` model
  - Endpoints:
    - `POST /tournaments/:id/predictions` – user submits their predictions.
    - `GET /tournaments/:id/predictions/me` – optional, to view own predictions.
  - A scoring job (script or function) that:
    - For a finished tournament:
      - loads predictions
      - compares against price data (can use dummy oracle at this stage)
      - computes scores and ranks
      - stores them in `Score` table.

Leaderboard endpoint should now reflect real scores from the DB.

---

## Phase 7 – Smart Contract (Sui Move) – Reward Pool

**Goal:** Implement minimal Sui Move contract to hold entry fees and schedule payouts.

**Expected code outputs:**

- `contracts/Move.toml` – valid Sui Move package definition.
- `contracts/sources/reward_pool.move` – Move module with:
  - function to **join** a tournament and send entry fee (associating with tournament_id).
  - storage for per-tournament pool totals.
  - function `payout` that:
    - can only be called by an authorized backend address/capability.
    - distributes funds to winners according to arguments.
    - prevents double payout for the same tournament.

Backend integration with chain calls can be **stubbed** initially (e.g. placeholder Sui SDK client).

---

## Phase 8 – Backend ↔ Smart Contract Integration (Stubbed, Then Real)

**Goal:** Wire backend join/payout flows with the smart contract.

**Expected code outputs:**

- Backend service functions:
  - `joinTournamentOnChain(tournamentId, userAddress, entryFee)` – stub or real Sui call.
  - `payoutWinnersOnChain(tournamentId, winners, amounts)` – stub or real Sui call.

- Routes:
  - Extend `POST /tournaments/:id/join` to:
    - initiate/join on-chain (or at least record tx digest).
  - Extend scoring job:
    - after computing final leaderboard, call payout function (stub or real).

At this stage it is acceptable for chain calls to be mocked for local dev, with the code structured so real Sui integration can be added later.

---

## Phase 9 – UX Polish (Swipe Game, Animations, Better States)

**Goal:** Improve user experience around predictions and game feel.

**Expected code outputs:**

- Frontend:
  - A dedicated prediction/swipe screen for a tournament:
    - e.g. `/tournaments/[id]/play`
    - swipeable cards (up/down prediction) or simpler UI buttons at first.
  - Components for:
    - Loading states
    - Empty states
    - Error toasts/alerts
  - Basic animations (e.g. card slide-out, active tab highlight).

No new backend features are strictly required here; this phase is mostly frontend polish.

---

## Phase 10 – Testing & Hardening

**Goal:** Add basic test coverage and stability improvements.

**Expected code outputs:**

- Backend:
  - Unit tests for:
    - scoring logic
    - tournament filtering (active/finished)
  - Integration tests for:
    - main endpoints (`/tournaments`, `/profile` etc.)

- Frontend:
  - Simple component tests (optional).
  - Test plan for manual E2E testing.

- Contracts:
  - Basic Move unit tests (if desired) for pool logic and payout guard.

---

## LLM Behavior Guidance

When given this roadmap together with the system spec:

- Default behavior:
  - **Generate code**, not more design docs.
  - Use the `/// FILE: path/to/file.ext` header + fenced code blocks in responses when helpful.

- Phase selection:
  - The user will say something like:
    - “Start with Phase 0 and generate the project skeleton.”
    - “Now do Phase 1 frontend auth + layout.”
  - The LLM should only focus on that phase’s deliverables in each response.

This keeps context small and ensures progress is made step by step, with usable code at every phase.
