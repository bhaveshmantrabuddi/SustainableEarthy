import { useQuery } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p>{payload[0].payload.displayAmount}</p>
      </div>
    );
  }
  return null;
};

// Helper for determining color based on eco score
const getEcoScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 65) return "text-warning";
  return "text-danger";
};

// Helper for determining color based on category
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    "groceries": "#2E7D32", // green
    "transportation": "#1976D2", // blue
    "dining": "#FFA000", // amber
    "shopping": "#D32F2F", // red
    "utilities": "#7B1FA2", // purple
    "housing": "#00796B", // teal
    "health": "#F06292", // pink
    "education": "#FFD54F", // yellow
    "travel": "#FF5722", // deep orange
    "entertainment": "#9C27B0", // purple
    "food & drink": "#43A047", // green
    "food and drink": "#43A047", // green
    "recreation": "#673AB7", // deep purple
    "payment": "#0097A7", // cyan
    "transfer": "#FF9800", // orange
    "shops": "#E91E63", // pink
  };

  // Find matching category (case-insensitive)
  for (const [key, value] of Object.entries(colors)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return "#607D8B"; // Blue grey as default
};

// Define types for category data
interface CategoryBreakdown {
  userId: number;
  category: string;
  amount: number;
  ecoScore: number;
  id: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  displayAmount: string;
}

export default function CategoryBreakdownSection() {
  const { data, isLoading } = useQuery<CategoryBreakdown[]>({
    queryKey: ['/api/category-breakdowns'],
  });

  // Filter out transfers as they have no environmental impact
  const filteredData = data?.filter((category: CategoryBreakdown) => 
    !category.category.toLowerCase().includes('transfer')
  );
  
  // Prepare data for pie chart
  const chartData: ChartDataItem[] = filteredData?.map((category: CategoryBreakdown) => ({
    name: category.category.charAt(0).toUpperCase() + category.category.slice(1),
    value: Math.max(category.amount, 0.01), // Ensure positive value for visibility
    displayAmount: `$${category.amount.toFixed(2)}` // For display purposes
  })) || [];
  
  // Log data to verify proportions
  console.log("Category breakdown data:", chartData);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 h-full">
      <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Spending by Category</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
          
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-3 h-3 rounded-full mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    label
                  >
                    {chartData.map((entry: ChartDataItem, index: number) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-neutral-700 font-medium">Total Impact</span>
                <span className="text-lg font-bold text-primary">
                  {filteredData && filteredData.length > 0 ? 
                    Math.round(filteredData.reduce((sum, item) => sum + item.ecoScore, 0) / filteredData.length) 
                    : 0}/100
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredData?.map((category: CategoryBreakdown, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: getCategoryColor(category.category) }}
                  ></div>
                  <span className="text-sm capitalize">{category.category}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">${Math.round(category.amount)}</span>
                  <div className={`flex items-center ${getEcoScoreColor(category.ecoScore)} text-xs font-medium`}>
                    <Leaf className="h-3 w-3 mr-1" />
                    <span>{category.ecoScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Areas to Improve</h3>
            <div className="bg-neutral-100 p-3 rounded-lg text-sm">
              <div className="flex items-start mb-2">
                <i className="ri-shopping-bag-line text-danger mt-0.5 mr-2"></i>
                <p>Consider sustainable clothing brands to improve your shopping eco-score</p>
              </div>
              <div className="flex items-start">
                <i className="ri-car-line text-warning mt-0.5 mr-2"></i>
                <p>Try carpooling or public transport to lower your transportation footprint</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
