import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { rankAlternatives, RANKING_WEIGHTS } from "../server/services/ranking";
import { VectorStore, stableProductId } from "../server/services/vectorStore";
import type { CatalogProduct } from "../server/services/catalog";

const V768 = (fill: number) => Array.from({ length: 768 }, () => fill);

const product = (overrides: Partial<CatalogProduct>): CatalogProduct & { embedding: number[] } => ({
  id: overrides.id ?? "p1",
  name: overrides.name ?? "Product",
  merchant: overrides.merchant ?? "Merchant",
  category: overrides.category ?? "shopping",
  price: overrides.price ?? 50,
  sustainabilityScore: overrides.sustainabilityScore ?? 80,
  url: overrides.url,
  description: overrides.description ?? "sustainable",
  embedding: overrides.embedding ?? V768(0.5),
});

describe("rankAlternatives", () => {
  it("ranks a more similar candidate above an unrelated one", () => {
    const query = V768(0.5);
    const similar = product({ id: "similar", embedding: V768(0.5) }); // cosine = 1
    const unrelated = product({ id: "unrelated", embedding: V768(-0.5) }); // cosine = -1
    const ranked = rankAlternatives(query, [unrelated, similar], { topK: 2 });
    expect(ranked[0].product.id).toBe("similar");
    expect(ranked[0].similarity).toBeGreaterThan(ranked[1].similarity);
  });

  it("returns exactly topK results", () => {
    const query = V768(0.5);
    const candidates = [1, 2, 3, 4].map((i) => product({ id: `p${i}`, embedding: V768(i / 10) }));
    expect(rankAlternatives(query, candidates, { topK: 2 })).toHaveLength(2);
    expect(rankAlternatives(query, candidates, { topK: 10 })).toHaveLength(4);
  });

  it("prefers more sustainable candidates when similarity ties", () => {
    const query = V768(0.5);
    const greener = product({ id: "greener", sustainabilityScore: 95, embedding: V768(0.5) });
    const worse = product({ id: "worse", sustainabilityScore: 40, embedding: V768(0.5) });
    const ranked = rankAlternatives(query, [worse, greener], { topK: 2 });
    expect(ranked[0].product.id).toBe("greener");
  });

  it("penalizes pricier alternatives via the price factor", () => {
    const query = V768(0.5);
    const cheap = product({ id: "cheap", price: 60, sustainabilityScore: 80, embedding: V768(0.5) });
    const pricey = product({ id: "pricey", price: 200, sustainabilityScore: 80, embedding: V768(0.5) });
    const ranked = rankAlternatives(query, [pricey, cheap], { topK: 2, referencePrice: 60 });
    const cheapScored = ranked.find((r) => r.product.id === "cheap")!;
    const priceyScored = ranked.find((r) => r.product.id === "pricey")!;
    expect(cheapScored.rankingFactors.price_factor).toBeGreaterThan(priceyScored.rankingFactors.price_factor);
  });

  it("exposes individual ranking factors with named weights", () => {
    const query = V768(0.5);
    const ranked = rankAlternatives(query, [product({})], { topK: 1, category: "shopping" });
    expect(ranked[0].rankingFactors.weights).toEqual(RANKING_WEIGHTS);
    expect(ranked[0].rankingFactors.category_match).toBe(1);
    expect(ranked[0].finalScore).toBeGreaterThan(0);
  });
});

describe("VectorStore", () => {
  const makeStore = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vectorstore-"));
    return new VectorStore(path.join(dir, "index.json"));
  };

  it("deduplicates candidates by stable id", () => {
    const store = makeStore();
    const candidate = {
      id: stableProductId({ name: "Allbirds Wool Runners", merchant: "Allbirds", category: "shopping" }),
      name: "Allbirds Wool Runners",
      merchant: "Allbirds",
      category: "shopping",
      price: 98,
      sustainabilityScore: 88,
      description: "wool shoes",
      embedding: V768(0.5),
    };
    expect(store.upsert(candidate)).toBe(true);
    expect(store.upsert({ ...candidate, price: 99 })).toBe(false); // same id -> update, not duplicate
    expect(store.size()).toBe(1);
  });

  it("prefers URL-based dedup keys when a URL exists", () => {
    const a = stableProductId({ url: "https://x.com/p/1", name: "Name A", merchant: "m", category: "c" });
    const b = stableProductId({ url: "https://x.com/p/1", name: "Different Name", merchant: "m2", category: "c2" });
    expect(a).toBe(b);
  });

  it("persists candidates to disk and reloads them", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vectorstore-"));
    const file = path.join(dir, "index.json");
    const writer = new VectorStore(file);
    writer.upsert({
      id: "p1",
      name: "Product",
      merchant: "Merchant",
      category: "shopping",
      price: 50,
      sustainabilityScore: 80,
      description: "sustainable",
      embedding: V768(0.5),
    });
    writer.save();

    const reader = new VectorStore(file);
    expect(reader.size()).toBe(1);
    const results = reader.search(V768(0.5), 1);
    expect(results[0].candidate.id).toBe("p1");
    expect(results[0].similarity).toBeCloseTo(1);
  });

  it("search returns best matches first", () => {
    const store = makeStore();
    store.upsert({ id: "near", name: "n", merchant: "m", category: "c", price: 1, sustainabilityScore: 50, description: "", embedding: V768(0.5) });
    store.upsert({ id: "far", name: "f", merchant: "m", category: "c", price: 1, sustainabilityScore: 50, description: "", embedding: V768(-0.5) });
    const results = store.search(V768(0.5), 2);
    expect(results[0].candidate.id).toBe("near");
    expect(results[1].candidate.id).toBe("far");
  });
});
