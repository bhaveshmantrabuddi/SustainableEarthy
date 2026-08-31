import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock only the Gemini-touching pieces; ranking + vector math stay real.
const { mockResearch, mockNearby } = vi.hoisted(() => ({
  mockResearch: vi.fn(),
  mockNearby: vi.fn(),
}));

vi.mock("../server/services/geminiEmbeddings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../server/services/geminiEmbeddings")>()),
  generateQueryEmbedding: vi.fn(async () => Array.from({ length: 768 }, () => 0.5)),
}));

vi.mock("../server/services/merchantSustainability", () => ({
  researchMerchant: mockResearch,
}));

vi.mock("../server/services/nearbyAlternatives", () => ({
  isLocationProvided: (a: { latitude?: number; longitude?: number }) =>
    typeof a.latitude === "number" && typeof a.longitude === "number",
  findNearbyAlternatives: mockNearby,
}));

vi.mock("../server/services/catalog", () => ({
  ensureCatalogEmbedded: vi.fn(async () => []),
}));

vi.mock("../server/services/vectorStore", () => ({
  vectorStore: {
    search: vi.fn(() => [
      {
        candidate: {
          id: "allbirds-wool-runners",
          name: "Allbirds Wool Runners",
          merchant: "Allbirds",
          category: "shopping",
          price: 98,
          sustainabilityScore: 88,
          url: "https://example.com/allbirds",
          description: "Sustainable running shoes made from merino wool.",
          embedding: Array.from({ length: 768 }, () => 0.5),
        },
        similarity: 0.9,
      },
    ]),
  },
}));

import { getRecommendationsForTransaction, buildPurchaseDescription } from "../server/services/recommendationService";

describe("recommendationService orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResearch.mockResolvedValue({
      merchant: "Nike",
      sustainability_score: 72,
      summary: "ok",
      positive_factors: [],
      negative_factors: [],
      sources: [],
      assessment_type: "ecofinance_generated_assessment",
      wellformed: true,
    });
  });

  it("builds a normalized purchase description without any financial PII", () => {
    expect(buildPurchaseDescription({ merchant: "Nike", category: "shopping", amount: 120 })).toBe(
      "Nike (category: shopping)",
    );
  });

  it("returns ranked semantic alternatives and cached merchant research", async () => {
    const result = await getRecommendationsForTransaction({ merchant: "Nike", category: "shopping", amount: 120 });
    expect(result.purchase).toEqual({ merchant: "Nike", category: "shopping", amount: 120, description: undefined });
    expect(result.semantic_alternatives).toHaveLength(1);
    expect(result.semantic_alternatives[0].name).toBe("Allbirds Wool Runners");
    expect(result.semantic_alternatives[0].sustainability_score).toBe(88);
    expect(result.merchant_sustainability?.sustainability_score).toBe(72);
    // No location -> Maps skipped, surfaced as a warning (not an error)
    expect(result.local_alternatives).toBeNull();
    expect(result.warnings.join(" ")).toContain("Location not provided");
  });

  it("keeps working when Google Search grounding fails (graceful degradation)", async () => {
    mockResearch.mockRejectedValue(new Error("search down"));
    const result = await getRecommendationsForTransaction({ merchant: "Nike", category: "shopping" });
    expect(result.merchant_sustainability).toBeNull();
    expect(result.warnings.join(" ")).toContain("sustainability research is currently unavailable");
    expect(result.semantic_alternatives).toHaveLength(1); // semantic results unaffected
  });

  it("calls Maps grounding only when a location is provided", async () => {
    mockNearby.mockResolvedValue([
      {
        name: "Cafe Verde",
        address: "123 Green St",
        distance_or_location_context: "nearby",
        price_context: "$$",
        sustainability_reason: "local",
        maps_source: "Google Maps via Gemini grounding",
      },
    ]);
    const result = await getRecommendationsForTransaction(
      { merchant: "Starbucks", category: "dining" },
      { latitude: 37.77, longitude: -122.41 },
    );
    expect(mockNearby).toHaveBeenCalledTimes(1);
    expect(result.local_alternatives).toHaveLength(1);
  });

  it("tolerates Maps grounding failures", async () => {
    mockNearby.mockRejectedValue(new Error("maps down"));
    const result = await getRecommendationsForTransaction(
      { merchant: "Starbucks", category: "dining" },
      { latitude: 37.77, longitude: -122.41 },
    );
    expect(result.local_alternatives).toBeNull();
    expect(result.warnings.join(" ")).toContain("Nearby-alternatives lookup is currently unavailable");
  });
});
