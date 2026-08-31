import fs from "fs";
import path from "path";
import { cosineSimilarity } from "./geminiEmbeddings";

/**
 * Lightweight local vector store.
 *
 * Design decision (documented in README): the running app currently persists
 * nothing (MemStorage), and its data scale is a small curated catalog of
 * sustainable products. A JSON-file-backed index with in-process cosine search
 * avoids new infrastructure (pgvector/ChromaDB server) while still providing
 * real vector retrieval: candidates are embedded ONCE and persisted; only the
 * user purchase is embedded at query time. Swapping this class for pgvector
 * later only requires reimplementing upsert/search.
 */

export interface StoredCandidate {
  id: string; // stable identifier used for deduplication
  name: string;
  merchant: string;
  category: string;
  price: number;
  sustainabilityScore: number;
  url?: string;
  description: string;
  embedding: number[];
}

interface VectorIndexFile {
  version: 1;
  dimension: number;
  candidates: StoredCandidate[];
}

const DATA_DIR = path.resolve(process.cwd(), ".data");
const INDEX_FILE = path.join(DATA_DIR, "vector-index.json");

/** Stable, human-insensible dedup key: URL when available, else name+merchant. */
export function stableProductId(product: {
  url?: string;
  name: string;
  merchant: string;
  category: string;
}): string {
  if (product.url && product.url.length > 0) {
    return `url:${product.url.trim().toLowerCase()}`;
  }
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return `name:${norm(product.name)}|${norm(product.merchant || product.category)}`;
}

export class VectorStore {
  private candidates = new Map<string, StoredCandidate>();
  private dimension: number | null = null;
  private loaded = false;

  constructor(private readonly filePath: string = INDEX_FILE) {}

  load(): void {
    if (this.loaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = JSON.parse(fs.readFileSync(this.filePath, "utf-8")) as VectorIndexFile;
        if (raw && raw.version === 1 && Array.isArray(raw.candidates)) {
          this.dimension = raw.dimension ?? null;
          for (const candidate of raw.candidates) {
            this.candidates.set(candidate.id, candidate);
          }
        }
      }
    } catch (error) {
      // Corrupt index -> start fresh rather than crash; it will be re-embedded.
      console.error("[vectorStore] Failed to load index, rebuilding:", error);
      this.candidates.clear();
    }
    this.loaded = true;
  }

  save(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const payload: VectorIndexFile = {
      version: 1,
      dimension: this.dimension ?? 0,
      candidates: Array.from(this.candidates.values()),
    };
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload));
    fs.renameSync(tmp, this.filePath);
  }

  size(): number {
    this.load();
    return this.candidates.size;
  }

  has(id: string): boolean {
    return this.candidates.has(id);
  }

  /**
   * Insert or update a candidate. Deduplication is by stable id, so repeated
   * seeding never duplicates products and never re-embeds known ones.
   * Returns true when a new embedding was stored.
   */
  upsert(candidate: StoredCandidate): boolean {
    this.load();
    if (this.dimension === null) this.dimension = candidate.embedding.length;
    if (this.dimension !== candidate.embedding.length) {
      throw new Error(
        `Embedding dimension mismatch: index has ${this.dimension}, candidate has ${candidate.embedding.length}`,
      );
    }
    const isNew = !this.candidates.has(candidate.id);
    this.candidates.set(candidate.id, candidate);
    return isNew;
  }

  all(): StoredCandidate[] {
    this.load();
    return Array.from(this.candidates.values());
  }

  /** Cosine-similarity nearest-neighbour search, best first. */
  search(queryVector: number[], topK: number): { candidate: StoredCandidate; similarity: number }[] {
    this.load();
    return this.all()
      .map((candidate) => ({ candidate, similarity: cosineSimilarity(queryVector, candidate.embedding) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.max(0, topK));
  }
}

export const vectorStore = new VectorStore();
