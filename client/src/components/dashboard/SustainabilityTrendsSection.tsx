import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Define data type for sustainability trends
interface TrendDataPoint {
  date: string;
  month: string;
  day: number;
  ecoScore: number;
  carbonFootprint: number;
  sustainablePurchases: number;
  waterUsage: number;
}

type TimeRange = 'Month' | 'Quarter' | 'Year';

// Custom tooltip to show all metrics when hovering
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-neutral-200 shadow-sm rounded-lg text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mb-1 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <p className="text-neutral-700">
              {entry.name}: {entry.value} 
              {entry.name === 'Eco Score' && '/100'}
              {entry.name === 'Carbon Footprint' && ' kg'}
              {entry.name === 'Sustainable Purchases' && '%'}
              {entry.name === 'Water Usage' && ' kL'}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SustainabilityTrendsSection() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Quarter');
  
  // Fetch sustainability trend data from API
  const { data, isLoading, error } = useQuery<TrendDataPoint[]>({
    queryKey: ['/api/sustainability-trends', { timeRange }],
    // Include timeRange as part of the query key to refetch when it changes
  });
  
  // Create a formatted label for X-axis that shows month and day
  const formattedData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      label: `${item.month} ${item.day}` // Format: "Apr 15"
    }));
  }, [data]);
  
  // Calculate averages and improvements
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        avgEcoScore: 0,
        improvement: 0,
        carbonSaved: 0,
        waterSaved: 0
      };
    }
    
    // Calculate averages
    const avgEcoScore = data.reduce((sum, item) => sum + item.ecoScore, 0) / data.length;
    
    // Calculate improvement (difference between latest and earliest)
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const earliest = sortedData[0];
    const latest = sortedData[sortedData.length - 1];
    const improvement = latest && earliest 
      ? ((latest.ecoScore - earliest.ecoScore) / earliest.ecoScore) * 100 
      : 0;
    
    // Calculate carbon saved (rough estimate based on improvement)
    const carbonSaved = latest && earliest
      ? (earliest.carbonFootprint - latest.carbonFootprint)
      : 0;
      
    // Calculate water saved (rough estimate based on improvement)
    const waterSaved = latest && earliest
      ? (earliest.waterUsage - latest.waterUsage)
      : 0;
    
    return {
      avgEcoScore: Math.round(avgEcoScore * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      carbonSaved: Math.round(carbonSaved * 10) / 10,
      waterSaved: Math.round(waterSaved * 10) / 10
    };
  }, [data]);
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 h-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        
        <Skeleton className="h-64 w-full" />
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-24 mx-auto mb-2" />
              <Skeleton className="h-6 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 h-full">
        <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Sustainability Trends</h2>
        <div className="bg-red-50 p-4 rounded-lg text-red-800">
          <p>Unable to load trend data. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Handle empty data state
  const hasData = data && data.length > 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold font-heading text-neutral-800">Sustainability Trends</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Month' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Month')}
          >
            Month
          </button>
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Quarter' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Quarter')}
          >
            Quarter
          </button>
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Year' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Year')}
          >
            Year
          </button>
        </div>
      </div>
      
      {!hasData ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-neutral-600 mb-2">No trend data available for this time period.</p>
            <p className="text-sm text-neutral-500">Upload more transaction data to see your sustainability trends.</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="label" stroke="#757575" fontSize={12} />
              <YAxis stroke="#757575" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <defs>
                <linearGradient id="ecoScoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="ecoScore" 
                stroke="#2E7D32" 
                fillOpacity={0.2}
                fill="url(#ecoScoreGradient)" 
                name="Eco Score"
              />
              <Line 
                type="monotone" 
                dataKey="carbonFootprint" 
                stroke="#00695C"
                strokeDasharray="5 5"
                name="Carbon Footprint"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="sustainablePurchases"
                stroke="#FFB300"
                strokeWidth={2}
                name="Sustainable Purchases"
              />
              <Line
                type="monotone"
                dataKey="waterUsage"
                stroke="#1976D2"
                strokeWidth={1.5}
                name="Water Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-neutral-600">Avg. Eco Score</p>
          <p className="text-lg font-semibold text-primary">{metrics.avgEcoScore}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Improvement</p>
          <p className={`text-lg font-semibold ${metrics.improvement >= 0 ? 'text-success' : 'text-danger'}`}>
            {metrics.improvement >= 0 ? '+' : ''}{metrics.improvement}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Carbon Saved</p>
          <p className="text-lg font-semibold text-secondary">{metrics.carbonSaved}kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Water Saved</p>
          <p className="text-lg font-semibold text-primary-light">{metrics.waterSaved}kL</p>
        </div>
      </div>
    </div>
  );
}
