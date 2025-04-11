import SustainabilityTrendsSection from "@/components/dashboard/SustainabilityTrendsSection";
import SpendingCategoryPieChart from "@/components/dashboard/SpendingCategoryPieChart";
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

      {/* Category breakdown pie chart - New dedicated section */}
      <SpendingCategoryPieChart />

      {/* Sustainability trends section */}
      <div className="mb-8">
        <SustainabilityTrendsSection />
      </div>
    </div>
  );
}
