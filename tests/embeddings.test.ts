import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the official SDK module so no network calls or API spend can happen.
const { mockEmbedContent } = vi.hoisted(() => ({ mockEmbedContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { embedContent: mockEmbedContent };
  },
}));

import {
  buildQueryText,
  buildProductDocumentText,
  generateQueryEmbedding,
  generateProductEmbedding,
  cosineSimilarity,
} from "../server/services/geminiEmbeddings";
import { MissingApiKeyError, GeminiServiceError, resetGeminiClient } from "../server/services/geminiClient";

const V768 = (fill: number) => Array.from({ length: 768 }, () => fill);

describe("Gemini embedding service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    resetGeminiClient();
  });

  it("formats retrieval queries with the recommended task prefix", () => {
    expect(buildQueryText("Nike running shoes")).toBe("task: search result | query: Nike running shoes");
  });

  it("formats candidate documents as title/text pairs", () => {
    expect(buildProductDocumentText({ name: "Allbirds Wool Runners", description: "wool shoes" })).toBe(
      "title: Allbirds Wool Runners | text: wool shoes",
    );
  });

  it("generates a query embedding with exactly 768 dimensions", async () => {
    mockEmbedContent.mockResolvedValue({ embeddings: [{ values: V768(0.5) }] });
    const vector = await generateQueryEmbedding("Nike running shoes");
    expect(vector).toHaveLength(768);
    // Confirms the request asked for 768-dim output on the embedding model
    const call = mockEmbedContent.mock.calls[0][0];
    expect(call.config.outputDimensionality).toBe(768);
    expect(call.model).toBe("gemini-embedding-2");
    expect(call.contents).toContain("task: search result | query:");
  });

  it("generates a product document embedding with exactly 768 dimensions", async () => {
    mockEmbedContent.mockResolvedValue({ embeddings: [{ values: V768(0.25) }] });
    const vector = await generateProductEmbedding({ name: "Allbirds Wool Runners", description: "wool" });
    expect(vector).toHaveLength(768);
    expect(mockEmbedContent.mock.calls[0][0].contents).toContain("title: Allbirds Wool Runners | text:");
  });

  it("rejects malformed embeddings with wrong dimensionality", async () => {
    mockEmbedContent.mockResolvedValue({ embeddings: [{ values: [1, 2, 3] }] });
    await expect(generateQueryEmbedding("anything")).rejects.toBeInstanceOf(GeminiServiceError);
  });

  it("rejects responses with no values array", async () => {
    mockEmbedContent.mockResolvedValue({ unexpected: true });
    await expect(generateQueryEmbedding("anything")).rejects.toBeInstanceOf(GeminiServiceError);
  });

  it("throws MissingApiKeyError before any API call when key is unset", async () => {
    delete process.env.GEMINI_API_KEY;
    resetGeminiClient();
    await expect(generateQueryEmbedding("anything")).rejects.toBeInstanceOf(MissingApiKeyError);
    expect(mockEmbedContent).not.toHaveBeenCalled();
  });

  it("computes cosine similarity correctly", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });
});
