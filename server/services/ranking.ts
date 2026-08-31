import type { CatalogProduct } from "./catalog";
import { cosineSimilarity } from "./geminiEmbeddings";

/**
 * Ranking of sustainable alternatives.
 *
 * Retrieval happens in two stages (standard practice):
 *   1. Vector search pulls a larger semantic candidate pool (top N by cosine similarity).
 *   2. Final ranking combines simple, explainable weighted factors.
 *
 * final_score = SEMANTIC_WEIGHT * semantic_similarity
 *             + SUSTAINABILITY_WEIGHT * (sustainability_score / 100)
 *             + PRICE_WEIGHT * price_factor
 *             + CATEGORY_WEIGHT * category_match
 *
 * All factors are in [0, 1]; weights are named constants so the trade-off is
 * easy to explain and adjust. No black-box ML is involved at this stage.
 */

export const RANKING_WEIGHTS = {
  semantic: 0.55,
  sustainability: 0.25,
  price: 0.15,
  category: 0.05,
} as const;

/** How many semantic matches to retrieve before re-ranking (top-K uses fewer). */
export const SEMANTIC_CANDIDATE_POOL = 20;

export interface ScoredCandidate {
  product: CatalogProduct;
  /** Cosine similarity mapped to [0, 1]. */
  similarity: number;
  /** Raw cosine similarity in [-1, 1]. */
  cosine: number;
  /** Weighted combination of all factors, in [0, 1]. */
  finalScore: number;
  /** Individual ranking factors (exposed in debug/development mode). */
  rankingFactors: {
    semantic_similarity: number;
    sustainability_factor: number;
    price_factor: number;
    category_match: number;
    weights: typeof RANKING_WEIGHTS;
  };
}

function priceFactor(candidatePrice: number, referencePrice?: number): number {
  if (referencePrice === undefined || referencePrice <= 0 || candidatePrice <= 0) {
    return 0.5; // neutral when price context is unavailable — do not fabricate
  }
  // Cheaper than the original purchase scores best (1.0); equal prices 1.0;
  // increasingly expensive alternatives decay to 0 at 2x the reference price.
  const ratio = candidatePrice / referencePrice;
  return Math.max(0, Math.min(1, 1 - Math.max(0, ratio - 1)));
}

export function rankAlternatives(
  queryVector: number[],
  candidates: (CatalogProduct & { embedding: number[] })[],
  options: { topK?: number; referencePrice?: number; category?: string } = {},
): ScoredCandidate[] {
  const { topK = 5, referencePrice, category } = options;

  const scored = candidates.map((candidate) => {
    const cosine = cosineSimilarity(queryVector, candidate.embedding);
    const similarity = (cosine + 1) / 2; // map [-1, 1] -> [0, 1]
    const sustainabilityFactor = Math.max(0, Math.min(1, candidate.sustainabilityScore / 100));
    const pFactor = priceFactor(candidate.price, referencePrice);
    const categoryMatch =
      category && candidate.category.toLowerCase() === category.toLowerCase() ? 1 : 0;

    const finalScore =
      RANKING_WEIGHTS.semantic * similarity +
      RANKING_WEIGHTS.sustainability * sustainabilityFactor +
      RANKING_WEIGHTS.price * pFactor +
      RANKING_WEIGHTS.category * categoryMatch;

    return {
      product: candidate,
      similarity,
      cosine,
      finalScore,
      rankingFactors: {
        semantic_similarity: Number(similarity.toFixed(4)),
        sustainability_factor: Number(sustainabilityFactor.toFixed(4)),
        price_factor: Number(pFactor.toFixed(4)),
        category_match: categoryMatch,
        weights: RANKING_WEIGHTS,
      },
    } satisfies ScoredCandidate;
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored.slice(0, Math.max(0, topK));
}
