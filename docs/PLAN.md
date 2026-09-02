# Captain Fallacy — Build Plan, Phases & Review Gates

**Status:** Approved by all four captains + @rick-bot (QA gate). Authored by @rick-bot.
**Companion docs:** `PRD.md` (source spec), `docs/API-CONTRACT.md` (frozen request/response shapes — owned by @captain-backend).
**Rule of the road:** this file and `docs/API-CONTRACT.md` are the **durable source of truth**. Chat is coordination only. When in doubt, re-read the file — never trust a summarised memory of a decision.

---

## 1. Roles & ownership

| Owner | Tree / scope | Deliverables |
|---|---|---|
| **@captain-content** | `data/`, theme tokens, copy, art | `fallacies.json` (24 records), `data/aliases.json` (name-leak list), theme tokens, copy (slogan/About), placeholder mascot poses + 24 fallacy icons, P2 commit-accuracy eval gold set |
| **@captain-backend** | `server/` | `POST /api/generate` OpenRouter proxy, server-side prompt templates, `docs/API-CONTRACT.md`, rate limiting, keyword sanitisation, upstream timeouts, name-leak post-check, Quiz fallback cache pool |
| **@captain-frontend** | `src/` | React + Vite + TS SPA: Home, Study, Flashcards, Quiz, About; carousel/wipe transitions; 15-Q quiz engine + prefetch; Anki proficiency algorithm; localStorage persistence |
| **@captain-release** | repo, CI, deploy | Repo skeleton, `.gitignore` hygiene, CI, Railway single-service pipeline, env-var wiring (`OPENROUTER_API_KEY`, `LLM_MODEL`, rate-limit thresholds), slug health-check, desktop QA across all three modes |
| **@rick-bot** | review / gate | Owns gates G0–G3. Reviews against spec, reproduces defects, signs off. Does not build. |

---

## 2. Phases

### Phase 0 — Foundations *(parallel scaffolding)*
- **@captain-content P0a** *(hard G0 item — critical path):* complete 24-record `fallacies.json` (schema locked per §6.4: `id, name, image, description, detail, example, weighting, similarities`); per-fallacy alias/name-leak list (`data/aliases.json`) — fallacy name + synonyms + Latin/alt names.
- **@captain-content P0b** *(gates frontend, not G0):* theme tokens + copy (slogan, About sections). Canonical mascot: `assets/mascot-captain-fallacy.svg` (approved) — derive icons/poses from it.
- **@captain-backend:** verify OpenRouter slug; write `docs/API-CONTRACT.md` — freeze *request* types + *error* envelope hard; response side **provisional**.
- **@captain-release:** repo skeleton, `.gitignore` hygiene, CI, Railway env-var slots; **define** slug health-check contract (fail loudly on model 404).
- **🚦 Gate G0 (rick-bot):** dataset + aliases complete & schema-valid; slug confirmed (see §4); request/error contract frozen; PLAN.md + API-CONTRACT.md exist. **Downstream build starts only after G0.**

### Phase 1 — Vertical slice (Study)
- **@captain-backend:** `/api/generate` live; static-`example` fallback *mechanism* proven (Study path).
- **@captain-frontend:** Home + Study screen, round-tripping the real contract.
- **@captain-release:** slug health-check goes **live**; throwaway **staging deploy** so the slice runs on real Railway infra.
- **🚦 Gate G1 (rick-bot):** one full request round-trips; forced-upstream-error → static fallback works; health-check passes against verified slug (authenticated completion round-trip); deploys green to staging. **Shared/Study contract fields hard-freeze here.**

### Phase 2 — Full build *(parallel)*
- **@captain-backend:** hardening — rate limits, keyword sanitisation, timeouts, name-leak post-check, Quiz cache pool (pre-generated per fallacy).
- **@captain-frontend:** Quiz engine (15-Q, prefetch N+1), Flashcards (Anki algorithm — zero backend dependency), About, persistence (`cf.highscores`, `cf.flashcards.proficiency`).
- **@captain-content:** commit-accuracy eval gold set — 2–3 reference "good example" texts + known bad/ambiguous per fallacy.
- *First P2 step:* quiz-only contract fields (`requestId`, option-order seed, per-question id) hard-freeze once frontend stubs the quiz engine against them — **before** backend hardens on top.
- **🚦 Gate G2 (rick-bot):** ≥90% commit-accuracy / zero name-leak on the eval sample (§3); throttle-429 → static fallback keeps quiz playable.

### Phase 3 — Release
- **@captain-release:** desktop QA across all three modes (Quiz, Flashcards, Study); repo hygiene (no secrets committed); Railway **production** deploy.
- **🚦 Gate G3 (rick-bot):** final sign-off — nothing ships until satisfied.

---

## 3. Quiz generation acceptance criteria (feeds G2)

**Automated, server-side** (hard reject → regenerate, max 2 retries, then fall back to static `example`):
1. **No name leak.** Generated `text` must not contain the fallacy `name` nor any documented synonym/alias (from `data/aliases.json`). Case-insensitive, whitespace-normalised substring + alias check.
2. **No meta-tells.** Reject output containing "fallacy," "logical," "this argument commits," or option-letter artifacts.
3. **Length/shape sanity.** Within defined char range; single coherent paragraph; no markdown headers or lists.

**Human-judged** (release-blocking sample, not per-request): "does it commit the *named* fallacy" can't be validated cheaply at runtime. Pre-release eval: @captain-backend generates a fixed sample (≥5 examples × all 24 fallacies); @captain-content + @rick-bot score each pass/fail against the static `example` as reference standard.
**Acceptance bar: ≥90% correctly commit the named fallacy with zero name-leaks.** Below that, tune before deploy — never in prod.

---

## 4. Contract freeze schedule (staged, not single-shot)

| When | Frozen |
|---|---|
| **G0** | Request types (`quiz_example` / `study_random` / `study_custom`) + error envelope `{error, retryable}` |
| **G1** | Shared/Study response fields (`{text, fallacyId, source}`), once Study integration consumes them |
| **early P2** | Quiz-only fields (`requestId`, option-order seed, per-question id), once quiz engine stub consumes them |

No field freezes before something has actually consumed it.

---

## 5. Slug status (OpenRouter `deepseek/deepseek-v4-flash`)

- **Provisional-pass:** catalog listing reported present (@captain-backend). Not independently verified by rick-bot (fetch blocked).
- **Hard-close at G1:** authenticated completion round-trip with `OPENROUTER_API_KEY` wired in Railway (@captain-release's health-check + backend's live smoke test).
- **Config note:** the same slug is the primary fallback + auxiliary/compression model in every captain's `~/.hermes/profiles/*/config.yaml`. A dead slug would break those chains too — verifying it at G1 clears both risks at once.

---

## 6. Outstanding decisions needed from Andy (@user)

| # | Item | Blocks |
|---|---|---|
| **O-6** | Monthly cost cap / rate-limit appetite for `/api/generate` — needed for concrete limiter thresholds | G0 close (backend can't set numbers without it) |
| O-2 | Final slogan + About copy (Mission/Values/Feedback/Support Us) | P0b polish (placeholders usable meanwhile) |
| O-5 | Quiz scoring tiers + mascot-emotion mapping | Confirm during Phase 2 build (§5.2 proposal usable) |

---

## 7. Durable-artifact discipline (why these files exist)

Each bot has its own independent context window that compresses over a long chat — decisions held only in chat can silently blur. Therefore: the **contract, dataset schema, alias list, gate criteria, and this plan live in files**. When context compresses, re-read the file, not your memory of it. This is the primary mitigation against multi-agent drift on a long project.
