import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, AlertCircle, ArrowRight, Wallet, TrendingUp, LineChart, ArrowUpRight, Leaf } from 'lucide-react';
import RiskAssessmentForm from '@/components/investments/RiskAssessmentForm';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

interface Investment {
  id: number;
  name: string;
  type: string;
  amount: number;
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  lastUpdated: string;
  esgRating: string;
  description: string;
  performanceData: number[];
}

interface InvestmentProfile {
  id: number;
  userId: number;
  riskLevel: string;
  initialInvestment: number;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}

interface RiskAssessment {
  id: number;
  userId: number;
  ageGroup: string;
  investmentTimeframe: string;
  riskTolerance: number;
  financialGoals: string;
  existingInvestments: boolean;
  incomeLevel: string;
  savingsPercentage: number;
  environmentalPriority: number;
  recommendedRiskLevel: string;
  date: string;
}

interface GreenInvestment {
  id: number;
  name: string;
  type: string;
  description: string;
  minInvestment: number;
  projectedReturn: number;
  riskLevel: string;
  esgRating: string;
  company: string;
  sector: string;
  logoUrl: string | null;
  performanceHistory: number[];
}

export default function Investments() {
  const { toast } = useToast();
  const [hasTakenAssessment, setHasTakenAssessment] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null);
  const [riskAssessmentCompleted, setRiskAssessmentCompleted] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<number | null>(null);

  // Extract query params for investment amount (when coming from rewards)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    if (amount) {
      setInvestmentAmount(parseFloat(amount));
    }
  }, []);

  // Fetch risk assessment
  const { 
    data: riskAssessment,
    isLoading: isLoadingAssessment,
    error: assessmentError 
  } = useQuery({
    queryKey: ['/api/risk-assessment'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/risk-assessment');
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) throw new Error('Failed to fetch risk assessment');
        return response.json();
      } catch (error) {
        if ((error as any).message?.includes('404')) {
          return null;
        }
        throw error;
      }
    },
  });

  // Fetch investment profile
  const {
    data: investmentProfile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['/api/investment-profile'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/investment-profile');
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) throw new Error('Failed to fetch investment profile');
        return response.json();
      } catch (error) {
        if ((error as any).message?.includes('404')) {
          return null;
        }
        throw error;
      }
    },
  });

  // Fetch investments
  const {
    data: investments,
    isLoading: isLoadingInvestments,
    error: investmentsError
  } = useQuery({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/investments');
        if (response.status === 404) {
          return [];
        }
        if (!response.ok) throw new Error('Failed to fetch investments');
        return response.json();
      } catch (error) {
        if ((error as any).message?.includes('404')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!investmentProfile,
  });

  // Fetch green investment recommendations based on risk level
  const {
    data: greenInvestments,
    isLoading: isLoadingGreenInvestments,
    error: greenInvestmentsError
  } = useQuery({
    queryKey: ['/api/green-investments', selectedRiskLevel || riskAssessment?.recommendedRiskLevel],
    queryFn: async () => {
      const riskLevel = selectedRiskLevel || riskAssessment?.recommendedRiskLevel;
      if (!riskLevel) return [];
      
      const response = await fetch(`/api/green-investments?riskLevel=${riskLevel}`);
      if (!response.ok) throw new Error('Failed to fetch investment recommendations');
      return response.json();
    },
    enabled: !!(selectedRiskLevel || riskAssessment?.recommendedRiskLevel),
  });

  // Fetch AI recommendations using Gemini
  const {
    data: aiRecommendations,
    isLoading: isLoadingAiRecommendations,
    error: aiRecommendationsError
  } = useQuery({
    queryKey: ['/api/investment-news', selectedRiskLevel || riskAssessment?.recommendedRiskLevel],
    queryFn: async () => {
      const riskLevel = selectedRiskLevel || riskAssessment?.recommendedRiskLevel;
      if (!riskLevel) return { investments: [] };
      
      const response = await fetch(`/api/investment-news?riskLevel=${riskLevel}`);
      if (!response.ok) throw new Error('Failed to fetch AI recommendations');
      return response.json();
    },
    enabled: !!(selectedRiskLevel || riskAssessment?.recommendedRiskLevel),
  });

  useEffect(() => {
    if (riskAssessment) {
      setHasTakenAssessment(true);
      setSelectedRiskLevel(riskAssessment.recommendedRiskLevel);
    }
  }, [riskAssessment]);

  // Handle risk assessment completion
  const handleRiskAssessmentComplete = (riskLevel: string) => {
    setSelectedRiskLevel(riskLevel);
    setRiskAssessmentCompleted(true);
    
    // Fetch recommendations with the new risk level
    queryClient.invalidateQueries({ 
      queryKey: ['/api/green-investments', riskLevel]
    });
    queryClient.invalidateQueries({ 
      queryKey: ['/api/investment-news', riskLevel]
    });
  };

  // Handle investment creation
  const handleInvest = async (greenInvestment: GreenInvestment) => {
    try {
      if (!investmentProfile) {
        // Create investment profile if not exists
        await apiRequest('POST', '/api/investment-profile', {
          riskLevel: selectedRiskLevel,
          initialInvestment: 0,
          currentValue: 0
        });
      }
      
      // Create investment
      const amount = investmentAmount || greenInvestment.minInvestment;
      const response = await apiRequest('POST', '/api/investments', {
        name: greenInvestment.name,
        type: greenInvestment.type,
        amount,
        purchaseValue: amount,
        currentValue: amount,
        purchaseDate: new Date().toISOString(),
        esgRating: greenInvestment.esgRating,
        description: greenInvestment.description,
        performanceData: greenInvestment.performanceHistory
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investment-profile'] });
      
      // Start the stock tracker service if it's not already running
      await fetch('/api/stock/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Map green investment to stock symbol (using company name or a predefined mapping)
      // For simplicity, we'll derive a stock symbol from the investment name
      const symbolWords = greenInvestment.company || greenInvestment.name;
      // Extract first letter of each word and convert to uppercase
      const symbol = symbolWords
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 4); // Limit to 4 characters
      
      // Use stock tracker to buy stock
      const stockResponse = await fetch('/api/stock/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          shares: Math.max(Math.floor(amount / 100), 1) // Convert amount to number of shares (1 share per $100, minimum 1)
        }),
      });
      
      // Check if the stock purchase was successful
      const stockData = await stockResponse.json();
      
      // Show a more detailed success message
      toast({
        title: 'Investment Created!',
        description: stockData.success 
          ? `Successfully invested $${amount} in ${greenInvestment.name} and purchased ${symbol} stock.`
          : `Successfully invested $${amount} in ${greenInvestment.name}.`,
      });
      
      // Open the stock tracker interface in a new window
      window.open('http://localhost:5000', '_blank');
      
      // Reset investment amount
      setInvestmentAmount(null);
      
    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create investment.',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingAssessment || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show risk assessment if user hasn't taken it
  if (!hasTakenAssessment && !riskAssessmentCompleted) {
    return (
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sustainable Investments</h1>
          <p className="text-muted-foreground mt-2">
            Invest your rewards in a portfolio aligned with your risk tolerance and environmental values
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <RiskAssessmentForm onComplete={handleRiskAssessmentComplete} />
        </div>
      </div>
    );
  }

  // Get the portfolio performance data
  const getPortfolioData = () => {
    if (!investments || investments.length === 0) {
      return [
        {
          id: "portfolio",
          data: [
            { x: "Jan", y: 0 },
            { x: "Feb", y: 0 },
            { x: "Mar", y: 0 },
            { x: "Apr", y: 0 },
            { x: "May", y: 0 },
            { x: "Jun", y: 0 },
          ]
        }
      ];
    }

    // Use the first investment's performance data as a base
    const baseData = investments[0].performanceData || [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    
    return [
      {
        id: "portfolio",
        data: baseData.map((value, index) => ({
          x: months[index % months.length],
          y: value
        }))
      }
    ];
  };

  // Get the portfolio allocation data
  const getAllocationData = () => {
    if (!investments || investments.length === 0) {
      return [
        { id: "No investments", value: 100 }
      ];
    }

    const typeMap: Record<string, number> = {};
    
    investments.forEach(investment => {
      if (typeMap[investment.type]) {
        typeMap[investment.type] += investment.currentValue;
      } else {
        typeMap[investment.type] = investment.currentValue;
      }
    });
    
    return Object.entries(typeMap).map(([type, value]) => ({
      id: type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value
    }));
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sustainable Investments</h1>
          <p className="text-muted-foreground">
            Your green investment portfolio
          </p>
        </div>
        
        {investmentAmount && (
          <Alert className="mt-4 md:mt-0 md:ml-4">
            <Wallet className="h-4 w-4" />
            <AlertTitle>Investment Amount</AlertTitle>
            <AlertDescription>
              You have ${investmentAmount.toFixed(2)} available to invest from your rewards.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Portfolio Summary Section */}
      {investmentProfile ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Investment Portfolio</CardTitle>
            <CardDescription>
              Risk Level: <Badge variant="outline" className="ml-2">{investmentProfile.riskLevel}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Portfolio Value</h3>
                <div className="text-3xl font-bold mb-1">${investmentProfile.currentValue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">
                  Initial Investment: ${investmentProfile.initialInvestment.toFixed(2)}
                </p>
                
                {/* Growth Calculation */}
                {investmentProfile.initialInvestment > 0 && (
                  <div className="mt-4">
                    <p className="flex items-center">
                      Growth: 
                      <span className="ml-2 text-green-600 font-medium flex items-center">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        {(((investmentProfile.currentValue - investmentProfile.initialInvestment) / investmentProfile.initialInvestment) * 100).toFixed(2)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Portfolio Performance Chart */}
              <div className="h-64">
                <h3 className="text-lg font-medium mb-2">Performance</h3>
                <ResponsiveLine
                  data={getPortfolioData()}
                  margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  curve="natural"
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: value => `$${value}`
                  }}
                  colors={{ scheme: 'category10' }}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  useMesh={true}
                />
              </div>
            </div>
            
            {/* Portfolio Allocation Chart */}
            {investments && investments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Portfolio Allocation</h3>
                <div className="h-72">
                  <ResponsivePie
                    data={getAllocationData()}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: 'category10' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="white"
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                </div>
              </div>
            )}
          </CardContent>
          
          {/* Investments list */}
          {investments && investments.length > 0 && (
            <CardFooter className="flex flex-col">
              <h3 className="text-lg font-medium mb-4">Your Investments</h3>
              <div className="w-full space-y-4">
                {investments.map(investment => (
                  <Card key={investment.id} className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{investment.name}</CardTitle>
                        <Badge>{investment.type.replace('_', ' ')}</Badge>
                      </div>
                      <CardDescription>{investment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-xl font-bold">${investment.currentValue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ESG Rating</p>
                          <div className="flex items-center">
                            <Leaf className="h-4 w-4 mr-1 text-green-500" />
                            <span>{investment.esgRating}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start Your Investment Journey</CardTitle>
            <CardDescription>
              You don't have an investment portfolio yet. Choose from our recommended green investments below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Leaf className="h-16 w-16 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Recommendations Section */}
      <h2 className="text-2xl font-bold mb-4">Recommended Green Investments</h2>
      <Tabs defaultValue="ai" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Recommendations</TabsTrigger>
          <TabsTrigger value="green">Green Investments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="space-y-6 mt-6">
          {isLoadingAiRecommendations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : aiRecommendationsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load AI investment recommendations. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            aiRecommendations?.investments && aiRecommendations.investments.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {aiRecommendations.investments.map((rec, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>{rec.name}</CardTitle>
                        <Badge variant="outline">{rec.riskLevel}</Badge>
                      </div>
                      <CardDescription>{rec.sector}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price Range</p>
                          <p className="font-medium">{rec.priceRange}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Potential Return</p>
                          <p className="font-medium text-green-600">{rec.returnPercentage}</p>
                        </div>
                        <div>
                          <Button 
                            className="w-full"
                            onClick={() => {
                              // Create a mock green investment from AI recommendation
                              const mockGreenInvestment: GreenInvestment = {
                                id: index,
                                name: rec.name,
                                type: 'eco_stock',
                                description: rec.environmentalImpact,
                                minInvestment: 100,
                                projectedReturn: parseFloat(rec.returnPercentage.replace('%', '')),
                                riskLevel: rec.riskLevel.toLowerCase(),
                                esgRating: 'A',
                                company: rec.name,
                                sector: rec.sector,
                                logoUrl: null,
                                performanceHistory: [100, 105, 110, 108, 115, 120]
                              };
                              handleInvest(mockGreenInvestment);
                            }}
                          >
                            Invest Now
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Environmental Impact</p>
                        <p className="mt-1">{rec.environmentalImpact}</p>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Recent News</p>
                        <p className="mt-1">{rec.recentNews}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(rec.name)}+stock+esg`, '_blank')}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Research More
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No AI recommendations available yet. Please try again later.</p>
              </div>
            )
          )}
        </TabsContent>
        
        <TabsContent value="green" className="space-y-6 mt-6">
          {isLoadingGreenInvestments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : greenInvestments && greenInvestments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {greenInvestments.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{investment.name}</CardTitle>
                      <Badge variant="outline">{investment.riskLevel}</Badge>
                    </div>
                    <CardDescription>{investment.sector}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Investment:</span>
                        <span className="font-medium">${investment.minInvestment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Projected Return:</span>
                        <span className="font-medium text-green-600">{investment.projectedReturn}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ESG Rating:</span>
                        <span className="font-medium">{investment.esgRating}</span>
                      </div>
                    </div>
                    <p className="mt-4">{investment.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(investment.name)}+esg+investment`, '_blank')}
                    >
                      Research
                    </Button>
                    <Button onClick={() => handleInvest(investment)}>
                      Invest Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No green investments available for your risk profile. Try adjusting your risk assessment.</p>
              <Button 
                className="mt-4"
                onClick={() => setHasTakenAssessment(false)}
              >
                Retake Assessment
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}