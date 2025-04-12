import { useState } from 'react';
import { useEcoSearch } from '@/hooks/use-eco-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EcoSearch() {
  const { 
    searchQuery, 
    setSearchQuery, 
    isLoading, 
    isError, 
    error, 
    data,
    reset 
  } = useEcoSearch();

  // Helper function to determine eco rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-500';
    if (rating >= 6) return 'bg-green-300';
    if (rating >= 4) return 'bg-yellow-300';
    return 'bg-red-300';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sustainable Product Search</h1>
        <p className="text-muted-foreground">
          Search for environmentally sustainable alternatives to products you're considering buying.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a product (e.g., coffee maker, sneakers, headphones)..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={reset}
          disabled={!searchQuery && !data}
        >
          Clear
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to search for sustainable alternatives. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {data?.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      )}

      {data && !data.error && (
        <Card className="animate-fadeIn">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{data.product_name}</CardTitle>
              <Badge className={getRatingColor(data.eco_rating)}>
                Eco Rating: {data.eco_rating}/10
              </Badge>
            </div>
            <CardDescription>
              Price Range: {data.price_range}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{data.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Search query: "{data.query}"
            </p>
            <Button asChild>
              <a 
                href={data.purchase_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Buy Now <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !data && searchQuery && (
        <div className="text-center py-10 text-muted-foreground">
          <p>Type at least 3 characters to search for sustainable alternatives.</p>
        </div>
      )}

      {!isLoading && !data && !searchQuery && (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Why search for sustainable products?</h3>
          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Reduce Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Sustainable products often have a smaller carbon footprint and use fewer resources to produce.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Support Ethical Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Many sustainable brands focus on fair labor practices and ethical sourcing of materials.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Improve Your Eco Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Making sustainable purchase choices will directly improve your sustainability score in EcoFinance.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}