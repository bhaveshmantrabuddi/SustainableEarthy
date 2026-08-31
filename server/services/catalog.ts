import fs from "fs";
import path from "path";
import { generateProductEmbedding } from "./geminiEmbeddings";
import { stableProductId, vectorStore } from "./vectorStore";

/**
 * Catalog of sustainable alternative products (the retrieval corpus).
 *
 * Products are embedded ONCE and persisted in the vector store; seeding is
 * idempotent and deduplicated (see vectorStore.stableProductId). Only new or
 * changed candidates trigger Gemini embedding calls.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  merchant: string;
  category: string;
  price: number;
  sustainabilityScore: number;
  url?: string;
  description: string;
}

const CATALOG_FILE = path.resolve(process.cwd(), "server/data/sustainable-catalog.json");

export function loadCatalog(): CatalogProduct[] {
  const raw = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf-8")) as {
    products: CatalogProduct[];
  };
  if (!Array.isArray(raw.products)) {
    throw new Error("Malformed sustainable-catalog.json (missing products array).");
  }
  return raw.products;
}

/**
 * Ensure every catalog product exists in the vector store with an embedding.
 * Returns the embedded candidates (for search). Safe to call on every request:
 * it is a no-op (no Gemini calls) once the store is warm.
 */
export async function ensureCatalogEmbedded(): Promise<(CatalogProduct & { embedding: number[] })[]> {
  const products = loadCatalog();
  let inserted = 0;
  for (const product of products) {
    const id = stableProductId(product);
    if (vectorStore.has(id)) continue;
    const embedding = await generateProductEmbedding(product);
    vectorStore.upsert({
      id,
      name: product.name,
      merchant: product.merchant,
      category: product.category,
      price: product.price,
      sustainabilityScore: product.sustainabilityScore,
      url: product.url,
      description: product.description,
      embedding,
    });
    inserted++;
  }
  if (inserted > 0) {
    vectorStore.save();
    console.log(`[catalog] Embedded and persisted ${inserted} new product embedding(s).`);
  }
  return vectorStore.all() as (CatalogProduct & { embedding: number[] })[];
}
