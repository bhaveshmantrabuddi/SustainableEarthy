import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  icon: string;
  potentialImpact: string;
  category: string;
}

export default function RecommendationsSection() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['/api/recommendations'],
  });

  if (isLoading) {
    return (
      <div className="mt-8 mb-4">
        <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Sustainable Recommendations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
              <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">Sustainable Recommendations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations?.map((recommendation: Recommendation) => (
          <div key={recommendation.id} className="card bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary bg-opacity-10 p-2 rounded-lg">
                  <i className={`${recommendation.icon} text-xl text-primary`}></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-md font-semibold text-neutral-800 mb-1">{recommendation.title}</h3>
                  <p className="text-xs text-neutral-600">
                    {recommendation.category === "Groceries" && "Save up to 35% on your carbon footprint for groceries"}
                    {recommendation.category === "Transportation" && "Reduce emissions by 60% compared to rideshares"}
                    {recommendation.category === "Shopping" && "Eco-friendly alternatives to fast fashion"}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <p className="text-neutral-600">{recommendation.description}</p>
              </div>
            </div>
            <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 flex justify-between items-center">
              <div className="text-xs text-neutral-500">
                Potential impact: <span className="text-success font-medium">{recommendation.potentialImpact}</span>
              </div>
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0">
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
