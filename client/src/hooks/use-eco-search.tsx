import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export interface EcoSearchResult {
  product_name: string;
  description: string;
  price_range: string;
  purchase_url: string;
  eco_rating: number;
  query: string;
  error?: string;
}

export function useEcoSearch() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  
  // Debounced search function to prevent too many API calls
  const debounceSearch = (query: string) => {
    setSearchQuery(query);
    // Only search if query is not empty and at least 3 characters
    if (query && query.length >= 3) {
      // Clear any existing timeout
      const timeoutId = setTimeout(() => {
        setDebouncedQuery(query);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setDebouncedQuery('');
    }
  };

  const search = useQuery<EcoSearchResult>({
    queryKey: [`/api/eco-search?query=${encodeURIComponent(debouncedQuery)}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!debouncedQuery,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    searchQuery,
    setSearchQuery: debounceSearch,
    isLoading: search.isLoading,
    isError: search.isError,
    error: search.error,
    data: search.data,
    reset: () => {
      setSearchQuery('');
      setDebouncedQuery('');
    }
  };
}