// src/lib/storage.ts
// localStorage persistence — cf.highscores + cf.flashcards.proficiency

const HIGHSCORES_KEY = 'cf.highscores.v1'
const PROFICIENCY_KEY = 'cf.flashcards.proficiency.v1'

export interface HighScoreEntry {
  name: string
  score: number
  date: string
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// --- High Scores ---

export function getHighScores(): HighScoreEntry[] {
  return safeRead<HighScoreEntry[]>(HIGHSCORES_KEY, [])
}

export function addHighScore(entry: HighScoreEntry): HighScoreEntry[] {
  const scores = getHighScores()
  const updated = [...scores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
  localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(updated))
  return updated
}

// --- Flashcard Proficiency (Anki weights) ---
// weight = 1.0 default; higher = more proficient (shown less); lower = shown more

export type ProficiencyMap = Record<string, number>

export function getProficiency(): ProficiencyMap {
  return safeRead<ProficiencyMap>(PROFICIENCY_KEY, {})
}

export function setProficiency(map: ProficiencyMap): void {
  localStorage.setItem(PROFICIENCY_KEY, JSON.stringify(map))
}

export function updateProficiency(
  fallacyId: string,
  correct: boolean,
  allFallacyIds: string[]
): ProficiencyMap {
  const map = getProficiency()
  // Ensure all fallacies have a baseline weight
  for (const id of allFallacyIds) {
    if (!(id in map)) map[id] = 1.0
  }
  const current = map[fallacyId] ?? 1.0
  // ✓ increases proficiency (up to 5.0), ✗ decreases (floor 0.2)
  map[fallacyId] = correct
    ? Math.min(5.0, current + 0.5)
    : Math.max(0.2, current - 0.4)
  setProficiency(map)
  return map
}

/**
 * Weighted-random next fallacy selection.
 * Probability is INVERSELY proportional to proficiency weight.
 */
export function weightedRandomFallacyId(
  fallacyIds: string[],
  proficiency: ProficiencyMap,
  excludeId?: string
): string {
  const candidates = excludeId ? fallacyIds.filter((id) => id !== excludeId) : fallacyIds
  if (candidates.length === 0) return fallacyIds[0]

  // inverse weight: high proficiency → low draw chance
  const weights = candidates.map((id) => 1 / (proficiency[id] ?? 1.0))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
