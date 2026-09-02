/**
 * Captain Fallacy — Hono server
 * - Serves built static frontend (../dist)
 * - Exposes POST /api/generate as OpenRouter proxy
 * - Exposes GET /api/health for slug health-check (@captain-release)
 */

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { FallaciesData, AliasesData } from "./types.js";
import { createGenerateRoute } from "./generate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load data files — server startup fails fast if they're missing or malformed
function loadJSON<T>(relPath: string): T {
  const abs = join(__dirname, relPath);
  try {
    return JSON.parse(readFileSync(abs, "utf-8")) as T;
  } catch (err) {
    console.error(`[startup] Failed to load ${abs}:`, err);
    process.exit(1);
  }
}

const fallaciesData = loadJSON<FallaciesData>("../../data/fallacies.json");
const aliasesData = loadJSON<AliasesData>("../../data/aliases.json");

// Validate at startup: every fallacy ID must have aliases
const missingAliases = fallaciesData.fallacies
  .filter((f) => !aliasesData.aliases[f.id])
  .map((f) => f.id);
if (missingAliases.length > 0) {
  console.error("[startup] Missing alias entries for:", missingAliases);
  process.exit(1);
}

const app = new Hono();

// Health endpoint — used by @captain-release slug check and Railway health probe
app.get("/api/health", (c) => {
  const model = process.env.LLM_MODEL ?? "deepseek/deepseek-v4-flash";
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  return c.json({
    status: "ok",
    model,
    keyConfigured: hasKey,
    fallacyCount: fallaciesData.fallacies.length,
  });
});

// Generate proxy
app.route("/api/generate", createGenerateRoute(fallaciesData, aliasesData));

// Serve static frontend build (Vite output in ../dist, relative to server root)
app.use("/*", serveStatic({ root: join(__dirname, "../../dist") }));

// SPA fallback: any non-asset route not found → serve index.html
app.notFound((c) => {
  const path = new URL(c.req.url).pathname;
  // Only fall back for non-asset paths (no file extension)
  if (!path.includes(".")) {
    try {
      const html = readFileSync(join(__dirname, "../../dist/index.html"), "utf-8");
      return c.html(html);
    } catch {
      // dist not built yet (dev mode without frontend build)
    }
  }
  return c.text("Not found", 404);
});

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`[server] Captain Fallacy running on port ${port}`);
  console.log(`[server] Model: ${process.env.LLM_MODEL ?? "deepseek/deepseek-v4-flash (default)"}`);
  console.log(`[server] API key: ${process.env.OPENROUTER_API_KEY ? "configured" : "NOT SET — static fallback only"}`);
});
