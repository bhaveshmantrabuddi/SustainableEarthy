import { useQuery } from "@tanstack/react-query";
import { Leaf, Footprints, ShoppingBag, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ScoreCardProps = {
  title: string;
  score: number | string;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  percentage: number;
  info?: string;
  icon: React.ReactNode;
  color: string;
}

const ScoreCard = ({
  title,
  score,
  unit,
  trend,
  percentage,
  info,
  icon,
  color
}: ScoreCardProps) => (
  <div className="card bg-white rounded-xl shadow-sm p-5 border border-neutral-200 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-neutral-600 mb-4">{title}</h3>
    <div className="flex items-end">
      <div className={`text-3xl font-bold font-heading ${color}`}>{score}</div>
      {unit && <div className="text-xs font-medium ml-2 mb-1.5">{unit}</div>}
      {trend && (
        <div className={`text-xs ${trend.isPositive ? 'text-success' : 'text-danger'} font-medium ml-2 mb-1.5`}>
          <i className={trend.isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i> {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <div className="mt-3 eco-score">
      <div 
        className={`eco-score-fill ${
          title === "Water Usage" ? color : "bg-green-500"
        }`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    {info && <div className="mt-2 text-xs text-neutral-600">{info}</div>}
  </div>
);

export default function SustainabilityScoreSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/sustainability-score'],
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Your Sustainability Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-8 w-20 mb-3" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // If there's no data or error (404 Not Found), show empty state
  if (!data || error) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Your Sustainability Overview</h2>
        <div className="border border-dashed rounded-xl p-8 text-center border-neutral-300 bg-neutral-50">
          <Leaf className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h3 className="text-lg font-medium text-neutral-700 mb-2">No sustainability data yet</h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            Upload your first transaction data using the CSV uploader below to start tracking your sustainability metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Your Sustainability Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <ScoreCard
          title="Overall Eco-Score"
          score={data.overallScore}
          trend={{ value: 4, isPositive: true }}
          percentage={data.overallScore}
          info="Good - Top 25% of users"
          icon={<Leaf className="text-7xl text-green-500 absolute -top-2 -right-2" />}
          color="text-green-600"
        />
        
        {/* Carbon Footprint Card */}
        <ScoreCard
          title="Carbon Footprint"
          score={data.carbonFootprint}
          unit="kg CO₂"
          percentage={65}
          info="12% below average"
          icon={<Footprints className="text-7xl text-green-500 absolute -top-2 -right-2" />}
          color="text-green-600"
        />
        
        {/* Sustainable Purchases Card */}
        <ScoreCard
          title="Sustainable Purchases"
          score={data.sustainablePurchases}
          unit="%"
          percentage={data.sustainablePurchases}
          info="of all transactions"
          icon={<ShoppingBag className="text-7xl text-green-500 absolute -top-2 -right-2" />}
          color="text-green-600"
        />
        
        {/* Water Usage Card */}
        <ScoreCard
          title="Water Usage"
          score={data.waterUsage}
          unit="kL"
          percentage={45}
          info="Good - 20% below average"
          icon={<Droplets className="text-7xl text-green-500 absolute -top-2 -right-2" />}
          color="text-green-600"
        />
      </div>
    </div>
  );
}
