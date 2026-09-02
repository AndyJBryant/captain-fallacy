/**
 * Server-side prompt templates for /api/generate
 * Client never sends raw prompts — all prompt construction happens here.
 * Consumes fallacy name, description, detail from data/fallacies.json.
 */

import type { Fallacy } from "./types.js";

/**
 * Build the system prompt used for all generation requests.
 * Instructs the model to commit exactly the named fallacy without naming it.
 */
function systemPrompt(): string {
  return `You are a generator of short, realistic-sounding argumentative statements that contain logical fallacies.

Your job is to write a single short paragraph (2-4 sentences) that COMMITS the specified logical fallacy — meaning the fallacy is genuinely present in the reasoning, not just mentioned.

Rules you MUST follow:
- Do NOT name the fallacy anywhere in your output.
- Do NOT use the fallacy's name, its synonyms, Latin variants, or common descriptions of it.
- Do NOT mention the words "fallacy", "logical", "argument", "reasoning", "flaw", or similar meta-commentary.
- Do NOT include any analysis, explanation, or labelling of what you wrote.
- Write in a natural, everyday voice — like something someone might actually say in a conversation, debate, or article.
- Keep it to a single paragraph, 2-4 sentences. No markdown, no headers, no lists.
- Output ONLY the paragraph. Nothing else.`;
}

/**
 * Build the user prompt for quiz_example and study_random (random topic).
 */
export function randomTopicPrompt(fallacy: Fallacy): string {
  return `Write a short paragraph that commits the following logical fallacy.

Fallacy: ${fallacy.name}
What it means: ${fallacy.description}
How it works: ${fallacy.detail}

Pick a completely random, everyday topic for this example (e.g. sport, cooking, politics, technology, parenting, health, business — anything except logical fallacies themselves). The topic should feel spontaneous and realistic.

Remember: commit the fallacy in the reasoning — do not name it or describe it.`;
}

/**
 * Build the user prompt for study_custom (user-supplied keywords steer the topic).
 */
export function customTopicPrompt(fallacy: Fallacy, keywords: string): string {
  return `Write a short paragraph that commits the following logical fallacy.

Fallacy: ${fallacy.name}
What it means: ${fallacy.description}
How it works: ${fallacy.detail}

Steer the topic of your example toward these keywords: "${keywords}". Use the keywords as thematic inspiration — the example should feel connected to them, but the fallacy must still be naturally committed in the reasoning.

Remember: commit the fallacy in the reasoning — do not name it or describe it.`;
}

export { systemPrompt };
