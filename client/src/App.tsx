import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Insights from "@/pages/Insights";
import Recommendations from "@/pages/Recommendations";
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Don't show layout for unauthenticated users or on auth page
  if (!user) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <Header />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/transactions" component={Transactions} />
        <ProtectedRoute path="/insights" component={Insights} />
        <ProtectedRoute path="/recommendations" component={Recommendations} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
