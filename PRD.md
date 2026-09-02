# Captain Fallacy — Product Requirements Document

**Version:** 1.0 (draft for build)
**Status:** Ready for implementation
**Author:** Andy Bryant (spec) · drafted with Hermes
**Last updated:** 2026-09-01
**Source spec:** Logseq — `💼 Projects/2026/🦸🏼‍♂️ Captain Fallacy game`

---

## 1. Overview

Captain Fallacy is a **web app that teaches critical thinking and debating skills** to older kids and adults through study, worked examples, and quizzes built around 24 well-known logical fallacies. It is themed around a fictional comic-book superhero, **Captain Fallacy**, who anchors the UX and gives the learning a fun, game-like identity.

The defining technical feature: under the hood the app makes **live LLM calls** to generate fresh, original fallacy examples and quiz questions on random topics, so the experience stays new every session rather than cycling a fixed question bank.

- **Audience:** older children and adults (roughly 12+).
- **Primary platform:** desktop (text blocks are substantial). Responsive down to tablet/mobile, but desktop is the design target and QA priority.
- **Monetisation:** none in v1. Premium modes are a possible future direction if the app gains traction.
- **Tone:** fun, cartoony, but not childish.

### 1.1 Goals

1. Make the 24 fallacies genuinely learnable through three complementary modes (Study, Flashcards, Quiz).
2. Keep content fresh and replayable via on-demand LLM generation.
3. Ship a polished, characterful, desktop-first experience that feels like a game, not a worksheet.

### 1.2 Non-goals (v1)

- No user accounts, login, or cloud sync.
- No global/shared leaderboards (local high scores only).
- No monetisation or payments.
- ANALYZE mode is **not built** — it ships visible but disabled as a roadmap signal.
- No mobile-native app (web only).

---

## 2. Key decisions (resolved with stakeholder)

| Topic | Decision |
|---|---|
| **LLM key security** | Serverless **proxy endpoint**. The API key lives server-side only; the browser calls the app's own `/api/generate` route, never OpenRouter directly. The key is **never** shipped in the client bundle. |
| **LLM provider/model** | OpenRouter. Model slug: **`deepseek/deepseek-v4-flash`**, held in a single configurable value (`LLM_MODEL`) so it can be swapped without code changes. |
| **Hosting / deploy** | **Railway** (railway.app) with automated deploys from the GitHub repo. |
| **Tech stack** | **React + Vite + TypeScript** SPA frontend; lightweight **Node (Hono/Express) backend** serving static assets and the `/api/generate` proxy. Single deployable service. *(Rationale in §6.1.)* |
| **Responsiveness** | Desktop-first, gracefully responsive down to tablet/mobile. |
| **Fallacy data** | Seeded now from the poster — 24 fallacies scraped and shipped as `data/fallacies.json` (this deliverable). |
| **Persistence** | Browser **localStorage** only (high scores + flashcard proficiency state). |
| **Placeholder art** | Neutral generated/placeholder graphics with clear filenames. **Not** Captain Planet (trademarked) — real assets to be supplied later by stakeholder. |
| **ANALYZE mode** | Visible but greyed-out/disabled in v1. |

---

## 3. Personas & use cases

- **The self-improver (adult):** wants to sharpen argument skills; uses Study to read up, then Quiz to test themselves.
- **The student (teen):** drilling for a critical-thinking/debate class; uses Flashcards to memorise names and definitions.
- **The casual competitor:** enjoys the Quiz as a game, chasing a high score.

---

## 4. Information architecture & navigation

```
HOME
├── QUIZ ──────── START ──► Quiz game (15 Qs) ──► Score screen ──► (Retry | Back)
│                └── HIGH SCORES ──► local scores table
├── FLASHCARDS ── DRILL NAMES  ──► flashcard loop
│                └── DRILL EXAMPLES ─► flashcard loop
├── STUDY ─────── fallacy list ──► Fallacy detail page (Prev/Next between fallacies)
├── ANALYZE ───── (disabled — "Coming soon")
└── About ─────── Mission / Values / Feedback / Support Us
```

**Global navigation rules**
- Every non-home screen has a **Back button in the top-left**. Back goes one level up the tree (mode pages → Home; in-mode screens → their mode page).
- Screen transitions use a **horizontal carousel/wipe-left animation** as the primary motion motif (used on Home→mode, quiz question advance, flashcard advance, study detail navigation).
- Each mode page shows a **distinct mascot image** of Captain Fallacy (different pose/expression per mode).

---

## 5. Feature specifications

### 5.1 Home page

- **Hero image** of Captain Fallacy (large, characterful).
- **Title:** "Captain Fallacy".
- **Subheading slogan** (placeholder copy, editable): e.g. *"Spot the trick. Win the argument."*
- **Primary navigation buttons** (blocky, game-style), in order:
  1. **QUIZ** — "test your knowledge with generated examples"
  2. **FLASHCARDS** — "drill the fallacies using Anki-style flashcards"
  3. **STUDY** — "read about different fallacies with descriptions and worked examples"
  4. **ANALYZE** — "Captain Fallacy will critique external content!" *(disabled, "Coming soon" badge)*
- **About** — smaller, lower-visibility link (e.g. footer or corner).

### 5.2 QUIZ

**Quiz landing page**
- Distinct mascot image, short description.
- Buttons: **START**, **HIGH SCORES**. Back button top-left → Home.

**Quiz game loop** (START)
- **15 multiple-choice questions.** Progress shown by a **progress bar** and a **"13/15"-style counter**.
- Each question: the user reads a generated **statement/short paragraph** that commits one fallacy, then picks which of **4 fallacy options** it commits.

**Per-question generation logic (under the hood):**
1. Randomly select the **subject fallacy** from the fallacy database.
2. Select **3 distinct incorrect** fallacies from the database as distractors.
3. All fallacies carry **equal weighting** in v1. *(Future: weighting system to bias selection; clustering via `similarities` so similar fallacies appear together for difficulty.)*
4. Make an **LLM call** (via `/api/generate`) to produce a **short-paragraph example** that commits the subject fallacy, on a **completely random topic** each time.
5. Display the paragraph plus the four fallacy options as buttons (option order randomised).
6. **Prefetch the next question** (pick fallacies + generate its example) **while the current one is on screen**, held in memory to hide latency.
7. On answer: **visual feedback** — green highlight for correct, red for the wrong pick **and** green on the correct answer if the user was wrong. A **Continue** button appears beneath. Score is tallied but **not displayed** during play.
8. **Continue** slides everything off-screen left (carousel style) to reveal the next question. **No going back.**
9. After 15 questions → **score screen**.

**Score screen**
- Shows final score with a **commensurate comment** and an image of Captain Fallacy whose **emotion is tiered by score** (e.g. dejected → neutral → pleased → triumphant).
- Option to **enter a name** for the high-score table, or cancel.
- Buttons: **Back** (→ Quiz landing) and **Retry** (→ new quiz).

**High Scores**
- Scrollable local high-scores table (name + score). Stored in localStorage.
- *(Future: optional global leaderboard.)*

**Scoring tiers (initial proposal — tune in build):**
| Score (of 15) | Tier | Mascot emotion |
|---|---|---|
| 0–5 | "Fallacy fodder" | dejected |
| 6–9 | "Getting sharper" | neutral |
| 10–12 | "Sharp thinker" | pleased |
| 13–15 | "Fallacy-proof!" | triumphant |

### 5.3 FLASHCARDS

**Flashcards landing page**
- Distinct mascot image, short description.
- Buttons: **DRILL NAMES**, **DRILL EXAMPLES**. Back top-left → Home.

**Flashcard loop**
- **DRILL NAMES:** front shows the **name** (e.g. "AD HOMINEM", "SLIPPERY SLOPE"); first tap reveals the **description**.
- **DRILL EXAMPLES:** front shows the **description** (e.g. "Attacking your opponent's character…"); first tap reveals the **name**.
- The description side also has an **"Example" link** that expands into the longer static example text (from the database).
- **Second tap** does **not** advance immediately. On reveal, a **"Were you right?"** prompt appears with two buttons: a **check (✓)** and a **cross (✗)**. The user self-rates whether they recalled the answer correctly.
  - This self-rating **feeds the proficiency algorithm** (✓ raises proficiency for that fallacy, ✗ lowers it).
  - Selecting either button slides the card off-screen left (carousel) and reveals the next card.
- Loop is **endless** until Back (smaller, always top-left) → returns to Flashcards page.
- **All content is static** (from the fallacy database) — **no generative content** in flashcards.

**Anki-style proficiency algorithm**
- A per-fallacy proficiency model is updated by the user's **✓ / ✗ self-rating** on each card reveal, tracking weaker vs. stronger recall.
- **Weaker fallacies probabilistically appear more often.**
- State persists in localStorage.
- *v1 algorithm:* maintain a per-fallacy proficiency weight. A **✓** increases proficiency (fallacy shown less often); a **✗** decreases it (shown more often). Next-card selection is weighted-random, inversely proportional to proficiency, so weak fallacies resurface sooner. Simple, transparent, and driven entirely by the explicit self-rating — no hidden recency heuristics needed.

### 5.4 STUDY

**Study landing page**
- Distinct mascot image, short description.
- **Vertically scrollable array of buttons**, one per fallacy, each with **name + icon** (e.g. "SLIPPERY SLOPE"). All 24 visible by scrolling. Back top-left → Home.

**Fallacy detail page** (enter via wipe-left)
- **Icon image**
- **Fallacy name** (title)
- **Fallacy description** (subheading)
- **Fallacy example** (body text) — the static example from the database.
- **NEW RANDOM EXAMPLE** button — replaces the displayed example with a fresh **LLM-generated** example of the same fallacy (random topic), after a loading spinner.
- **NEW CUSTOM EXAMPLE** button — replaces the example with a fresh LLM-generated example of the same fallacy **based on user-entered keywords**. A text input appears directly beneath this button, grey placeholder "custom keywords", **100-char max**. If non-empty, the keywords are injected into the prompt with instructions to steer the example's topic toward them.
- **Previous / Next** buttons at the bottom to move between fallacies (stay within detail view).
- Back button top-left → Study page.

### 5.5 ANALYZE (disabled in v1)

- Button/section present on Home but **greyed-out** with a "Coming soon" badge.
- Concept (for roadmap): user pastes external content and Captain Fallacy critiques it for fallacies. Not implemented in v1.

### 5.6 About page

- Distinct mascot image.
- Sections: **MISSION**, **VALUES**, **FEEDBACK**, **SUPPORT US**.
- Back top-left → Home.
- Must include **attribution** for the fallacy dataset (yourlogicalfallacyis.com, CC BY-NC) — see §9.

---

## 6. Technical design

### 6.1 Stack (chosen — "pick what's best")

- **Frontend:** React + **Vite** + **TypeScript** (fast SPA, huge ecosystem, ideal for this component-driven UI).
- **Styling:** Tailwind CSS with a small custom theme (blocky titles, readable body). *(Swappable for CSS Modules if preferred at build.)*
- **Animation:** Framer Motion for the carousel/wipe transitions and card flips.
- **Backend:** Minimal **Node** service using **Hono** (or Express) that:
  - serves the built static frontend, and
  - exposes `POST /api/generate` as the OpenRouter proxy.
- **Single deployable** service on Railway (frontend built to static assets, served by the same Node process) — keeps the proxy and the app same-origin, simplest deploy.
- **Language rationale:** widely supported, strong TS typing across the fallacy schema, first-class Railway support.

### 6.2 Repository

- **GitHub, public**, under the **AndyJBryant** handle.
- Suggested structure:
```
captain-fallacy/
├── data/
│   ├── fallacies.json            # seeded 24-fallacy dataset (this deliverable)
│   └── fallacies-poster.pdf      # source poster (reference)
├── PRD.md                        # this document
├── src/                          # React app
│   ├── pages/                    # Home, Quiz, Flashcards, Study, About
│   ├── components/
│   ├── game/                     # quiz engine, flashcard/Anki algorithm
│   ├── lib/                      # llm client, storage, selection logic
│   └── data/                     # import of fallacies.json + types
├── server/                       # Node proxy + static serving
│   └── api/generate
├── public/assets/
│   ├── mascot/                   # Captain Fallacy poses (placeholders)
│   └── fallacies/                # 24 fallacy icons (placeholders)
└── ...config
```

### 6.3 LLM integration

- **Proxy pattern (required):** browser → `POST /api/generate` → server adds `Authorization: Bearer $OPENROUTER_API_KEY` → OpenRouter. Key from a server-side env var (`OPENROUTER_API_KEY`), set as a Railway secret. **Never** exposed to the client.
- **Model config in one place:** a single server-side constant/env var (`LLM_MODEL`) holds the model slug so it can be changed without touching call sites.
  - **Action for build:** set `LLM_MODEL` to **`deepseek/deepseek-v4-flash`** (confirmed slug). Single source of truth so it can be swapped without touching call sites.
- **Request types** (server validates and shapes the prompt; client only sends structured params, never raw prompts, to reduce abuse):
  1. `quiz_example` — input: `{ fallacyId }` → returns a short paragraph committing that fallacy on a random topic.
  2. `study_random` — input: `{ fallacyId }` → fresh example, random topic.
  3. `study_custom` — input: `{ fallacyId, keywords }` (keywords ≤100 chars) → fresh example steered toward keywords.
- **Prompt design:** server builds prompts from a template using the fallacy's name + description + detail from `fallacies.json`, instructing the model to (a) commit exactly that fallacy, (b) keep it to a short paragraph, (c) pick a random everyday topic (or the supplied keywords), (d) not name the fallacy in the text. Store templates server-side.
- **Resilience:** loading spinners on all generative actions; on error, fall back to the **static** example (Study) or a cached/pre-generated example (Quiz), and surface a subtle retry. Quiz prefetch (§5.2) hides normal latency.
- **Abuse/cost guards (v1, lightweight):** basic per-IP rate limiting on `/api/generate`; keyword input sanitised and length-capped server-side; timeouts on upstream calls.

### 6.4 Data model — fallacy database

Shipped as `data/fallacies.json` (24 records). Per-record schema:

| Field | Type | Notes |
|---|---|---|
| `id` | string (slug) | stable identifier, e.g. `slippery-slope` |
| `name` | string | display name (rendered UPPERCASE in UI) |
| `image` | string | relative path to icon asset |
| `description` | string | one-line summary (flashcard front / detail subheading) |
| `detail` | string | explanatory paragraph (Study body; also feeds LLM prompt context) |
| `example` | string | static worked example |
| `weighting` | number | selection weight; **1** for all in v1 |
| `similarities` | array | future clustering: `[{ id, weight }]`; **empty** in v1 |

> **Note:** the spec's schema didn't include `detail`, but the poster provides an explanatory paragraph distinct from the one-line description and the example. It's included because it strengthens both the Study detail page and the LLM prompt context. Drop or hide it if undesired.

### 6.5 Persistence (localStorage)

- `cf.highscores` → array of `{ name, score, date }`, sorted desc, capped (e.g. top 50).
- `cf.flashcards.proficiency` → per-fallacy proficiency/weight state for the Anki algorithm.
- Namespaced keys, versioned, with safe migration/defaults if absent or malformed.

---

## 7. Design & theme

- **Character:** Captain Fallacy — a Superman-style superhero parody, **slightly nerdy**: blonde hair, glasses, a goofy cape. Reference assets to be generated later by stakeholder.
- **Visual reference for overall theme:** the yourlogicalfallacyis.com fallacies poster (fun, clean, characterful).
- **Style rules:** fun and cartoony but not childish; **very readable typeface**; colourful but **not "fruit salad"** (a disciplined palette); **blocky titles**; game-like buttons.
- **Layout:** optimised for desktop (text blocks are dense); responsive down to tablet/mobile.
- **Motion:** carousel/wipe-left transitions between screens and cards; green/red answer feedback; spinners for generative waits; tiered mascot emotion art on the score screen.
- **Assets:** placeholder mascot poses (one per mode + score-screen emotion set) and 24 placeholder fallacy icons, each with intuitive filenames, so real art can be dropped in later. **No trademarked characters.**

---

## 8. Analytics & success metrics (proposal)

Not required by spec; lightweight suggestions for post-launch:
- Quizzes started vs. completed; score distribution.
- Flashcard sessions and per-fallacy weak spots (aggregate).
- Study "new example" generations per fallacy.
- LLM call volume, latency, error rate, and cost.

---

## 9. Legal & attribution

- **Fallacy content** is derived from **yourlogicalfallacyis.com** ("Thou shalt not commit logical fallacies"), licensed **Creative Commons BY-NC 3.0**. The app is **non-commercial** (no premium plans) and must **attribute** the source on the About page — fully compatible. If monetisation is ever introduced later, the **NC clause would need revisiting** (separate licence or rewritten content).
- **Placeholder art** must avoid trademarked characters (no Captain Planet). Use original/neutral placeholders.
- Public GitHub repo: ensure no secrets are committed (`OPENROUTER_API_KEY` only ever a Railway env var; `.env` gitignored).

---

## 10. Open questions / assumptions

| # | Item | Status |
|---|---|---|
| **O-1** | OpenRouter model slug. **Resolved:** `deepseek/deepseek-v4-flash`, set via `LLM_MODEL`. | ✅ Resolved |
| **O-2** | Final slogan and About-page copy (Mission/Values/Feedback/Support Us) — placeholders used. | Needs Andy |
| **O-3** | Flashcard recall signal. **Resolved:** on reveal, a "Were you right?" prompt with ✓/✗ buttons feeds the proficiency algorithm. | ✅ Resolved |
| **O-4** | Content licence (CC BY-NC). **Resolved:** app stays non-commercial (no premium plans), so BY-NC is fully compatible with attribution. Revisit only if monetised later. | ✅ Resolved |
| **O-5** | Quiz scoring tiers, tier labels, and mascot-emotion mapping — initial proposal in §5.2; confirm. | Proposal, tune in build |
| **O-6** | Rate-limiting thresholds and any abuse budget cap for `/api/generate`. | Proposal, tune in build |

---

## 11. Deliverables in this drop

- `PRD.md` — this document.
- `data/fallacies.json` — the seeded 24-fallacy dataset (id, name, image, description, detail, example, weighting, similarities).
- `data/fallacies-poster.pdf` — the source poster, retained for reference.
