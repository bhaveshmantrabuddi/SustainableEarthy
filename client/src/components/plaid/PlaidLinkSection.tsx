import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Define type for Plaid in window
declare global {
  interface Window {
    Plaid: {
      create: (config: any) => {
        open: () => void;
        exit: (callback?: () => void) => void;
      };
    };
  }
}

const PlaidLinkSection = () => {
  const [status, setStatus] = useState<string | JSX.Element>("");
  const { toast } = useToast();

  // Add Plaid script to the document
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleConnect = async () => {
    try {
      // Fetch link token on user click
      const res = await fetch('/api/plaid/create_link_token', { method: 'POST' });

      const data = await res.json();

      if (!data.link_token) {
        setStatus(<p className="text-red-500">No link_token returned</p>);
        return;
      }

      const handler = window.Plaid.create({
        token: data.link_token,
        onSuccess: async function(public_token: string, metadata: any) {
          console.log("Success! Public token:", public_token);

          const exchangeRes = await fetch('/api/plaid/exchange_public_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token })
          });

          if (!exchangeRes.ok) {
            setStatus(<p className="text-red-500">Token exchange failed</p>);
            return;
          }

          const accountsRes = await fetch('/api/plaid/accounts');
          const accounts = await accountsRes.json();

          const txRes = await fetch('/api/plaid/transactions');
          const response = await txRes.json();
          const transactions = response.transactions.map((tx: any) => ({
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
            payment_channel: tx.payment_channel
          }));

          const transactionHTML = (
            <div>
              <h3 className="text-lg font-semibold mt-4 mb-2">Transactions</h3>
              <div className="max-h-96 overflow-y-auto">
                {transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="transaction border rounded-md p-3 mb-2 bg-card">
                    <div>📅 {tx.date}</div>
                    <div>💳 {tx.name}</div>
                    <div>💰 ${Math.abs(tx.amount).toFixed(2)}</div>
                    <div>🏷️ {tx.payment_channel}</div>
                  </div>
                ))}
              </div>
            </div>
          );

          setStatus(transactionHTML);
          toast({
            title: "Success!",
            description: `Connected to your bank account and fetched ${transactions.length} transactions.`,
          });
        },
        onExit: function(err: any, metadata: any) {
          if (err) {
            console.error("Exited with error", err);
            setStatus(<p className="text-red-500">{err.message}</p>);
            toast({
              title: "Connection failed",
              description: err.message,
              variant: "destructive"
            });
          }
        }
      });

      handler.open();
    } catch (err: any) {
      console.error("Error initializing Plaid Link:", err);
      setStatus(<p className="text-red-500">{err.message}</p>);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Connect Your Bank Account</CardTitle>
        <CardDescription>
          Import your transactions directly from your bank instead of uploading CSV files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleConnect}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Link Bank Account
        </Button>
        <div className="mt-4" id="status">
          {status}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaidLinkSection;