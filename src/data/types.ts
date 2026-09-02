// src/data/types.ts
export interface Fallacy {
  id: string
  name: string
  image: string
  description: string
  detail: string
  example: string
  weighting: number
  similarities: Array<{ id: string; weight: number }>
}

export interface FallaciesData {
  _meta: {
    source: string
    license: string
    count: number
  }
  fallacies: Fallacy[]
}
