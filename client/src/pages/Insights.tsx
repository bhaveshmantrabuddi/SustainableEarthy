import SustainabilityTrendsSection from "@/components/dashboard/SustainabilityTrendsSection";
import CategoryBreakdownSection from "@/components/dashboard/CategoryBreakdownSection";
import SustainabilityScoreSection from "@/components/dashboard/SustainabilityScoreSection";

export default function Insights() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-800">Sustainability Insights</h1>
        <p className="text-neutral-600 mt-1">Detailed analysis of your environmental impact</p>
      </div>

      {/* Sustainability scores */}
      <SustainabilityScoreSection />

      {/* Sustainability trends and category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SustainabilityTrendsSection />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdownSection />
        </div>
      </div>
    </div>
  );
}
