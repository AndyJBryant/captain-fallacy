# Captain Fallacy — API Contract

**Status:** Partially frozen (see freeze schedule below)  
**Owner:** @captain-backend  
**Companion docs:** `PRD.md` §6.3, `docs/PLAN.md` §4  
**Last updated:** 2026-09-02  

> **Rule:** This file is the durable source of truth for the client↔server interface. Frontend and backend build against it; the chat is coordination only. When in doubt, re-read this file.

---

## 1. Endpoint

```
POST /api/generate
Content-Type: application/json
```

Same-origin (browser never calls OpenRouter directly). The server adds `Authorization: Bearer $OPENROUTER_API_KEY` before forwarding to OpenRouter. The key is a server-side env var only — never in the client bundle.

---

## 2. Request

### 2.1 Shape (🔒 FROZEN at G0)

```json
{
  "type": "<request_type>",
  "fallacyId": "<string>",
  "keywords": "<string | optional>"
}
```

### 2.2 Request types (🔒 FROZEN at G0)

| `type` | Required fields | Optional fields | Description |
|---|---|---|---|
| `quiz_example` | `fallacyId` | — | Short paragraph committing `fallacyId` on a random topic. Used by the quiz engine per-question. |
| `study_random` | `fallacyId` | — | Fresh example, random topic. Used by Study "NEW RANDOM EXAMPLE" button. |
| `study_custom` | `fallacyId` | `keywords` (≤100 chars) | Fresh example steered toward the user-supplied keywords. Used by Study "NEW CUSTOM EXAMPLE" button. |

### 2.3 Field constraints

- `fallacyId`: must be a valid `id` slug from `data/fallacies.json`. Server rejects unknown ids with a 400.
- `keywords` (study_custom only): max 100 chars; server sanitises (strips control chars, normalises whitespace) and length-caps before use. Treated as topic steering only — never interpolated raw into the prompt.

### 2.4 Client rules

- The client sends **structured params only** — never raw prompt text. Prompt construction is entirely server-side.
- The client must not send a `keywords` field on `quiz_example` or `study_random` requests; the server ignores it if present, but it signals a client bug.

---

## 3. Response

### 3.1 Success shape

```json
{
  "text": "<string>",
  "fallacyId": "<string>",
  "source": "live" | "static" | "cached"
}
```

| Field | Type | Notes |
|---|---|---|
| `text` | string | The generated (or fallback) example paragraph. Single coherent paragraph; no markdown. |
| `fallacyId` | string | Echoes the request `fallacyId`. Lets the client correlate async/prefetch responses. |
| `source` | enum | **Always present.** `"live"` = freshly generated; `"static"` = the verbatim `example` field from `fallacies.json` (Study fallback); `"cached"` = pre-generated pool entry (Quiz fallback). Never omitted — every 200 response carries this field, including all fallback paths. |

#### 3.2 Provisional fields — NOT YET FROZEN ⚠️

The following response fields are under discussion for quiz-mode needs. They are documented here as candidates but **must not be relied on by the client yet**. They freeze in early Phase 2 once the quiz engine stub has consumed them:

| Candidate field | Purpose | Freeze point |
|---|---|---|
| `requestId` | Per-request correlation id for prefetch bookkeeping | Early P2 |

> **Note:** Whether the client needs an option-order seed or a per-question id (beyond `fallacyId`) is a decision owned by @captain-frontend. Frontend should flag any additional field needs before early P2 freeze. Once frozen, the shape is final.

---

## 4. Error envelope (🔒 FROZEN at G0)

All errors use HTTP status codes and a consistent JSON body:

```json
{
  "error": "<human-readable message string>",
  "retryable": true | false
}
```

| Scenario | HTTP status | `retryable` |
|---|---|---|
| Invalid `type` | 400 | `false` |
| Unknown `fallacyId` | 400 | `false` |
| `keywords` too long (>100 chars) | 400 | `false` |
| Missing required field | 400 | `false` |
| Rate limit exceeded (per-IP) | 429 | `true` |
| Upstream OpenRouter timeout | 504 | `true` |
| Upstream OpenRouter error (5xx) | 502 | `true` |
| Upstream model 404 (wrong slug) | 502 | `false` |
| Server configuration error | 500 | `false` |

**Client behaviour on error:**
- If `retryable: true`: surface a subtle retry UI; after max retries (client-configurable, suggest 2), fall back to static content with a soft error message.
- If `retryable: false`: do not retry; log and fall back silently.
- Quiz mode: any non-recoverable error during prefetch must fall back to the cached/static example — the quiz must never stall on a generation failure.

---

## 5. Rate limiting (thresholds TBD — pending O-6)

Basic per-IP rate limiting is applied to `POST /api/generate`.

| Parameter | Value | Notes |
|---|---|---|
| Window | 60 seconds | Rolling window |
| Limit (requests/window) | **TBD — awaiting Andy's monthly cost-cap input (O-6)** | Must accommodate 15 quiz questions in a burst without throttling a legitimate player |
| HTTP response on breach | 429 with `{error, retryable: true}` | |

**Design constraint:** a single quiz of 15 questions fires ~15 requests in ~2–3 minutes (prefetch hides latency but doesn't reduce count). The rate limit must be set above 15 req/min per IP to not throttle a legitimate player mid-quiz. Proposed floor: **30 req/min per IP** — but exact number waits on the cost-cap decision.

> **O-6 decision needed from @user:** monthly cost cap appetite → informs maximum requests/window and whether a hard daily budget cutoff is needed. See `docs/PLAN.md` §6.

---

## 6. Server behaviour — prompt construction

The server builds all prompts server-side from a template using the fallacy's `name`, `description`, and `detail` fields from `data/fallacies.json`. The client never sends prompt text.

Template contract (informational — not client-facing):
- Instruct model to commit exactly the named fallacy.
- Keep output to a single short paragraph.
- Pick a random everyday topic (or steer toward `keywords` for `study_custom`).
- Never name the fallacy, its synonyms, or any alias (from `data/aliases.json`) in the generated text.

**Name-leak post-check (server-side, automated):**
After generation, the server checks the output against `data/aliases.json` for the fallacy. If a name or alias appears, the server regenerates (max 2 retries), then falls back to static/cached. This is a hard server-side guard — the client does not implement it.

---

## 7. Model configuration

| Env var | Value | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | (secret) | Wired by @captain-release in Railway; never in client bundle |
| `LLM_MODEL` | `deepseek/deepseek-v4-flash` | Single source of truth; swap without touching call sites |

**Slug status:** provisional-pass (catalog listing confirmed); hard-close at G1 via authenticated completion round-trip. See `docs/PLAN.md` §5.

---

## 8. Freeze schedule summary

| What | Status | Frozen at |
|---|---|---|
| Request types + field names | 🔒 **FROZEN** | G0 |
| Error envelope `{error, retryable}` | 🔒 **FROZEN** | G0 |
| Response `{text, fallacyId, source}` | ⚠️ **Provisional** — freezes after Study integration | G1 |
| Quiz-only fields (`requestId`, etc.) | ⏳ **Pending** — @captain-frontend to flag needs | Early P2 |

---

## 9. Non-contract surface (for reference)

The server also serves the built static frontend (Vite output). That is not part of this API contract — it is a deployment concern owned by @captain-release.
