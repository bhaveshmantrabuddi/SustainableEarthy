import { MissingApiKeyError } from "./geminiClient";
import { ensureCatalogEmbedded } from "./catalog";
import { generateQueryEmbedding } from "./geminiEmbeddings";
import { SEMANTIC_CANDIDATE_POOL, rankAlternatives, type ScoredCandidate } from "./ranking";
import { vectorStore } from "./vectorStore";
import { researchMerchant, type MerchantSustainability } from "./merchantSustainability";
import {
  findNearbyAlternatives,
  isLocationProvided,
  type LocalAlternative,
} from "./nearbyAlternatives";

/**
 * Orchestrates the full semantic-recommendation flow for one purchase:
 *
 * purchase description (normalized merchant/category/description only)
 *   -> Gemini 768D query embedding
 *   -> vector search over persisted candidate embeddings (top-20 semantic pool)
 *   -> weighted re-ranking (semantic + sustainability + price + category)
 *   -> merchant sustainability via Gemini + Google Search grounding (cached)
 *   -> nearby alternatives via Gemini + Google Maps grounding (only when the
 *      request includes a user location; location is never persisted)
 *
 * Individual grounding features degrade gracefully: if one Gemini call fails,
 * that section is returned as null/[] with a warning instead of failing the
 * whole request. Only a missing API key or failed query embedding (which the
 * whole response depends on) surfaces as an error to the route.
 */

export interface PurchaseInput {
  merchant: string;
  category?: string;
  amount?: number;
  description?: string;
}

export interface SemanticAlternative {
  id: string;
  name: string;
  merchant: string;
  category: string;
  price: number;
  sustainability_score: number;
  similarity: number;
  final_score: number;
  url?: string;
  reason: string;
  ranking_factors?: ScoredCandidate["rankingFactors"]; // included in dev/debug mode
}

export interface RecommendationResponse {
  purchase: PurchaseInput;
  semantic_alternatives: SemanticAlternative[];
  local_alternatives: LocalAlternative[] | null; // null when feature skipped (no location)
  merchant_sustainability: MerchantSustainability | null;
  warnings: string[];
}

const DEBUG_RANKING = process.env.NODE_ENV !== "production";

/** Normalized purchase description sent to the embedding model (no card/PII data). */
export function buildPurchaseDescription(tx: PurchaseInput): string {
  const parts = [tx.merchant?.trim()];
  if (tx.description?.trim()) parts.push(tx.description.trim());
  if (tx.category?.trim()) parts.push(`(category: ${tx.category.trim()})`);
  return parts.filter(Boolean).join(" ");
}

export async function getRecommendationsForTransaction(
  transaction: PurchaseInput,
  options: { latitude?: number; longitude?: number } = {},
): Promise<RecommendationResponse> {
  const warnings: string[] = [];
  const description = buildPurchaseDescription(transaction);
  if (!description) {
    throw new Error("A merchant or purchase description is required.");
  }

  // 1. Semantic query embedding (768 dims). This is the only hard requirement:
  //    without it there are no semantic results at all.
  const queryVector = await generateQueryEmbedding(description);

  // 2. Ensure candidate embeddings exist (no-op once warm). A vector-store
  //    failure should not kill the request — degrade to empty results.
  try {
    await ensureCatalogEmbedded();
  } catch (error) {
    console.error("[recommendationService] Vector store failure:", error);
    warnings.push("Alternative-product index is unavailable; semantic results may be incomplete.");
  }

  // 3. Retrieve a larger semantic candidate pool, then re-rank with weights.
  const topPool = vectorStore.search(queryVector, SEMANTIC_CANDIDATE_POOL);
  const ranked = rankAlternatives(
    queryVector,
    topPool.map(({ candidate }) => candidate),
    {
      topK: 5,
      referencePrice: transaction.amount,
      category: transaction.category,
    },
  );

  const semanticAlternatives: SemanticAlternative[] = ranked.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    merchant: item.product.merchant,
    category: item.product.category,
    price: item.product.price,
    sustainability_score: item.product.sustainabilityScore,
    similarity: Number(item.similarity.toFixed(4)),
    final_score: Number(item.finalScore.toFixed(4)),
    url: item.product.url,
    reason: item.product.description,
    ...(DEBUG_RANKING ? { ranking_factors: item.rankingFactors } : {}),
  }));

  // 4. Merchant sustainability research via Google Search grounding (cached).
  let merchantSustainability: MerchantSustainability | null = null;
  try {
    merchantSustainability = await researchMerchant(transaction.merchant);
  } catch (error) {
    console.error("[recommendationService] Merchant research failed:", error);
    warnings.push("Merchant sustainability research is currently unavailable.");
  }

  // 5. Nearby alternatives via Google Maps grounding — only with user location.
  let localAlternatives: LocalAlternative[] | null = null;
  if (isLocationProvided(options)) {
    try {
      localAlternatives = await findNearbyAlternatives({
        merchant: transaction.merchant,
        category: transaction.category ?? "other",
        description: transaction.description,
        latitude: options.latitude as number,
        longitude: options.longitude as number,
      });
      if (localAlternatives !== null && localAlternatives.length === 0) {
        warnings.push("No usable nearby alternatives were found for this location.");
      }
    } catch (error) {
      console.error("[recommendationService] Maps grounding failed:", error);
      localAlternatives = null;
      warnings.push("Nearby-alternatives lookup is currently unavailable.");
    }
  } else {
    warnings.push("Location not provided — nearby-alternatives lookup skipped.");
  }

  return {
    purchase: {
      merchant: transaction.merchant,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
    },
    semantic_alternatives: semanticAlternatives,
    local_alternatives: localAlternatives,
    merchant_sustainability: merchantSustainability,
    warnings,
  };
}

