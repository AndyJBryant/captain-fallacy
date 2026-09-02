// src/data/fallacies.ts
// Re-exports the JSON dataset with proper typing
import rawData from '../../data/fallacies.json'
import type { FallaciesData, Fallacy } from './types'

const data = rawData as unknown as FallaciesData

export const fallacies: Fallacy[] = data.fallacies
export const fallacyMap: Map<string, Fallacy> = new Map(
  data.fallacies.map((f) => [f.id, f])
)

export function getFallacy(id: string): Fallacy | undefined {
  return fallacyMap.get(id)
}
