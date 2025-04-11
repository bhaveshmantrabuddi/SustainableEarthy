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
      <div className={`eco-score-fill ${color}`} style={{ width: `${percentage}%` }}></div>
    </div>
    {info && <div className="mt-2 text-xs text-neutral-600">{info}</div>}
  </div>
);

export default function SustainabilityScoreSection() {
  const { data, isLoading } = useQuery({
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

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Your Sustainability Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <ScoreCard
          title="Overall Eco-Score"
          score={data?.overallScore || 76}
          trend={{ value: 4, isPositive: true }}
          percentage={data?.overallScore || 76}
          info="Good - Top 25% of users"
          icon={<Leaf className="text-7xl text-primary absolute -top-2 -right-2" />}
          color="text-primary"
        />
        
        {/* Carbon Footprint Card */}
        <ScoreCard
          title="Carbon Footprint"
          score={data?.carbonFootprint || 147}
          unit="kg CO₂"
          percentage={65}
          info="12% below average"
          icon={<Footprints className="text-7xl text-secondary absolute -top-2 -right-2" />}
          color="text-secondary"
        />
        
        {/* Sustainable Purchases Card */}
        <ScoreCard
          title="Sustainable Purchases"
          score={data?.sustainablePurchases || 68}
          unit="%"
          percentage={data?.sustainablePurchases || 68}
          info="of all transactions"
          icon={<ShoppingBag className="text-7xl text-accent absolute -top-2 -right-2" />}
          color="text-accent"
        />
        
        {/* Water Usage Card */}
        <ScoreCard
          title="Water Usage"
          score={data?.waterUsage || 1.8}
          unit="kL"
          percentage={45}
          info="Good - 20% below average"
          icon={<Droplets className="text-7xl text-primary-light absolute -top-2 -right-2" />}
          color="text-primary-light"
        />
      </div>
    </div>
  );
}
