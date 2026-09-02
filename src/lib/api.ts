// src/lib/api.ts
// API client — consumes the frozen /api/generate contract (docs/API-CONTRACT.md)

export type RequestType = 'quiz_example' | 'study_random' | 'study_custom'
export type SourceType = 'live' | 'static' | 'cached'

export interface GenerateRequest {
  type: RequestType
  fallacyId: string
  keywords?: string
}

export interface GenerateResponse {
  text: string
  fallacyId: string
  source: SourceType
  // requestId — provisional, not yet frozen; will be added early P2
}

export interface ApiError {
  error: string
  retryable: boolean
}

export class GenerateApiError extends Error {
  retryable: boolean
  constructor(message: string, retryable: boolean) {
    super(message)
    this.retryable = retryable
    this.name = 'GenerateApiError'
  }
}

const MAX_RETRIES = 2

async function callGenerate(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (res.ok) {
    return res.json() as Promise<GenerateResponse>
  }

  const body: ApiError = await res.json().catch(() => ({ error: 'Unknown error', retryable: false }))
  throw new GenerateApiError(body.error ?? `HTTP ${res.status}`, body.retryable ?? false)
}

async function callWithRetry(req: GenerateRequest, fallbackText: string): Promise<GenerateResponse> {
  let lastErr: GenerateApiError | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGenerate(req)
    } catch (err) {
      if (err instanceof GenerateApiError) {
        lastErr = err
        if (!err.retryable) break
        // brief back-off before retry
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      } else {
        break
      }
    }
  }
  // All attempts failed — return static fallback
  console.warn('[api] falling back to static example after error:', lastErr?.message)
  return { text: fallbackText, fallacyId: req.fallacyId, source: 'static' }
}

export function studyRandom(fallacyId: string, fallbackText: string): Promise<GenerateResponse> {
  return callWithRetry({ type: 'study_random', fallacyId }, fallbackText)
}

export function studyCustom(fallacyId: string, keywords: string, fallbackText: string): Promise<GenerateResponse> {
  const trimmed = keywords.trim().slice(0, 100)
  return callWithRetry({ type: 'study_custom', fallacyId, keywords: trimmed }, fallbackText)
}

export function quizExample(fallacyId: string, fallbackText: string): Promise<GenerateResponse> {
  return callWithRetry({ type: 'quiz_example', fallacyId }, fallbackText)
}
