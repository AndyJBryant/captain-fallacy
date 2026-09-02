// src/game/flashcards.ts
// Anki-style proficiency algorithm — pure logic, no side effects
// Persistence handled by lib/storage.ts

import { fallacies } from '../data/fallacies'
import type { Fallacy } from '../data/types'
import {
  getProficiency,
  updateProficiency,
  weightedRandomFallacyId,
  type ProficiencyMap,
} from '../lib/storage'

export type DrillMode = 'names' | 'examples'

export interface FlashcardState {
  current: Fallacy
  proficiency: ProficiencyMap
  revealed: boolean
  drillMode: DrillMode
  sessionCount: number
}

const fallacyIds = fallacies.map((f) => f.id)

export function initFlashcards(drillMode: DrillMode): FlashcardState {
  const proficiency = getProficiency()
  const firstId = weightedRandomFallacyId(fallacyIds, proficiency)
  const current = fallacies.find((f) => f.id === firstId) ?? fallacies[0]
  return { current, proficiency, revealed: false, drillMode, sessionCount: 0 }
}

export function revealCard(state: FlashcardState): FlashcardState {
  return { ...state, revealed: true }
}

/**
 * Rate the current card (✓ or ✗), update proficiency, advance to next card.
 */
export function rateAndAdvance(state: FlashcardState, correct: boolean): FlashcardState {
  const proficiency = updateProficiency(state.current.id, correct, fallacyIds)
  // Pick next card — avoid repeating the same one immediately
  const nextId = weightedRandomFallacyId(fallacyIds, proficiency, state.current.id)
  const next = fallacies.find((f) => f.id === nextId) ?? fallacies[0]
  return {
    ...state,
    proficiency,
    current: next,
    revealed: false,
    sessionCount: state.sessionCount + 1,
  }
}
