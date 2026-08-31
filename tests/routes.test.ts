import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

// Mock the service layer; routes must stay thin and testable.
const { mockGetRecommendations } = vi.hoisted(() => ({ mockGetRecommendations: vi.fn() }));
vi.mock("../server/services/recommendationService", () => ({
  getRecommendationsForTransaction: mockGetRecommendations,
}));

import { registerRecommendationRoutes } from "../server/routes";
import { parseCSV, CSVParseError } from "../server/utils/csvParser";
import { processTransactions, calculateEcoScore } from "../server/utils/sustainabilityCalculator";

// Bypass session auth in tests (unit scope); real auth covered by existing setup.
const fakeAuth = (req: Request, _res: Response, next: NextFunction) => {
  (req as unknown as { user: { id: number } }).user = { id: 1 };
  next();
};

function buildApp() {
  const app = express();
  app.use(express.json());
  registerRecommendationRoutes(app, fakeAuth as unknown as express.RequestHandler);
  return app;
}

const SAMPLE_RESULT = {
  purchase: { merchant: "Nike", category: "shopping", amount: 120 },
  semantic_alternatives: [],
  local_alternatives: null,
  merchant_sustainability: null,
  warnings: ["Location not provided — nearby-alternatives lookup skipped."],
};

describe("POST /api/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the service payload for a valid request", async () => {
    mockGetRecommendations.mockResolvedValue(SAMPLE_RESULT);
    const res = await request(buildApp())
      .post("/api/recommendations")
      .send({ transaction: { merchant: "Nike", category: "shopping", amount: 120 } });
    expect(res.status).toBe(200);
    expect(res.body.purchase.merchant).toBe("Nike");
    expect(Array.isArray(res.body.warnings)).toBe(true);
    expect(mockGetRecommendations).toHaveBeenCalledWith(
      { merchant: "Nike", category: "shopping", amount: 120 },
      { latitude: undefined, longitude: undefined },
    );
  });

  it("forwards optional request-scoped location to the service", async () => {
    mockGetRecommendations.mockResolvedValue(SAMPLE_RESULT);
    await request(buildApp())
      .post("/api/recommendations")
      .send({ transaction: { merchant: "Starbucks" }, latitude: 37.77, longitude: -122.41 });
    expect(mockGetRecommendations).toHaveBeenCalledWith(
      { merchant: "Starbucks", category: "other" },
      { latitude: 37.77, longitude: -122.41 },
    );
  });

  it("returns 400 for a malformed body (missing merchant)", async () => {
    const res = await request(buildApp()).post("/api/recommendations").send({ transaction: {} });
    expect(res.status).toBe(400);
    expect(mockGetRecommendations).not.toHaveBeenCalled();
  });

  it("returns 503 when GEMINI_API_KEY is missing on the server", async () => {
    const { MissingApiKeyError } = await import("../server/services/geminiClient");
    mockGetRecommendations.mockRejectedValue(new MissingApiKeyError());
    const res = await request(buildApp())
      .post("/api/recommendations")
      .send({ transaction: { merchant: "Nike" } });
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("GEMINI_API_KEY");
  });

  it("returns 502 when the Gemini API fails after retries", async () => {
    const { GeminiServiceError } = await import("../server/services/geminiClient");
    mockGetRecommendations.mockRejectedValue(new GeminiServiceError("timeout"));
    const res = await request(buildApp())
      .post("/api/recommendations")
      .send({ transaction: { merchant: "Nike" } });
    expect(res.status).toBe(502);
  });

  it("returns 500 for unexpected service errors (no crash)", async () => {
    mockGetRecommendations.mockRejectedValue(new Error("boom"));
    const res = await request(buildApp())
      .post("/api/recommendations")
      .send({ transaction: { merchant: "Nike" } });
    expect(res.status).toBe(500);
  });
});

describe("existing behavior is preserved", () => {
  const csv = "date,merchant,category,amount\n2025-04-01,Starbucks,dining,$6.75\n2025-04-02,Whole Foods,groceries,54.20\n";

  it("CSV upload parsing still works", () => {
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].merchant).toBe("Starbucks");
  });

  it("CSV validation errors still surface", () => {
    expect(() => parseCSV("wrong,headers\n1,2")).toThrow(CSVParseError);
    // Existing behavior: headers-only CSV yields an empty row list (not an error)
    expect(parseCSV("date,merchant,category,amount\n")).toEqual([]);
  });

  it("sustainability scoring still works (hardcoded eco logic intact)", () => {
    expect(calculateEcoScore("Starbucks latte", "dining")).toBe(65); // merchant match
    expect(calculateEcoScore("Nike running shoes", "shopping")).toBe(50); // category fallback
    const processed = processTransactions(
      [{ date: "2025-04-01", merchant: "Starbucks", category: "dining", amount: "$6.75" }],
      1,
    );
    expect(processed.transactions).toHaveLength(1);
    expect(processed.transactions[0].ecoScore).toBe(65);
    expect(processed.transactions[0].amount).toBeCloseTo(6.75);
    expect(processed.sustainabilityScore.overallScore).toBe(65);
    expect(processed.categoryBreakdowns[0].category).toBe("dining");
  });
});
