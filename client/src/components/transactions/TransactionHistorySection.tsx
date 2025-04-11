import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

// Helper functions
const getEcoScoreRating = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "bg-success text-success" };
  if (score >= 70) return { label: "Good", color: "bg-success text-success" };
  if (score >= 60) return { label: "Fair", color: "bg-warning text-warning" };
  return { label: "Poor", color: "bg-danger text-danger" };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TransactionHistorySection() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Get transactions with filters
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', categoryFilter, ratingFilter],
    queryFn: async ({ queryKey }) => {
      const [_path, category, rating] = queryKey;
      let url = '/api/transactions';
      
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category as string);
      
      if (rating !== 'all') {
        // Map rating filter to score range
        const scoreRanges: Record<string, [number, number]> = {
          'excellent': [80, 100],
          'good': [70, 79],
          'fair': [60, 69],
          'poor': [0, 59]
        };
        
        const [minScore, maxScore] = scoreRanges[rating as keyof typeof scoreRanges];
        params.append('minScore', minScore.toString());
        params.append('maxScore', maxScore.toString());
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });
  
  // Calculate pagination
  const totalItems = transactions?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentItems = transactions?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold font-heading text-neutral-800">Recent Transactions</h2>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-center">Eco Score</TableHead>
                  <TableHead className="text-right">Alternatives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-t border-neutral-200">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold font-heading text-neutral-800">Recent Transactions</h2>
        <div className="flex space-x-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="groceries">Groceries</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="dining">Dining</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Date</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Merchant</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Category</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Amount</TableHead>
                <TableHead className="px-6 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Eco Score</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase">Alternatives</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-200">
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-neutral-500">
                    No transactions found. Upload a CSV file to see transactions.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((transaction: any, index: number) => {
                  const { label, color } = getEcoScoreRating(transaction.ecoScore);
                  return (
                    <TableRow key={index} className="hover:bg-neutral-50 transition-colors">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {transaction.merchant}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 capitalize">
                        {transaction.category}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800 font-medium">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 ${color}`}>
                            <Leaf className="h-3 w-3 mr-1" />
                            {label}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {transaction.hasAlternatives ? (
                          <Button variant="link" className="text-primary hover:text-primary-dark font-medium text-sm p-0">
                            View
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-t border-neutral-200">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> transactions
              </p>
            </div>
            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
          
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
