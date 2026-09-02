/**
 * Name-leak post-check.
 * After generation, rejects output containing any alias for the target fallacy.
 * Uses data/aliases.json — word-boundary aware to reduce false positives on generic terms.
 * (See rick-bot's G0 note: generic terms like "correlation" get boundary-checked.)
 */

import type { AliasesData } from "./types.js";

// Aliases flagged as risky (very common words that appear in legitimate examples).
// These get WORD-BOUNDARY matching only, not substring matching.
const WORD_BOUNDARY_ALIASES = new Set([
  "correlation",
  "causation",
  "slope",
  "nature",
  "emotion",
  "tradition",
  "popularity",
  "authority",
  "ignorance",
]);

export function buildLeakChecker(aliasesData: AliasesData) {
  return function checkForNameLeak(text: string, fallacyId: string): boolean {
    const aliases = aliasesData.aliases[fallacyId];
    if (!aliases || aliases.length === 0) return false;

    const normalised = text.toLowerCase().replace(/\s+/g, " ");

    for (const alias of aliases) {
      const aliasLower = alias.toLowerCase();

      if (WORD_BOUNDARY_ALIASES.has(aliasLower)) {
        // Word-boundary match: must be a whole word, not a substring of another word
        const escaped = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(normalised)) return true;
      } else {
        // Standard substring match (case-insensitive)
        if (normalised.includes(aliasLower)) return true;
      }
    }

    return false;
  };
}

/**
 * Sanity-check the shape of generated text before accepting it:
 * - non-empty string
 * - within length range (50–800 chars)
 * - single-paragraph (no markdown headers, no lists)
 * - no meta-tells
 */
const META_TELLS = [
  /this (argument|example|statement) (commits|contains|is)/i,
  /logical fallacy/i,
  /this (is a|is an) (example of|instance of)/i,
  /the fallacy (here|in this)/i,
];

export function validateShape(text: string): { ok: boolean; reason?: string } {
  if (!text || typeof text !== "string") return { ok: false, reason: "empty" };
  const t = text.trim();
  if (t.length < 50) return { ok: false, reason: "too short" };
  if (t.length > 800) return { ok: false, reason: "too long" };
  if (/^#{1,6}\s/m.test(t)) return { ok: false, reason: "contains markdown header" };
  if (/^[\-\*\d]+[.)]\s/m.test(t)) return { ok: false, reason: "contains list" };
  for (const re of META_TELLS) {
    if (re.test(t)) return { ok: false, reason: "contains meta-tell" };
  }
  return { ok: true };
}
