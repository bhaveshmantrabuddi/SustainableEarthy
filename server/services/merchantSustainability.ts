import fs from "fs";
import path from "path";
import { GEMINI_CONFIG, getGeminiClient, withRetries } from "./geminiClient";

/**
 * Merchant sustainability research grounded in Google Search.
 *
 * Uses Gemini's google_search tool so the assessment is based on current web
 * evidence rather than model memory alone. Grounding citations (source URLs)
 * returned by the API are captured and surfaced to the frontend.
 *
 * IMPORTANT: the numeric score is an EcoFinance-generated ASSESSMENT derived
 * from the retrieved evidence — it is NOT an objective, certified ESG score.
 */

export interface MerchantSustainability {
  merchant: string;
  /** EcoFinance-generated estimate (0-100) or null when not parseable. */
  sustainability_score: number | null;
  summary: string;
  positive_factors: string[];
  negative_factors: string[];
  /** Source URLs captured from Google Search grounding metadata. */
  sources: { title: string; uri: string }[];
  /** Honest labeling of what this score is. */
  assessment_type: "ecofinance_generated_assessment";
  /** Whether the model's reply parsed as valid JSON. */
  wellformed: boolean;
}

export const MERCHANT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheFile {
  version: 1;
  entries: Record<string, { fetchedAt: string; result: MerchantSustainability }>;
}

const CACHE_FILE = path.resolve(process.cwd(), ".data/merchant-research-cache.json");

function readCache(): CacheFile {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as CacheFile;
      if (parsed?.version === 1 && parsed.entries) return parsed;
    }
  } catch (error) {
    console.error("[merchantSustainability] Cache unreadable, starting fresh:", error);
  }
  return { version: 1, entries: {} };
}

function writeCache(cache: CacheFile): void {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  const tmp = `${CACHE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache));
  fs.renameSync(tmp, CACHE_FILE);
}

export function clearMerchantCache(): void {
  writeCache({ version: 1, entries: {} });
}

const RESEARCH_PROMPT = (merchant: string) => `You are researching the environmental sustainability record of the company "${merchant}".
Use Google Search to find current, credible information.
Cover, when available: environmental initiatives, emissions/carbon commitments,
sustainable sourcing, packaging, recycling/circularity, supply-chain practices,
and any credible recent environmental controversies.

Respond with ONLY a JSON object in exactly this shape (no markdown, no commentary):
{
  "sustainability_score": <integer 0-100, your EcoFinance-style assessment of the merchant's environmental record>,
  "summary": "<2-3 sentence evidence-based summary>",
  "positive_factors": ["<factor>", "..."],
  "negative_factors": ["<factor>", "..."]
}`;

/** Extract grounding source citations from a generateContent response, defensively. */
export function extractGroundingSources(response: unknown): { title: string; uri: string }[] {
  const r = response as {
    candidates?: {
      groundingMetadata?: {
        groundingChunks?: { web?: { uri?: string; title?: string } }[];
      };
    }[];
  };
  const chunks = r?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: { title: string; uri: string }[] = [];
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    if (uri) {
      sources.push({ title: chunk?.web?.title ?? uri, uri });
    }
  }
  return sources;
}

/** Parse the model's JSON reply; falls back to raw text when malformed. */
export function parseMerchantReply(
  merchant: string,
  text: string,
): Omit<MerchantSustainability, "sources" | "assessment_type"> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned) as {
      sustainability_score?: unknown;
      summary?: unknown;
      positive_factors?: unknown;
      negative_factors?: unknown;
    };
    const score =
      typeof parsed.sustainability_score === "number" ? parsed.sustainability_score : null;
    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 8) : [];
    return {
      merchant,
      sustainability_score: score === null ? null : Math.max(0, Math.min(100, Math.round(score))),
      summary: typeof parsed.summary === "string" ? parsed.summary : text.slice(0, 500),
      positive_factors: toList(parsed.positive_factors),
      negative_factors: toList(parsed.negative_factors),
      wellformed: true,
    };
  } catch {
    // Malformed model reply: degrade gracefully instead of failing the request.
    return {
      merchant,
      sustainability_score: null,
      summary: text.slice(0, 500),
      positive_factors: [],
      negative_factors: [],
      wellformed: false,
    };
  }
}

/**
 * Research a merchant with Google Search grounding. Results are cached on disk
 * for MERCHANT_CACHE_TTL_MS so repeated transactions with the same merchant do
 * not trigger repeated (billable) search queries.
 *
 * Throws MissingApiKeyError (no key) / GeminiServiceError (API failure);
 * callers are expected to catch and degrade gracefully.
 */
export async function researchMerchant(
  merchant: string,
  options: { forceRefresh?: boolean } = {},
): Promise<MerchantSustainability> {
  const key = merchant.trim().toLowerCase();
  if (!key) throw new Error("Merchant name is required.");

  const cache = readCache();
  const cached = cache.entries[key];
  if (
    !options.forceRefresh &&
    cached &&
    Date.now() - new Date(cached.fetchedAt).getTime() < MERCHANT_CACHE_TTL_MS
  ) {
    return cached.result;
  }

  const client = getGeminiClient();
  const response = await withRetries(() =>
    client.models.generateContent({
      model: GEMINI_CONFIG.textModel,
      contents: RESEARCH_PROMPT(merchant.trim()),
      config: {
        tools: [{ googleSearch: {} }],
        httpOptions: { timeout: GEMINI_CONFIG.requestTimeoutMs * 2 },
      },
    }),
  );

  const text = response?.text ?? "";
  const result: MerchantSustainability = {
    ...parseMerchantReply(merchant.trim(), text),
    sources: extractGroundingSources(response),
    assessment_type: "ecofinance_generated_assessment",
  };

  cache.entries[key] = { fetchedAt: new Date().toISOString(), result };
  writeCache(cache);
  return result;
}

