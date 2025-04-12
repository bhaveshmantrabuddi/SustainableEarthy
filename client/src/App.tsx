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
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Define the route config to make it easier to manage
interface RouteConfig {
  path: string;
  component: React.ComponentType;
  protected?: boolean;
}

const routes: RouteConfig[] = [
  { path: "/", component: Dashboard, protected: true },
  { path: "/transactions", component: Transactions, protected: true },
  { path: "/insights", component: Insights, protected: true },
  { path: "/recommendations", component: Recommendations, protected: true },
  { path: "/eco-search", component: EcoSearch, protected: true },
  { path: "/rewards", component: Rewards, protected: true },
  { path: "/investments", component: Investments, protected: true },
  { path: "/auth", component: AuthPage }
];

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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  
  if (!user) {
    return <RedirectToAuth />;
  }
  
  return (
    <AuthenticatedLayout>
      <Component />
    </AuthenticatedLayout>
  );
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
      {routes.map(({ path, component: Component, protected: isProtected }) => (
        <Route key={path} path={path}>
          {path === "/auth" ? (
            user ? <RedirectToHome /> : <Component />
          ) : isProtected ? (
            <ProtectedRoute component={Component} />
          ) : (
            <Component />
          )}
        </Route>
      ))}
      
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
