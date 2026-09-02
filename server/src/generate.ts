/**
 * POST /api/generate — OpenRouter proxy
 * 
 * Contract: docs/API-CONTRACT.md
 * - Validates request (type, fallacyId, keywords length)
 * - Builds prompt server-side (client never sends raw prompt)
 * - Calls OpenRouter with LLM_MODEL env var
 * - Runs name-leak post-check (up to MAX_RETRIES attempts)
 * - Falls back to static example on unrecoverable error
 * - Returns {text, fallacyId, source} on success; {error, retryable} on failure
 */

import { Hono } from "hono";
import type { Fallacy, FallaciesData, AliasesData, GenerateRequest, GenerateResponse, ErrorResponse, RequestType } from "./types.js";
import { systemPrompt, randomTopicPrompt, customTopicPrompt } from "./prompts.js";
import { buildLeakChecker, validateShape } from "./postcheck.js";
import { checkRateLimit } from "./ratelimit.js";

const VALID_TYPES: Set<RequestType> = new Set(["quiz_example", "study_random", "study_custom"]);
const MAX_RETRIES = 2;
const UPSTREAM_TIMEOUT_MS = 20_000; // 20s — generous for flash-tier model

export function createGenerateRoute(
  fallaciesData: FallaciesData,
  aliasesData: AliasesData
) {
  const app = new Hono();
  const fallacyMap = new Map<string, Fallacy>(
    fallaciesData.fallacies.map((f) => [f.id, f])
  );
  const checkForLeak = buildLeakChecker(aliasesData);

  app.post("/", async (c) => {
    // --- Rate limiting ---
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
      c.header("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      return c.json<ErrorResponse>(
        { error: "Too many requests. Please wait a moment.", retryable: true },
        429
      );
    }

    // --- Parse + validate request body ---
    let body: GenerateRequest;
    try {
      body = await c.req.json<GenerateRequest>();
    } catch {
      return c.json<ErrorResponse>({ error: "Invalid JSON body.", retryable: false }, 400);
    }

    const { type, fallacyId, keywords } = body;

    if (!type || !VALID_TYPES.has(type)) {
      return c.json<ErrorResponse>(
        { error: `Invalid type. Must be one of: ${[...VALID_TYPES].join(", ")}.`, retryable: false },
        400
      );
    }

    if (!fallacyId || typeof fallacyId !== "string") {
      return c.json<ErrorResponse>({ error: "Missing required field: fallacyId.", retryable: false }, 400);
    }

    const fallacy = fallacyMap.get(fallacyId);
    if (!fallacy) {
      return c.json<ErrorResponse>(
        { error: `Unknown fallacyId: "${fallacyId}".`, retryable: false },
        400
      );
    }

    // Keywords: study_custom only, max 100 chars, sanitised
    let sanitisedKeywords: string | undefined;
    if (type === "study_custom") {
      const raw = typeof keywords === "string" ? keywords : "";
      if (raw.length > 100) {
        return c.json<ErrorResponse>(
          { error: "keywords must be 100 characters or fewer.", retryable: false },
          400
        );
      }
      // Strip control chars, normalise whitespace
      sanitisedKeywords = raw.replace(/[\x00-\x1F\x7F]/g, " ").replace(/\s+/g, " ").trim();
    }

    // --- Try LLM generation with retries ---
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.LLM_MODEL ?? "deepseek/deepseek-v4-flash";

    if (!apiKey) {
      // No key configured — fall back to static immediately
      console.warn("[generate] OPENROUTER_API_KEY not set, using static fallback");
      return c.json<GenerateResponse>({
        text: fallacy.example,
        fallacyId,
        source: "static",
      });
    }

    const userPrompt =
      type === "study_custom" && sanitisedKeywords
        ? customTopicPrompt(fallacy, sanitisedKeywords)
        : randomTopicPrompt(fallacy);

    let lastError: string | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

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
                { role: "user", content: userPrompt },
              ],
              max_tokens: 600, // reasoning model: 100-300 hidden reasoning tokens + ~200 paragraph; 600 gives safe headroom for study_custom's longer prompt
              temperature: 0.9,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (response.status === 404) {
          // Wrong model slug — not retryable
          console.error(`[generate] Model not found: ${model}`);
          return c.json<ErrorResponse>(
            { error: `Model "${model}" not found on OpenRouter.`, retryable: false },
            502
          );
        }

        if (!response.ok) {
          lastError = `Upstream error: HTTP ${response.status}`;
          console.warn(`[generate] Attempt ${attempt + 1}: ${lastError}`);
          // 5xx errors are retryable
          if (attempt < MAX_RETRIES) continue;
          return c.json<ErrorResponse>({ error: "LLM service error. Please try again.", retryable: true }, 502);
        }

        const data = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const rawContent = data?.choices?.[0]?.message?.content;
        // Guard: reasoning models can return null content if reasoning_tokens consumed the budget
        if (rawContent === null || rawContent === undefined) {
          lastError = "Empty content (reasoning token budget starved)";
          console.warn(`[generate] Attempt ${attempt + 1}: ${lastError} for ${fallacyId}`);
          if (attempt < MAX_RETRIES) continue;
          break; // fall through to static fallback
        }
        const text = rawContent.trim();

        // Shape validation
        const shapeCheck = validateShape(text);
        if (!shapeCheck.ok) {
          lastError = `Shape check failed: ${shapeCheck.reason}`;
          console.warn(`[generate] Attempt ${attempt + 1}: ${lastError}`);
          if (attempt < MAX_RETRIES) continue;
          break; // fall through to static fallback
        }

        // Name-leak check
        if (checkForLeak(text, fallacyId)) {
          lastError = "Name leak detected";
          console.warn(`[generate] Attempt ${attempt + 1}: ${lastError} for ${fallacyId}`);
          if (attempt < MAX_RETRIES) continue;
          break; // fall through to static fallback
        }

        // All checks passed
        return c.json<GenerateResponse>({
          text,
          fallacyId,
          source: "live",
        });

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          lastError = "Upstream timeout";
          console.warn(`[generate] Attempt ${attempt + 1}: timeout`);
          if (attempt < MAX_RETRIES) continue;
          return c.json<ErrorResponse>(
            { error: "LLM request timed out. Please try again.", retryable: true },
            504
          );
        }
        lastError = String(err);
        console.error(`[generate] Attempt ${attempt + 1}: unexpected error:`, err);
        if (attempt < MAX_RETRIES) continue;
        break;
      }
    }

    // Static fallback — all retries exhausted
    console.warn(`[generate] All retries exhausted (${lastError}), using static fallback for ${fallacyId}`);
    return c.json<GenerateResponse>({
      text: fallacy.example,
      fallacyId,
      source: "static",
    });
  });

  return app;
}
