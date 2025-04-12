import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CashbackCardProps {
  id: number;
  month: string;
  year: number;
  amount: number;
  ecoScore: number;
  redeemed: boolean;
  invested: boolean;
  date: Date;
}

export default function CashbackCard({ 
  id, 
  month, 
  year, 
  amount, 
  ecoScore, 
  redeemed, 
  invested,
  date 
}: CashbackCardProps) {
  const { toast } = useToast();
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [isInvesting, setIsInvesting] = React.useState(false);
  
  const formattedDate = format(new Date(date), 'MMMM d, yyyy');
  
  // Function to redeem cashback
  const handleRedeem = async () => {
    setIsRedeeming(true);
    try {
      await apiRequest('POST', `/api/redeem-cashback/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/cashback-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cashback-total'] });
      
      toast({
        title: 'Cashback Redeemed!',
        description: `$${amount.toFixed(2)} has been added to your account.`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error Redeeming Cashback',
        description: 'There was a problem redeeming your cashback.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  };
  
  // Function to invest cashback
  const handleInvest = async () => {
    setIsInvesting(true);
    try {
      // Redirect to investment page with amount
      window.location.href = `/investments?amount=${amount}`;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem processing your request.',
        variant: 'destructive',
      });
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {month} {year}
          <Badge variant={redeemed ? 'outline' : 'default'}>
            {redeemed ? 'Redeemed' : 'Available'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Eco-Score: <span className="text-green-600 font-medium">{ecoScore}/100</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">${amount.toFixed(2)}</div>
        <p className="text-sm text-muted-foreground">Earned on {formattedDate}</p>
        
        {/* Progress bar to visually show eco-score */}
        <div className="w-full bg-muted rounded-full h-2.5 mt-4">
          <div 
            className={`h-2.5 rounded-full ${
              ecoScore >= 80 ? 'bg-green-500' :
              ecoScore >= 60 ? 'bg-green-400' :
              ecoScore >= 40 ? 'bg-green-300' : 'bg-yellow-300'
            }`}
            style={{ width: `${ecoScore}%` }}
          ></div>
        </div>
        
        {/* Explanation of reward tier */}
        <div className="mt-2 text-xs text-muted-foreground">
          {ecoScore >= 80 && (
            <span className="text-green-600">Excellent eco-score! 3× reward multiplier applied.</span>
          )}
          {ecoScore >= 60 && ecoScore < 80 && (
            <span className="text-green-600">Good eco-score! 2× reward multiplier applied.</span>
          )}
          {ecoScore >= 40 && ecoScore < 60 && (
            <span className="text-green-600">Average eco-score. 1.5× reward multiplier applied.</span>
          )}
          {ecoScore < 40 && (
            <span>Basic eco-score. Standard reward rate applied.</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!redeemed && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isRedeeming || isInvesting}
              onClick={handleRedeem}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Redeem
            </Button>
            <Button 
              variant="default" 
              size="sm"
              disabled={isRedeeming || isInvesting}
              onClick={handleInvest}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Invest
            </Button>
          </>
        )}
        {redeemed && (
          <div className="flex items-center text-muted-foreground">
            <CheckCircle className="w-4 h-4 mr-2" />
            Redeemed on {formattedDate}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}