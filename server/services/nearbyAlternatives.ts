import { GEMINI_CONFIG, getGeminiClient, withRetries } from "./geminiClient";

/**
 * Location-aware sustainable alternatives via Gemini Grounding with Google Maps.
 *
 * - Location is REQUEST-SCOPED: latitude/longitude arrive with the API request
 *   (from the user's browser geolocation, only when the user consents) and are
 *   never persisted server-side.
 * - The google_maps tool is only enabled when a location was actually provided,
 *   per Google's guidance to avoid unnecessary billable Maps usage.
 * - Google Maps may not expose product-level prices; when unavailable we return
 *   the price level/context the model reports (or "unavailable") and never
 *   fabricate a number.
 */

export interface LocalAlternative {
  name: string;
  address: string;
  distance_or_location_context: string;
  price_context: string;
  sustainability_reason: string;
  maps_source: string;
}

export interface NearbyAlternativesArgs {
  merchant: string;
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
}

export function isLocationProvided(args: { latitude?: number; longitude?: number }): boolean {
  return (
    typeof args.latitude === "number" &&
    Number.isFinite(args.latitude) &&
    typeof args.longitude === "number" &&
    Number.isFinite(args.longitude)
  );
}

const MAPS_PROMPT = (args: NearbyAlternativesArgs) => `A user bought from "${args.merchant}" (category: ${args.category}${args.description ? `; ${args.description}` : ""}).
They are near latitude ${args.latitude}, longitude ${args.longitude}.
Use Google Maps to find up to 4 specific nearby businesses that are MORE SUSTAINABLE
alternatives matching the same need (e.g. secondhand, local, plant-based, refill,
repair, public/active transport options, as relevant to the category).
Prefer places where sustainable choices are the core offering.

Respond with ONLY a JSON array (no markdown, no commentary), max 4 items:
[
  {
    "name": "<business name>",
    "address": "<street address or area>",
    "distance_or_location_context": "<e.g. 'about 1.2 km north' or 'in the Mission district'>",
    "price_context": "<price level like '$$' or 'comparable pricing'; if exact pricing is unavailable say 'exact pricing unavailable'>",
    "sustainability_reason": "<1 sentence why this is a more sustainable alternative>"
  }
]
If no relevant businesses can be found, respond with []`;

export function parsePlacesReply(text: string): Omit<LocalAlternative, "maps_source">[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]");
  const candidate = jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return []; // invalid model response -> caller degrades gracefully
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && typeof (item as any).name === "string")
    .slice(0, 4)
    .map((item) => ({
      name: String(item.name),
      address: typeof item.address === "string" ? item.address : "",
      distance_or_location_context:
        typeof item.distance_or_location_context === "string" ? item.distance_or_location_context : "",
      price_context:
        typeof item.price_context === "string" && item.price_context.trim().length > 0
          ? item.price_context
          : "exact pricing unavailable",
      sustainability_reason: typeof item.sustainability_reason === "string" ? item.sustainability_reason : "",
    }));
}

/**
 * Find nearby sustainable alternatives with Google Maps grounding.
 * Returns null when no location was provided (feature intentionally skipped),
 * and an empty array when Maps/model output was unusable.
 *
 * Throws MissingApiKeyError / GeminiServiceError; callers catch and degrade.
 */
export async function findNearbyAlternatives(
  args: NearbyAlternativesArgs,
): Promise<LocalAlternative[] | null> {
  if (!isLocationProvided(args)) {
    return null; // Maps grounding is skipped — no location, no Maps call.
  }

  const client = getGeminiClient();
  const response = await withRetries(() =>
    client.models.generateContent({
      model: GEMINI_CONFIG.textModel,
      contents: MAPS_PROMPT(args),
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: args.latitude, longitude: args.longitude },
          },
        },
        httpOptions: { timeout: GEMINI_CONFIG.requestTimeoutMs * 2 },
      },
    }),
  );

  const text = response?.text ?? "";
  const places = parsePlacesReply(text);
  return places.map((place) => ({
    ...place,
    maps_source: "Google Maps via Gemini grounding",
  }));
}
