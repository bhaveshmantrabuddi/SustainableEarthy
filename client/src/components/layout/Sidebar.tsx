import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/transactions", label: "Transactions", icon: "ri-history-line" },
    { path: "/insights", label: "Insights", icon: "ri-line-chart-line" },
    { path: "/recommendations", label: "Recommendations", icon: "ri-compass-3-line" },
    { path: "/settings", label: "Settings", icon: "ri-settings-4-line" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white shadow-md z-10">
      <div className="p-4 flex items-center border-b border-neutral-200">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mr-3">
          <Leaf className="text-white h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold font-heading text-primary">EcoFinance</h1>
      </div>
      
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-r-lg",
                    location === item.path 
                      ? "text-primary bg-primary bg-opacity-10 border-l-4 border-primary font-medium" 
                      : "text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <i className={cn(item.icon, "mr-3 text-lg")}></i>
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=80" 
            alt="User profile" 
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="text-sm font-medium">{user?.name || "Alex Morgan"}</p>
            <p className="text-xs text-neutral-600">{user?.username || "alex@example.com"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
