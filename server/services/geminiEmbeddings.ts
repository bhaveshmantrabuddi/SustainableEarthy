import { GEMINI_CONFIG, GeminiServiceError, getGeminiClient, withRetries } from "./geminiClient";

/**
 * Gemini 768-dimensional embedding service.
 *
 * Follows Google's current guidance for gemini-embedding-2:
 *  - no `taskType` parameter (unsupported on embedding-2)
 *  - retrieval task instructions are included directly in the prompt
 *      queries:   "task: search result | query: {purchase description}"
 *      documents: "title: {product name} | text: {description/category/attributes}"
 *  - outputDimensionality is set to exactly 768 (auto-normalized by the API,
 *    which makes cosine similarity well-behaved)
 *
 * Every generated vector is validated to contain exactly
 * GEMINI_CONFIG.embeddingDimensions values before it is used anywhere.
 */

/** Normalize a purchase into the semantic query string sent to the embedding model. */
export function buildQueryText(purchaseDescription: string): string {
  return `task: search result | query: ${purchaseDescription.trim()}`;
}

/** Format a candidate product as the retrieval document Google recommends. */
export function buildProductDocumentText(product: {
  name: string;
  description?: string | null;
}): string {
  return `title: ${product.name} | text: ${product.description ?? ""}`;
}

function extractVector(response: unknown): number[] {
  // Defensive extraction: SDK response shape is { embeddings: [{ values: [...] }] }.
  const r = response as { embeddings?: { values?: number[] }[]; embedding?: { values?: number[] } };
  const values = r?.embeddings?.[0]?.values ?? r?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new GeminiServiceError("Malformed embedding response from Gemini (no values array).");
  }
  return values;
}

function validateDimensions(vector: number[], context: string): number[] {
  if (vector.length !== GEMINI_CONFIG.embeddingDimensions) {
    throw new GeminiServiceError(
      `Embedding dimension mismatch (${context}): expected ${GEMINI_CONFIG.embeddingDimensions}, got ${vector.length}.`,
    );
  }
  return vector;
}

/**
 * Generate the 768-dim query embedding for a normalized purchase description.
 * Throws MissingApiKeyError when GEMINI_API_KEY is unset.
 */
export async function generateQueryEmbedding(purchaseDescription: string): Promise<number[]> {
  const client = getGeminiClient();
  const response = await withRetries(() =>
    client.models.embedContent({
      model: GEMINI_CONFIG.embeddingModel,
      contents: buildQueryText(purchaseDescription),
      config: {
        outputDimensionality: GEMINI_CONFIG.embeddingDimensions,
        httpOptions: { timeout: GEMINI_CONFIG.requestTimeoutMs },
      },
    }),
  );
  return validateDimensions(extractVector(response), "query");
}

/**
 * Generate the 768-dim document embedding for a sustainable alternative product.
 * Products are embedded once and cached in the vector store — not per request.
 */
export async function generateProductEmbedding(product: {
  name: string;
  description?: string | null;
}): Promise<number[]> {
  const client = getGeminiClient();
  const response = await withRetries(() =>
    client.models.embedContent({
      model: GEMINI_CONFIG.embeddingModel,
      contents: buildProductDocumentText(product),
      config: {
        outputDimensionality: GEMINI_CONFIG.embeddingDimensions,
        httpOptions: { timeout: GEMINI_CONFIG.requestTimeoutMs },
      },
    }),
  );
  return validateDimensions(extractVector(response), `product:${product.name}`);
}

/** Cosine similarity in [-1, 1]. Safe for zero vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new GeminiServiceError(`Cosine similarity dimension mismatch: ${a.length} vs ${b.length}.`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
