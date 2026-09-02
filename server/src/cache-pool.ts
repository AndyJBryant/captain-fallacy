/**
 * Quiz cache pool — pre-generated examples per fallacy.
 *
 * Purpose: when the quiz engine needs an example and the live LLM call fails,
 * it falls back to source:"cached" from this pool rather than the static `example`
 * from the dataset (which the user may have already seen in Study).
 *
 * Strategy:
 * - Pool is populated lazily at server startup (non-blocking — server starts immediately).
 * - POOL_SIZE examples per fallacy (default 3, env: CACHE_POOL_SIZE).
 * - If generation fails for a fallacy during warmup, that fallacy uses source:"static".
 * - Pool entries are served round-robin; used slots are refilled in the background.
 * - Requires OPENROUTER_API_KEY — silently skips warmup if key is not set.
 */

import type { Fallacy, FallaciesData, AliasesData } from "./types.js";
import { systemPrompt, randomTopicPrompt } from "./prompts.js";
import { buildLeakChecker, validateShape } from "./postcheck.js";

const DEFAULT_POOL_SIZE = 3;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 25_000;

interface PoolEntry {
  text: string;
  generatedAt: number;
}

// State
const pool = new Map<string, PoolEntry[]>();
const cursors = new Map<string, number>();
let fallacyMap: Map<string, Fallacy> = new Map();
let checkLeak: ((text: string, fallacyId: string) => boolean) = () => false;
let isWarmedUp = false;

function getPoolSize(): number {
  const n = parseInt(process.env.CACHE_POOL_SIZE ?? "", 10);
  return isNaN(n) || n < 1 ? DEFAULT_POOL_SIZE : n;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Init ────────────────────────────────────────────────────────────────────

export function initCachePool(fallaciesData: FallaciesData, aliasesData: AliasesData): void {
  fallacyMap = new Map(fallaciesData.fallacies.map((f) => [f.id, f]));
  checkLeak = buildLeakChecker(aliasesData);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("[cache-pool] No API key — skipping warmup (quiz falls back to source:\"static\")");
    isWarmedUp = true;
    return;
  }

  // Non-blocking: server starts immediately, pool fills in background
  warmupPool(fallaciesData.fallacies, apiKey)
    .then(() => {
      isWarmedUp = true;
      const filled = [...pool.values()].filter((v) => v.length > 0).length;
      console.log(
        `[cache-pool] Warmup complete — ${filled}/${fallaciesData.fallacies.length} fallacies cached (${getPoolSize()} each)`
      );
    })
    .catch((err) => {
      console.warn("[cache-pool] Warmup error:", err);
      isWarmedUp = true;
    });
}

async function warmupPool(fallacies: Fallacy[], apiKey: string): Promise<void> {
  const poolSize = getPoolSize();
  console.log(`[cache-pool] Warming up ${poolSize} × ${fallacies.length} fallacies (background)...`);

  // Batch of 6 concurrent to avoid hammering the API at startup
  const BATCH = 6;
  for (let i = 0; i < fallacies.length; i += BATCH) {
    await Promise.all(
      fallacies.slice(i, i + BATCH).map((f) => fillPool(f, poolSize, apiKey))
    );
  }
}

async function fillPool(fallacy: Fallacy, target: number, apiKey: string): Promise<void> {
  const existing = pool.get(fallacy.id) ?? [];
  const needed = target - existing.length;
  if (needed <= 0) return;

  const generated: PoolEntry[] = [];
  for (let n = 0; n < needed; n++) {
    const text = await generateOne(fallacy, apiKey);
    if (text) generated.push({ text, generatedAt: Date.now() });
  }

  pool.set(fallacy.id, [...existing, ...generated]);
}

// ─── Generation ──────────────────────────────────────────────────────────────

async function generateOne(fallacy: Fallacy, apiKey: string): Promise<string | null> {
  const model = process.env.LLM_MODEL ?? "deepseek/deepseek-v4-flash";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://captainfallacy.app",
            "X-Title": "Captain Fallacy",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt() },
              { role: "user", content: randomTopicPrompt(fallacy) },
            ],
            max_tokens: 600,
            temperature: 1.0, // higher temp for pool variety
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(tid);
      }

      // Auth failure → abort warmup entirely (no point retrying bad key)
      if (response.status === 401 || response.status === 403) {
        console.warn("[cache-pool] Auth failure — aborting warmup");
        return null;
      }

      if (!response.ok) {
        if (attempt < MAX_RETRIES) { await sleep(1000 * (attempt + 1)); continue; }
        return null;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };

      const rawContent = data?.choices?.[0]?.message?.content;
      if (!rawContent) {
        if (attempt < MAX_RETRIES) continue;
        return null;
      }

      const text = rawContent.trim();
      if (!validateShape(text).ok) {
        if (attempt < MAX_RETRIES) continue;
        return null;
      }
      if (checkLeak(text, fallacy.id)) {
        if (attempt < MAX_RETRIES) continue;
        return null;
      }

      return text;
    } catch {
      if (attempt < MAX_RETRIES) { await sleep(1000 * (attempt + 1)); continue; }
      return null;
    }
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get one cached example for a fallacy.
 * Returns null if the pool is empty for this fallacy (caller uses source:"static").
 * Triggers a background refill after serving so the pool stays topped up.
 */
export function getFromPool(fallacyId: string): string | null {
  const entries = pool.get(fallacyId);
  if (!entries || entries.length === 0) return null;

  const cursor = (cursors.get(fallacyId) ?? 0) % entries.length;
  cursors.set(fallacyId, cursor + 1);
  const entry = entries[cursor];
  if (!entry) return null;

  // Background refill — fire and forget
  const apiKey = process.env.OPENROUTER_API_KEY;
  const fallacy = fallacyMap.get(fallacyId);
  if (apiKey && fallacy) {
    const target = getPoolSize();
    const current = pool.get(fallacyId)?.length ?? 0;
    if (current < target) {
      generateOne(fallacy, apiKey)
        .then((text) => {
          if (text) {
            const existing = pool.get(fallacyId) ?? [];
            existing.push({ text, generatedAt: Date.now() });
            pool.set(fallacyId, existing);
          }
        })
        .catch(() => {});
    }
  }

  return entry.text;
}

/** Returns true once warmup has completed (or was skipped). */
export function isPoolReady(): boolean {
  return isWarmedUp;
}

/** Diagnostic: how many entries are cached per fallacy. */
export function getPoolStatus(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, entries] of pool.entries()) {
    out[id] = entries.length;
  }
  return out;
}
