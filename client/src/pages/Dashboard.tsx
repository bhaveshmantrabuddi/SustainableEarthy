import DataUploadSection from "@/components/dashboard/DataUploadSection";
import SustainabilityScoreSection from "@/components/dashboard/SustainabilityScoreSection";
import SustainabilityTrendsSection from "@/components/dashboard/SustainabilityTrendsSection";
import SpendingCategoryPieChart from "@/components/dashboard/SpendingCategoryPieChart";
import TransactionHistorySection from "@/components/transactions/TransactionHistorySection";
import RecommendationsSection from "@/components/recommendations/RecommendationsSection";
import PlaidLinkSection from "@/components/plaid/PlaidLinkSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-800">Sustainability Dashboard</h1>
        <p className="text-neutral-600 mt-1">Track the environmental impact of your spending</p>
      </div>

      {/* Data Import Methods */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Import Your Transactions</h2>
        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="bank">Bank Connection</TabsTrigger>
          </TabsList>
          <TabsContent value="csv">
            <DataUploadSection />
          </TabsContent>
          <TabsContent value="bank">
            <PlaidLinkSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sustainability scores */}
      <SustainabilityScoreSection />

      {/* Category breakdown pie chart - New dedicated section */}
      <SpendingCategoryPieChart />

      {/* Sustainability trends */}
      <div className="mb-8">
        <SustainabilityTrendsSection />
      </div>

      {/* Transactions section */}
      <TransactionHistorySection />

      {/* Recommendations section */}
      <RecommendationsSection />
    </div>
  );
}
