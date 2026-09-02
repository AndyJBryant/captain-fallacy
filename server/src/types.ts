// Fallacy dataset types matching data/fallacies.json schema (PRD §6.4)
export interface Fallacy {
  id: string;
  name: string;
  image: string;
  description: string;
  detail: string;
  example: string;
  weighting: number;
  similarities: Array<{ id: string; weight: number }>;
}

export interface FallaciesData {
  _meta: Record<string, unknown>;
  fallacies: Fallacy[];
}

export interface AliasesData {
  _meta: Record<string, unknown>;
  aliases: Record<string, string[]>;
}

// API contract types (docs/API-CONTRACT.md)
export type RequestType = "quiz_example" | "study_random" | "study_custom";
export type SourceType = "live" | "static" | "cached";

export interface GenerateRequest {
  type: RequestType;
  fallacyId: string;
  keywords?: string;
}

export interface GenerateResponse {
  text: string;
  fallacyId: string;
  source: SourceType;
  requestId?: string; // provisional — freezes early P2
}

export interface ErrorResponse {
  error: string;
  retryable: boolean;
}
