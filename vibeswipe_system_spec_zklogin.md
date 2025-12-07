# VibeSwipe – System Specification (zkLogin + Sui + Full Stack)

This document is the **authoritative system spec** for the new, clean VibeSwipe implementation.

It is written so that an LLM can read it and **immediately start generating implementation code** (frontend, backend, smart contracts) without needing more high-level design.

---

## 1. High-Level Concept

VibeSwipe is a **crypto prediction tournament game**:

- Users join tournaments by paying an **entry fee**.
- Each tournament has a **duration** (e.g. 15 minutes, 1 hour, 24 hours).
- During the tournament, users make **price direction predictions** (up/down) for different assets.
- When the tournament ends, a **leaderboard** is computed and the **on-chain pool** is distributed to winners based on that leaderboard.

For this first iteration we focus on:

1. A **working frontend** with zkLogin authentication and tournament UI.
2. A **simple backend** that stores users, tournaments, joins, predictions, and results in **SQLite**.
3. A **minimal smart contract** (on Sui) that:
   - receives entry fees,
   - holds a pooled balance,
   - later allows payout based on leaderboard (payout integration can be stubbed initially).

We are *not* implementing a full real oracle or Walrus integration yet. Those come later.

---

## 2. Tech Stack (Target)

The default tech stack the LLM should use when generating code:

### 2.1 Frontend

- **Framework:** Next.js (App Router) + React
- **Language:** TypeScript
- **Styling:** Tailwind CSS (or another simple utility-first framework)
- **Auth:** Sui **zkLogin** (user signs in with zkLogin)
- **State Management:** Simple React state + SWR/React Query or plain fetch as needed

### 2.2 Backend

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express (or a similar minimal HTTP framework)
- **Database:** SQLite (file-based dev DB, via Prisma or another ORM)
- **API Style:** REST JSON endpoints

### 2.3 Smart Contract

- **Chain:** Sui
- **Language:** Move (Sui Move)
- **Role:** Tournament reward pool
  - Accept per-tournament entry fees.
  - Keep separate pool per tournament or one pooled contract with per-tournament accounting.
  - Expose a payout entry function that can be called later by backend (backend address / capability).

---

## 3. Frontend – Screens & Navigation

The frontend is the main focus initially. The UX is mobile-first with a **bottom navigation bar (“bottom box”)** with three tabs:

1. **Tournaments** (default after login)
2. **Create Tournament**
3. **Profile**

### 3.1 Authentication – zkLogin Screen

- On first visit, user sees a **zkLogin screen**:
  - Title: something like “Log in with zkLogin”.
  - Button(s) for zkLogin provider (e.g. “Continue with Google via zkLogin”).
  - On success, frontend gets a zkLogin identity (Sui address or equivalent) and treats this as the logged-in user.
- After successful zkLogin, user is routed to the **Tournaments** tab.

Implementation expectations:

- A dedicated page/screen for zkLogin.
- A reusable `ZkLoginButton` or similar component.
- A simple auth state kept in React (e.g. `useAuth()` hook) with:
  - `userAddress`
  - `isAuthenticated`
- For now, backend can trust the provided user address as a simple prototype. Later, real zkLogin verification can be added.

### 3.2 Global Layout

- After login, the app layout includes:
  - A main content area for each tab.
  - A fixed bottom navigation bar with **three buttons**:
    - **Tournaments**
    - **Create**
    - **Profile**

- The bottom bar:
  - Should highlight the active tab.
  - Should be always visible while logged in.

---

## 4. Frontend – Pages in Detail

### 4.1 Tournaments Tab (List + Navigation)

**Route example:** `/tournaments` (default after login)

Shows a list of **current / upcoming tournaments** with:

- Tournament title or ID
- Entry fee
- Duration
- Current participant count
- Status: `upcoming`, `active`, or `finished`

Each list item has:

- A **“View” / “Details”** button or click area that opens the **Tournament Detail** page.

### 4.1.1 Tournament Detail Page

**Route example:** `/tournaments/[id]`

Shows:

- Tournament metadata:
  - Entry fee
  - Duration
  - Start time / end time
  - Participant count
- Actions:
  - If not joined and tournament not finished:
    - **“Join tournament”** button.
  - If joined and tournament in progress:
    - A link/button to the **prediction gameplay** (for now, this can be a stub screen).
  - If finished:
    - **Leaderboard view** (list of players, their scores, rankings).

Leaderboard:

- At minimum:
  - Rank
  - User address (or truncated)
  - Score
  - Reward amount (even if the payout is not yet wired on-chain, we can show calculated numbers).

### 4.2 Create Tournament Tab

**Route example:** `/create`

- Form fields:
  - **Entry fee** (e.g. in SUI or some unit; string/number)
  - **Tournament duration** (e.g. dropdown: 15m, 1h, 4h, 24h)
- On submit:
  - Calls backend API: `POST /tournaments`
  - Backend:
    - Creates a tournament record in SQLite.
    - Optionally, may also prepare on-chain data later (for now this can be “to be integrated”).

Required UI:

- Validation for required fields.
- Success message and redirect:
  - After creating, redirect user to the new tournament’s detail page or back to the list.

### 4.3 Profile Tab

**Route example:** `/profile`

Shows:

- **Current balance/budget**:
  - For now, this can be a simple number stored in backend or computed based on winnings/losses.
  - Later, can be replaced/linked to on-chain wallet balance.

- **List of joined tournaments**:
  - For each tournament:
    - Name/ID
    - Status: `upcoming`, `active`, `finished`
    - Link to its **leaderboard / result** view.

- From this tab, user should be able to:
  - Tap any past tournament and see its leaderboard.

The Profile tab does **not** need advanced settings yet – just a simple history view + basic stats.

---

## 5. Backend – Responsibilities & Data

The backend is a simple REST API server that:

- Exposes endpoints for:
  - Listing, creating, fetching tournaments
  - Registering a join (tournament participation)
  - Submitting predictions (later)
  - Exposing leaderboard / results
  - Fetching profile info (joined tournaments, simple balance)

- Uses **SQLite** as its persistent storage.

### 5.1 Suggested Core Models (Logical)

At minimum:

- **User**
  - `id` (internal)
  - `walletAddress` or `zkLoginAddress` (Sui address)
  - createdAt

- **Tournament**
  - `id`
  - `creatorId`
  - `entryFee`
  - `durationSeconds`
  - `status` (upcoming/active/finished)
  - `startTime`
  - `endTime`
  - maybe `onChainPoolId` or placeholder

- **TournamentJoin**
  - `id`
  - `userId`
  - `tournamentId`
  - `txDigest` (optional for later on-chain verification)
  - `joinedAt`

- **Prediction** (can be added later)
  - `id`
  - `userId`
  - `tournamentId`
  - `assetSymbol`
  - `predictedDirection`
  - `createdAt`

- **Score / Result**
  - `id`
  - `userId`
  - `tournamentId`
  - `score` (0–10 or similar)
  - `rank`
  - `rewardAmount` (calculated off-chain, even if not yet paid on-chain)

The exact schema can be refined by the LLM as it generates the backend.

---

## 6. Smart Contract – Minimal Requirements

For this stage, the smart contract logic should be **minimal and focused**:

- Chain: **Sui**
- Language: **Move (Sui Move)**

### Responsibilities:

1. **Hold entry fees:**
   - Provide an entry function that allows a user to:
     - specify `tournament_id`
     - send an entry fee (SUI or a token)
   - The contract should track **total pool amount per tournament**.

2. **Guard against double payout:**
   - Once a tournament’s rewards have been distributed, mark it so payout cannot be called twice.

3. **Payout function (backend-triggered):**
   - Backend (with a proper signer/capability) calls a `payout` entry function that:
     - takes `tournament_id`
     - takes a list of winners and amounts
     - transfers coins accordingly
   - For now, contract doesn’t need to know scoring rules – those are strictly off-chain.

We do **not** implement oracle integration on-chain. Price queries stay in backend.

---

## 7. Implementation Expectations for LLM

When an LLM reads this spec:

- It should treat this as the **single source of truth** about what the system does.
- It should generate **implementation code**, not more high-level design text, unless asked.

When asked to implement parts of the system, the LLM should:

- Respect:
  - Frontend structure: zkLogin, 3 tabs (Tournaments, Create, Profile)
  - Backend structure: SQLite, simple REST API
  - Contract structure: pool + payouts
- Prefer:
  - Next.js App Router for frontend pages.
  - TypeScript + Express for backend routes.
  - Sui Move for the reward pool contract.

This spec does **not** constrain file structure too much, but encourages **clear separation** into:

- `/frontend`
- `/backend`
- `/contracts`

The roadmap document will define the recommended order of implementation.
