import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/transactions", label: "Transactions", icon: "ri-history-line" },
    { path: "/insights", label: "Insights", icon: "ri-line-chart-line" },
    { path: "/eco-search", label: "Search", icon: "ri-search-line" },
    { path: "/settings", label: "Profile", icon: "ri-user-line" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center p-3",
              location === item.path ? "text-primary" : "text-neutral-600"
            )}>
              <i className={cn(item.icon, "text-xl")}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
