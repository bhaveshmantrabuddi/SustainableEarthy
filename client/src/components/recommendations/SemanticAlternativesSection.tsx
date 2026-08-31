import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MapPin, Leaf, ExternalLink, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransactionItem {
  id: number;
  merchant: string;
  category: string;
  amount: number;
  ecoScore: number;
}

interface SemanticAlternative {
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
}

interface LocalAlternative {
  name: string;
  address: string;
  distance_or_location_context: string;
  price_context: string;
  sustainability_reason: string;
  maps_source: string;
}

interface MerchantSustainability {
  merchant: string;
  sustainability_score: number | null;
  summary: string;
  positive_factors: string[];
  negative_factors: string[];
  sources: { title: string; uri: string }[];
  assessment_type: string;
}

interface RecommendationResult {
  purchase: TransactionItem;
  semantic_alternatives: SemanticAlternative[];
  local_alternatives: LocalAlternative[] | null;
  merchant_sustainability: MerchantSustainability | null;
  warnings: string[];
}

export default function SemanticAlternativesSection() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<TransactionItem[]>({
    queryKey: ["/api/transactions"],
  });

  const selected = transactions?.find((t) => t.id === selectedId) ?? transactions?.[0];

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No transaction selected");
      const response = await apiRequest("POST", "/api/recommendations", {
        transaction: {
          merchant: selected.merchant,
          category: selected.category,
          amount: selected.amount,
        },
        ...(coords ?? {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(body.message || "Request failed");
      }
      return response.json() as Promise<RecommendationResult>;
    },
    onSuccess: (data) => setResult(data),
    onError: (error: Error) => {
      toast({ title: "Could not get alternatives", description: error.message, variant: "destructive" });
    },
  });

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location unavailable", description: "Your browser does not support geolocation.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({
          latitude: Number(position.coords.latitude.toFixed(5)),
          longitude: Number(position.coords.longitude.toFixed(5)),
        }),
      () =>
        toast({
          title: "Location permission denied",
          description: "Nearby-alternative suggestions need your location. You can still get product alternatives.",
          variant: "destructive",
        }),
    );
  };

  return (
    <div className="mt-8 mb-4 bg-white rounded-xl shadow-sm p-5 border border-neutral-200">
      <div className="flex items-center mb-1">
        <Sparkles className="h-5 w-5 text-primary mr-2" />
        <h2 className="text-lg font-semibold font-heading text-neutral-800">More Sustainable Alternatives</h2>
      </div>
      <p className="text-neutral-600 text-sm mb-4">
        Pick a purchase and get semantically matched sustainable alternatives (Gemini 768D embeddings),
        merchant sustainability research (Google Search grounding), and nearby options (Google Maps grounding).
      </p>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-5">
        {isLoading ? (
          <Skeleton className="h-10 w-72" />
        ) : (
          <select
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white"
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {(transactions ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.merchant} · {t.category} · ${Number(t.amount).toFixed(2)} (eco {t.ecoScore})
              </option>
            ))}
          </select>
        )}

        {coords ? (
          <span className="inline-flex items-center text-sm text-neutral-600">
            <MapPin className="h-4 w-4 mr-1 text-success" />
            Location set
            <button className="ml-2 text-neutral-400 hover:text-neutral-600" onClick={() => setCoords(null)} aria-label="Clear location">
              <X className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <Button variant="outline" className="text-primary border-primary" onClick={handleUseLocation}>
            <MapPin className="mr-2 h-4 w-4" /> Use my location
          </Button>
        )}

        <Button
          className="bg-primary hover:bg-primary-dark text-white md:ml-auto"
          disabled={!selected || requestMutation.isPending}
          onClick={() => requestMutation.mutate()}
        >
          {requestMutation.isPending ? "Finding alternatives…" : "Find alternatives"}
        </Button>
      </div>


      {result && (
        <div className="space-y-5">
          {result.warnings?.length > 0 && (
            <div className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              {result.warnings.map((w, i) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          )}

          {/* Merchant sustainability (Google Search grounding) */}
          {result.merchant_sustainability && (
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Leaf className="h-4 w-4 text-primary mr-2" />
                <h3 className="text-md font-semibold text-neutral-800">
                  {result.merchant_sustainability.merchant} — sustainability assessment
                </h3>
                {result.merchant_sustainability.sustainability_score !== null && (
                  <span className="ml-auto text-sm font-medium text-primary">
                    {result.merchant_sustainability.sustainability_score}/100
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600">{result.merchant_sustainability.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {result.merchant_sustainability.positive_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-success mb-1">Positive factors</p>
                    <ul className="text-xs text-neutral-600 list-disc list-inside">
                      {result.merchant_sustainability.positive_factors.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {result.merchant_sustainability.negative_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">Negative factors</p>
                    <ul className="text-xs text-neutral-600 list-disc list-inside">
                      {result.merchant_sustainability.negative_factors.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                EcoFinance-generated assessment based on retrieved web evidence — not a certified ESG rating.
              </p>
              {result.merchant_sustainability.sources?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.merchant_sustainability.sources.slice(0, 5).map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center">
                      {s.title} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Semantic alternatives (768D embedding retrieval) */}
          {result.semantic_alternatives.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-2">Semantic matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.semantic_alternatives.map((alt) => (
                  <div key={alt.id} className="border border-neutral-200 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-neutral-800">{alt.name}</h4>
                      <span className="text-xs text-success font-medium">{alt.sustainability_score}/100</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">{alt.merchant} · {alt.category}</p>
                    <p className="text-xs text-neutral-600 flex-1">{alt.reason}</p>
                    <div className="mt-3 text-xs text-neutral-500 flex items-center justify-between">
                      <span>Price: ${alt.price.toFixed(2)} · similarity {(alt.similarity * 100).toFixed(0)}%</span>
                      {alt.url && (
                        <a href={alt.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center">
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby alternatives (Google Maps grounding) */}
          {result.local_alternatives && result.local_alternatives.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-2">Nearby alternatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.local_alternatives.map((place, i) => (
                  <div key={i} className="border border-neutral-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-neutral-800">{place.name}</h4>
                    <p className="text-xs text-neutral-500">{place.address}</p>
                    <p className="text-xs text-neutral-500">{place.distance_or_location_context}</p>
                    <p className="text-xs text-neutral-600 mt-2">{place.sustainability_reason}</p>
                    <p className="text-[11px] text-neutral-400 mt-2">
                      {place.price_context} · {place.maps_source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

