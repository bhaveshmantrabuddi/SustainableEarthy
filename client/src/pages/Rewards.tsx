import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import CashbackCard from '@/components/cashback/CashbackCard';
import { format } from 'date-fns';

export default function Rewards() {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('all');

  // Fetch rewards
  const { data: rewards, isLoading, error } = useQuery({
    queryKey: ['/api/cashback-rewards'],
    queryFn: async () => {
      const response = await fetch('/api/cashback-rewards');
      if (!response.ok) throw new Error('Failed to fetch rewards');
      return response.json();
    }
  });

  // Fetch unredeemed total
  const { data: cashbackTotal } = useQuery({
    queryKey: ['/api/cashback-total'],
    queryFn: async () => {
      const response = await fetch('/api/cashback-total');
      if (!response.ok) throw new Error('Failed to fetch cashback total');
      return response.json();
    }
  });

  // Calculate new monthly cashback
  const calculateCashback = async () => {
    setIsCalculating(true);
    
    try {
      // Get current month and year
      const now = new Date();
      const month = format(now, 'MMMM');
      const year = now.getFullYear();
      
      const response = await apiRequest('POST', '/api/calculate-cashback', { month, year });
      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/cashback-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cashback-total'] });
      
      toast({
        title: 'Cashback Calculated!',
        description: `You earned $${result.amount.toFixed(2)} in cashback for ${month} ${year}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to calculate cashback. Make sure you have transactions with sustainability scores.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Filter rewards for current tab
  const filteredRewards = React.useMemo(() => {
    if (!rewards) return [];
    
    if (activeTab === 'available') {
      return rewards.filter(reward => !reward.redeemed);
    } else if (activeTab === 'redeemed') {
      return rewards.filter(reward => reward.redeemed);
    }
    
    return rewards;
  }, [rewards, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load cashback rewards. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eco Rewards</h1>
          <p className="text-muted-foreground">
            Earn cashback for sustainable purchases
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/investments'}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Invest Rewards
          </Button>
          <Button 
            onClick={calculateCashback} 
            disabled={isCalculating}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isCalculating ? 'Calculating...' : 'Calculate This Month'}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
          <CardDescription>
            Your total unredeemed cashback rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center sm:justify-between">
          <span className="text-4xl font-bold">
            ${cashbackTotal?.total ? cashbackTotal.total.toFixed(2) : '0.00'}
          </span>
          <div className="mt-4 sm:mt-0">
            <Button 
              size="lg" 
              disabled={!cashbackTotal?.total}
              onClick={() => window.location.href = '/investments'}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Invest All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs 
        defaultValue="all" 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Rewards</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredRewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-xl font-semibold mb-2">No rewards found</p>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'available' 
                  ? "You don't have any available rewards yet." 
                  : activeTab === 'redeemed' 
                  ? "You haven't redeemed any rewards yet."
                  : "You don't have any rewards yet."}
              </p>
              {activeTab !== 'redeemed' && (
                <Button onClick={calculateCashback} disabled={isCalculating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Calculate This Month
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <CashbackCard
                  key={reward.id}
                  id={reward.id}
                  month={reward.month}
                  year={reward.year}
                  amount={reward.amount}
                  ecoScore={reward.ecoScore}
                  redeemed={reward.redeemed}
                  invested={reward.invested}
                  date={new Date(reward.date)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}