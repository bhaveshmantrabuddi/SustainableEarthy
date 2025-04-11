import { useQuery } from "@tanstack/react-query";
import { Leaf, ChevronDown, ChevronUp } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  ecoScore: number;
}

// Helper for determining color based on category
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    "groceries": "#2E7D32", // primary
    "transportation": "#00695C", // secondary
    "dining": "#FFC107", // accent
    "shopping": "#E0E0E0", // neutral
    "utilities": "#4CAF50",
    "housing": "#00897B",
    "health": "#FFCA28",
    "education": "#1B5E20",
    "travel": "#004D40",
    "entertainment": "#FFA000",
    "food & drink": "#2E7D32",
  };

  // Find matching category (case-insensitive)
  for (const [key, value] of Object.entries(colors)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return "#E0E0E0"; // Default neutral
};

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p>${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

// We'll use labelLine={true} and let the Recharts legend handle the category names
// This way we don't need to render our own labels
const renderCustomizedLabel = () => null;

export default function SpendingCategoryPieChart() {
  const { data, isLoading } = useQuery<CategoryBreakdown[]>({
    queryKey: ['/api/category-breakdowns'],
  });
  const [isOpen, setIsOpen] = useState(false);

  // Prepare data for pie chart
  const chartData: ChartDataItem[] = data?.map((category: CategoryBreakdown) => ({
    name: category.category.charAt(0).toUpperCase() + category.category.slice(1),
    value: category.amount,
    ecoScore: category.ecoScore
  })) || [];

  const firstEcoScore = data && data.length > 0 ? data[0].ecoScore : 76;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 mb-8">
      <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-6">Spending Category Breakdown</h2>
      
      {isLoading ? (
        <div className="flex flex-col items-center space-y-6 py-8">
          <Skeleton className="w-64 h-64 rounded-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="w-3 h-3 rounded-full mr-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Pie Chart - Full Width */}
          <div className="mx-auto w-full h-[300px] relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  paddingAngle={3}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {chartData.map((entry: ChartDataItem, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getCategoryColor(entry.name)} 
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="bg-white bg-opacity-80 rounded-full p-3 shadow-sm">
                <span className="text-sm text-neutral-700 font-medium block">Total Impact</span>
                <span className="text-2xl font-bold text-primary block">{firstEcoScore}/100</span>
              </div>
            </div>
          </div>
          
          {/* Collapsible Category Details Section */}
          <Collapsible 
            open={isOpen} 
            onOpenChange={setIsOpen}
            className="w-full border rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex w-full justify-between items-center p-4 hover:bg-neutral-50"
              >
                <div className="flex items-center">
                  <h3 className="text-md font-semibold text-neutral-800">Category Details</h3>
                  {data && data.length > 0 && (
                    <span className="ml-2 text-xs bg-neutral-100 text-neutral-700 rounded-full px-2 py-0.5">
                      {data.length} categories
                    </span>
                  )}
                </div>
                {isOpen ? 
                  <ChevronUp className="h-4 w-4 text-neutral-500" /> : 
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                }
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="space-y-4 p-4 pt-0 bg-neutral-50">
                {data?.map((category: CategoryBreakdown, index: number) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        ></div>
                        <span className="text-sm font-medium capitalize">{category.category}</span>
                      </div>
                      <span className="text-sm font-bold">${category.amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-neutral-100 h-2 rounded-full w-full mt-1">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${category.ecoScore}%`, 
                          backgroundColor: getCategoryColor(category.category) 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between mt-1 text-xs text-neutral-600">
                      <span>Eco Impact:</span>
                      <div className="flex items-center">
                        <Leaf className="h-3 w-3 mr-1 text-primary" />
                        <span>{category.ecoScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!data || data.length === 0) && (
                  <div className="p-4 bg-neutral-50 rounded-lg text-center text-neutral-600">
                    No spending data available. Upload a CSV to see your category breakdown.
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}