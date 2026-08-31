import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

import {
  researchMerchant,
  parseMerchantReply,
  extractGroundingSources,
  clearMerchantCache,
} from "../server/services/merchantSustainability";
import {
  findNearbyAlternatives,
  parsePlacesReply,
  isLocationProvided,
} from "../server/services/nearbyAlternatives";
import { MissingApiKeyError, resetGeminiClient } from "../server/services/geminiClient";

const GROUNDED_REPLY = {
  text: JSON.stringify({
    sustainability_score: 72,
    summary: "Mixed record with strong materials commitments.",
    positive_factors: ["Carbon negative by 2030 goal"],
    negative_factors: ["Packaging criticism"],
  }),
  candidates: [
    {
      groundingMetadata: {
        groundingChunks: [{ web: { uri: "https://example.com/report", title: "Env Report" } }],
      },
    },
  ],
};

describe("Merchant sustainability research (Google Search grounding)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    resetGeminiClient();
    clearMerchantCache();
  });

  it("parses a grounded reply and captures source citations", async () => {
    mockGenerateContent.mockResolvedValue(GROUNDED_REPLY);
    const result = await researchMerchant("Nike");
    expect(result.sustainability_score).toBe(72);
    expect(result.summary).toContain("Mixed record");
    expect(result.sources).toEqual([{ title: "Env Report", uri: "https://example.com/report" }]);
    expect(result.assessment_type).toBe("ecofinance_generated_assessment");
    expect(result.wellformed).toBe(true);
  });

  it("caches results and does not call Gemini twice for the same merchant", async () => {
    mockGenerateContent.mockResolvedValue(GROUNDED_REPLY);
    await researchMerchant("Nike");
    await researchMerchant("Nike");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("degrades gracefully when the model reply is not valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({ text: "The company has various programs." });
    const result = await researchMerchant("Nike");
    expect(result.wellformed).toBe(false);
    expect(result.sustainability_score).toBeNull();
    expect(result.summary).toContain("various programs");
  });

  it("propagates API failure without crashing (caller catches)", async () => {
    mockGenerateContent.mockRejectedValue(new Error("upstream down"));
    await expect(researchMerchant("Nike")).rejects.toThrow("upstream down");
  });

  it("throws MissingApiKeyError without calling the API when key is unset", async () => {
    delete process.env.GEMINI_API_KEY;
    resetGeminiClient();
    await expect(researchMerchant("Nike")).rejects.toBeInstanceOf(MissingApiKeyError);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("parseMerchantReply clamps out-of-range scores", () => {
    const parsed = parseMerchantReply("Nike", JSON.stringify({ sustainability_score: 150, summary: "s" }));
    expect(parsed.sustainability_score).toBe(100);
  });

  it("extractGroundingSources tolerates missing metadata", () => {
    expect(extractGroundingSources({})).toEqual([]);
    expect(extractGroundingSources(undefined)).toEqual([]);
  });
});

describe("Nearby alternatives (Google Maps grounding)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    resetGeminiClient();
  });

  const args = { merchant: "Starbucks", category: "dining", latitude: 37.77, longitude: -122.41 };

  it("is skipped entirely when no location is provided (no Maps call)", async () => {
    const result = await findNearbyAlternatives({ merchant: "Starbucks", category: "dining" });
    expect(result).toBeNull();
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(isLocationProvided({ latitude: undefined, longitude: undefined })).toBe(false);
  });

  it("passes latitude/longitude via toolConfig retrievalConfig latLng", async () => {
    mockGenerateContent.mockResolvedValue({ text: "[]" });
    await findNearbyAlternatives(args);
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.tools).toEqual([{ googleMaps: {} }]);
    expect(call.config.toolConfig.retrievalConfig.latLng).toEqual({ latitude: 37.77, longitude: -122.41 });
  });

  it("parses a valid Maps reply into local alternatives", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([
        {
          name: "Local Cafe Verde",
          address: "123 Green St",
          distance_or_location_context: "2 blocks north",
          price_context: "$$",
          sustainability_reason: "Local roaster with compostable cups",
        },
      ]),
    });
    const result = await findNearbyAlternatives(args);
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe("Local Cafe Verde");
    expect(result![0].maps_source).toBe("Google Maps via Gemini grounding");
  });

  it("returns [] on invalid Maps/model responses instead of crashing", async () => {
    mockGenerateContent.mockResolvedValue({ text: "sorry, I cannot help with that" });
    expect(await findNearbyAlternatives(args)).toEqual([]);
    mockGenerateContent.mockResolvedValue({ text: "{not json [" });
    expect(await findNearbyAlternatives(args)).toEqual([]);
    expect(parsePlacesReply("no json at all")).toEqual([]);
  });

  it("propagates API failure without crashing", async () => {
    mockGenerateContent.mockRejectedValue(new Error("maps unavailable"));
    await expect(findNearbyAlternatives(args)).rejects.toThrow("maps unavailable");
  });
});
