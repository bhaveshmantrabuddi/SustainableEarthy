import { GoogleGenAI } from "@google/genai";

/**
 * Central configuration for all Gemini usage in EcoFinance.
 * Every value is overridable via environment variables so the app can be
 * pointed at whichever models are available on the current account.
 */
export const GEMINI_CONFIG = {
  // Embedding model: gemini-embedding-2 supports arbitrary output dimensionality
  // (docs: sub-3072-dim outputs are automatically normalized) and does NOT take a
  // task_type parameter — retrieval task instructions go directly in the prompt.
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
  // Text model for Google Search / Maps grounding. gemini-2.5-flash supports BOTH
  // the google_search and google_maps tools (per Google's supported-model tables).
  textModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
  // Exact dimensionality required by our vector index.
  embeddingDimensions: 768,
  requestTimeoutMs: 15_000,
  maxRetries: 2,
  retryBaseDelayMs: 500,
};

/** Thrown when GEMINI_API_KEY is not configured (server-side env var). */
export class MissingApiKeyError extends Error {
  status = 503;
  constructor(message = "GEMINI_API_KEY is not configured on the server. Gemini features are unavailable.") {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

/** Thrown when Gemini responds with something unusable after retries. */
export class GeminiServiceError extends Error {
  status = 502;
  constructor(message: string) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

let cachedClient: GoogleGenAI | null = null;

/**
 * Lazily create (and cache) the Gemini client. The API key only ever lives in
 * the server-side environment — it is never imported into client/frontend code.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

/** Test-only helper: drop the cached client so mocks/env changes take effect. */
export function resetGeminiClient(): void {
  cachedClient = null;
}

function isRetryableError(error: unknown): boolean {
  const anyErr = error as { status?: number; message?: string };
  if (typeof anyErr?.status === "number") {
    // 429 = rate limit, 5xx = transient server errors
    if (anyErr.status === 429 || (anyErr.status >= 500 && anyErr.status < 600)) return true;
  }
  const msg = String(anyErr?.message ?? "");
  return /rate limit|quota|timeout|ECONNRESET|ETIMEDOUT|fetch failed|overloaded/i.test(msg);
}

/**
 * Execute a Gemini request with exponential backoff on transient failures
 * (rate limits, timeouts, 5xx). Non-retryable errors surface immediately.
 */
export async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= GEMINI_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < GEMINI_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = GEMINI_CONFIG.retryBaseDelayMs * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
