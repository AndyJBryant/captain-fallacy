// src/game/quiz.ts
// Quiz engine: 15-question loop, prefetch-next, randomised options, scoring

import { fallacies } from '../data/fallacies'
import type { Fallacy } from '../data/types'
import { quizExample } from '../lib/api'

export const QUIZ_LENGTH = 15
export const NUM_OPTIONS = 4

export interface QuizQuestion {
  subject: Fallacy         // the fallacy being committed
  distractors: Fallacy[]   // 3 wrong options
  options: Fallacy[]       // all 4, shuffled
  exampleText: string
  exampleSource: 'live' | 'static' | 'cached'
}

export interface QuizAnswer {
  question: QuizQuestion
  selectedId: string
  correct: boolean
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(subject: Fallacy, all: Fallacy[]): Fallacy[] {
  const pool = all.filter((f) => f.id !== subject.id)
  return shuffle(pool).slice(0, NUM_OPTIONS - 1)
}

/**
 * Generate a single quiz question (fetches example from API).
 * Falls back to static example on any API error.
 */
export async function generateQuestion(): Promise<QuizQuestion> {
  const all = fallacies
  const subject = all[Math.floor(Math.random() * all.length)]
  const distractors = pickDistractors(subject, all)

  const res = await quizExample(subject.id, subject.example)

  const options = shuffle([subject, ...distractors])

  return {
    subject,
    distractors,
    options,
    exampleText: res.text,
    exampleSource: res.source,
  }
}

/**
 * Score tiers per PRD §5.2
 */
export type ScoreTier = 'fallacy-fodder' | 'getting-sharper' | 'sharp-thinker' | 'fallacy-proof'
export type MascotMood = 'dejected' | 'neutral' | 'pleased' | 'triumphant'

export function scoreTier(score: number): { tier: ScoreTier; label: string; mood: MascotMood } {
  if (score <= 5)  return { tier: 'fallacy-fodder',   label: 'Fallacy Fodder!',  mood: 'dejected' }
  if (score <= 9)  return { tier: 'getting-sharper',  label: 'Getting Sharper!', mood: 'neutral' }
  if (score <= 12) return { tier: 'sharp-thinker',    label: 'Sharp Thinker!',   mood: 'pleased' }
  return            { tier: 'fallacy-proof',           label: 'Fallacy-Proof!',   mood: 'triumphant' }
}
