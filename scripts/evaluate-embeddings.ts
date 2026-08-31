/**
 * Embedding retrieval evaluation — DEMO evaluation, not a production benchmark.
 *
 * Purpose: evidence that Gemini 768D semantic retrieval is actually useful
 * compared to the simple keyword/category baseline the app used before.
 *
 * Dataset: small handcrafted set of realistic purchase queries, each with an
 * explicit list of expected-relevant candidate ids from the demo catalog
 * (server/data/sustainable-catalog.json). Because the set is tiny, results are
 * labeled as a demo evaluation; do not quote them as production-grade metrics.
 *
 * Metrics: Recall@5, Precision@5, MRR (mean reciprocal rank).
 *
 * Usage: GEMINI_API_KEY=... npm run eval:embeddings
 * (the keyword baseline runs without a key; the semantic part needs one)
 */
import { loadCatalog, ensureCatalogEmbedded } from "../server/services/catalog";
import { generateQueryEmbedding, cosineSimilarity } from "../server/services/geminiEmbeddings";
import { stableProductId, vectorStore } from "../server/services/vectorStore";

interface EvalQuery {
  query: string;
  category: string;
  price?: number;
  /** Candidate catalog ids that are relevant ground truth for this query. */
  relevant: string[];
}

/**
 * Demo evaluation set: realistic purchases and the catalog products a helpful
 * sustainable-alternatives feature should surface.
 */
export const EVAL_QUERIES: EvalQuery[] = [
  {
    query: "Nike running shoes",
    category: "shopping",
    price: 120,
    relevant: ["allbirds-wool-runners", "veja-campo-sneakers", "thousand-fell-recycled-sneaker"],
  },
  {
    query: "Starbucks coffee",
    category: "dining",
    price: 6.75,
    relevant: ["refill-coffee-local", "organic-coffee-whole-beans"],
  },
  {
    query: "fast fashion hoodie",
    category: "shopping",
    price: 45,
    relevant: ["patagonia-organic-hoodie", "tentree-classic-hoodie", "kuyichi-hoodie", "secondhand-thredup-sweater"],
  },
  {
    query: "Uber ride across town",
    category: "transportation",
    price: 24,
    relevant: ["public-transit-monthly-pass", "city-bike-share", "electric-carpool-credit"],
  },
  {
    query: "McDonald's cheeseburger meal",
    category: "dining",
    price: 11,
    relevant: ["vegan-meal-kit", "fast-casual-salad-bowl"],
  },
  {
    query: "Walmart groceries weekly shopping",
    category: "groceries",
    price: 85,
    relevant: ["local-farmers-market-produce", "imperfect-foods-box"],
  },
  {
    query: "plastic bottled water pack",
    category: "shopping",
    price: 8,
    relevant: ["refill-water-bottle"],
  },
  {
    query: "Amazon paper towel bulk pack",
    category: "shopping",
    price: 20,
    relevant: ["who-gives-a-crap-toilet-paper", "blueland-cleaning-refill"],
  },
];

export interface QueryMetrics {
  recallAt5: number;
  precisionAt5: number;
  reciprocalRank: number;
}

export function metricsForRanking(rankedIds: string[], relevant: Set<string>): QueryMetrics {
  const top5 = rankedIds.slice(0, 5);
  const hits = top5.filter((id) => relevant.has(id));
  const recallAt5 = relevant.size === 0 ? 0 : hits.length / relevant.size;
  const precisionAt5 = hits.length / 5;
  const firstHit = top5.findIndex((id) => relevant.has(id));
  const reciprocalRank = firstHit === -1 ? 0 : 1 / (firstHit + 1);
  return { recallAt5, precisionAt5, reciprocalRank };
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Baseline: simple keyword overlap between query tokens and product text. */
export function keywordRanking(
  query: string,
  catalog: { id: string; name: string; merchant: string; category: string; description: string }[],
): string[] {
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = catalog.map((product) => {
    const text = `${product.name} ${product.merchant} ${product.category} ${product.description}`.toLowerCase();
    const score = tokens.reduce((sum, token) => (text.includes(token) ? sum + 1 : sum), 0);
    return { id: product.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}

/** Semantic ranking: 768D query embedding vs persisted candidate embeddings. */
export function semanticRanking(
  queryVector: number[],
  candidates: { id: string; embedding: number[] }[],
): string[] {
  return candidates
    .map((c) => ({ id: c.id, score: cosineSimilarity(queryVector, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .map((c) => c.id);
}

async function main(): Promise<void> {
  const catalog = loadCatalog();
  const idByStableKey = new Map<string, string>();
  for (const product of catalog) idByStableKey.set(stableProductId(product), product.id);

  console.log("=== EcoFinance embedding evaluation (DEMO dataset — not production-grade) ===");
  console.log(`Queries: ${EVAL_QUERIES.length}, catalog candidates: ${catalog.length}\n`);

  // ---- Baseline: keyword matching ----------------------------------------
  const baselineMetrics: QueryMetrics[] = [];
  for (const eq of EVAL_QUERIES) {
    const ranked = keywordRanking(eq.query, catalog);
    baselineMetrics.push(metricsForRanking(ranked, new Set(eq.relevant)));
  }
  console.log("BASELINE keyword matching:");
  console.log(`  Recall@5:    ${average(baselineMetrics.map((m) => m.recallAt5)).toFixed(3)}`);
  console.log(`  Precision@5: ${average(baselineMetrics.map((m) => m.precisionAt5)).toFixed(3)}`);
  console.log(`  MRR:         ${average(baselineMetrics.map((m) => m.reciprocalRank)).toFixed(3)}\n`);

  // ---- Gemini 768D semantic retrieval ------------------------------------
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY not set — semantic metrics cannot be computed without it.");
    console.log("Re-run with: GEMINI_API_KEY=... npm run eval:embeddings");
    return;
  }

  await ensureCatalogEmbedded();
  const embedded = vectorStore.all();

  const semanticMetrics: QueryMetrics[] = [];
  for (const eq of EVAL_QUERIES) {
    const queryVector = await generateQueryEmbedding(eq.query);
    const rankedStableIds = semanticRanking(
      queryVector,
      embedded.map((c) => ({ id: c.id, embedding: c.embedding })),
    );
    const rankedCatalogIds = rankedStableIds.map((sid) => idByStableKey.get(sid) ?? sid);
    const m = metricsForRanking(rankedCatalogIds, new Set(eq.relevant));
    semanticMetrics.push(m);
    console.log(
      `  [${eq.query}] top5: ${rankedCatalogIds.slice(0, 5).join(", ")} -> R@5=${m.recallAt5.toFixed(2)} MRR=${m.reciprocalRank.toFixed(2)}`,
    );
  }
  console.log("\nGEMINI 768D semantic retrieval:");
  console.log(`  Recall@5:    ${average(semanticMetrics.map((m) => m.recallAt5)).toFixed(3)}`);
  console.log(`  Precision@5: ${average(semanticMetrics.map((m) => m.precisionAt5)).toFixed(3)}`);
  console.log(`  MRR:         ${average(semanticMetrics.map((m) => m.reciprocalRank)).toFixed(3)}`);
}

// Run directly (not when imported by tests)
if (process.argv[1] && process.argv[1].includes("evaluate-embeddings")) {
  main().catch((error) => {
    console.error("Evaluation failed:", error);
    process.exit(1);
  });
}

