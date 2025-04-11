import TransactionHistorySection from "@/components/transactions/TransactionHistorySection";

export default function Transactions() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-800">Transactions</h1>
        <p className="text-neutral-600 mt-1">View and analyze your transaction history</p>
      </div>

      {/* Transactions section */}
      <TransactionHistorySection />
    </div>
  );
}
