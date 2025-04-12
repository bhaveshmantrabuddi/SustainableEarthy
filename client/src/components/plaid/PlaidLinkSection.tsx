import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Add Plaid types to global Window interface
declare global {
  interface Window {
    Plaid: {
      create: (config: any) => {
        open: () => void;
        exit: () => void;
      };
    };
  }
}

const PlaidLinkSection: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Add Plaid Link script to the document
  useEffect(() => {
    const addPlaidScript = () => {
      if (!document.getElementById('plaid-link-script')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.id = 'plaid-link-script';
        document.head.appendChild(script);
      }
    };
    
    addPlaidScript();
  }, []);

  // Fetch accounts and transactions data
  const fetchPlaidData = async () => {
    try {
      // Fetch accounts
      const accountsResponse = await apiRequest('GET', '/api/plaid/accounts');
      
      if (accountsResponse.ok) {
        // Fetch transactions
        const transactionsResponse = await apiRequest('GET', '/api/plaid/transactions');
        
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setHasTransactions(transactionsData.transactions && transactionsData.transactions.length > 0);
          
          // Refresh sustainability data and other components
          queryClient.invalidateQueries({ queryKey: ['/api/sustainability-score'] });
          queryClient.invalidateQueries({ queryKey: ['/api/category-breakdowns'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
          
          toast({
            title: "Transactions Imported",
            description: `Successfully imported ${transactionsData.transactions.length} transactions from your bank.`,
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching Plaid data:', error);
      setError(error.message || 'Failed to fetch transaction data');
      toast({
        title: "Data Fetch Failed",
        description: error.message || 'An error occurred while fetching your transaction data',
        variant: "destructive",
      });
    }
  };

  // Open Plaid Link
  const handleConnectBank = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get a link token from our server
      const response = await apiRequest('POST', '/api/plaid/create_link_token');
      const { link_token } = await response.json();

      // Create the Plaid Link handler
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          try {
            // Exchange the public token for an access token
            const exchangeResponse = await apiRequest('POST', '/api/plaid/exchange_public_token', { public_token });
            
            if (exchangeResponse.ok) {
              setIsConnected(true);
              toast({
                title: "Bank Connected!",
                description: "Your bank account has been successfully connected.",
              });

              // Now fetch accounts and transactions
              await fetchPlaidData();
            }
          } catch (error: any) {
            console.error('Error exchanging token:', error);
            setError(error.message || 'Failed to connect bank account');
            toast({
              title: "Connection Failed",
              description: error.message || 'An error occurred while connecting your bank',
              variant: "destructive",
            });
          } finally {
            setIsConnecting(false);
          }
        },
        onExit: () => {
          setIsConnecting(false);
        },
        onLoad: () => {
          // Handler is ready
        },
        onEvent: (eventName: string) => {
          console.log('Plaid event:', eventName);
        },
      });

      // Open the Plaid Link interface
      handler.open();
    } catch (error: any) {
      console.error('Error creating link token:', error);
      setError(error.message || 'Failed to start bank connection process');
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error.message || 'An error occurred while starting the bank connection process',
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Connect Your Bank Account
            </CardTitle>
            <CardDescription>
              Securely connect your bank account to automatically import transaction data
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">
          Connect your bank account to automatically import your transactions and track your sustainability score in real-time.
          All data is transmitted securely using Plaid's encrypted connection.
        </p>
        
        {hasTransactions && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
            <p className="text-sm font-medium">Transaction data successfully imported!</p>
            <p className="text-xs mt-1">Your sustainability metrics have been updated based on your bank transactions.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant={isConnected ? "outline" : "default"} 
          onClick={handleConnectBank} 
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Reconnect Bank
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Link Bank Account
            </>
          )}
        </Button>
        
        {isConnected && (
          <Button 
            variant="outline" 
            onClick={fetchPlaidData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlaidLinkSection;