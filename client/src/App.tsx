import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Insights from "@/pages/Insights";
import Recommendations from "@/pages/Recommendations";
import EcoSearch from "@/pages/EcoSearch";
import Rewards from "@/pages/Rewards";
import Investments from "@/pages/Investments";
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
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

// Helper components to handle redirection
function RedirectToAuth() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/auth");
  }, [navigate]);
  return null;
}

function RedirectToHome() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return null;
}

function Routes() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/auth">
        {user ? <RedirectToHome /> : <AuthPage />}
      </Route>
      
      <Route path="/">
        {user ? (
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/transactions">
        {user ? (
          <AuthenticatedLayout>
            <Transactions />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/insights">
        {user ? (
          <AuthenticatedLayout>
            <Insights />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/recommendations">
        {user ? (
          <AuthenticatedLayout>
            <Recommendations />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/eco-search">
        {user ? (
          <AuthenticatedLayout>
            <EcoSearch />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/rewards">
        {user ? (
          <AuthenticatedLayout>
            <Rewards />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route path="/investments">
        {user ? (
          <AuthenticatedLayout>
            <Investments />
          </AuthenticatedLayout>
        ) : (
          <RedirectToAuth />
        )}
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
