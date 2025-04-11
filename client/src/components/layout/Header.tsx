import { useState } from "react";
import { Menu, Bell, HelpCircle, User } from "lucide-react";
import { Leaf } from "lucide-react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleToggleSidebar = () => {
    // This would be implemented with a mobile sidebar state
    // For now, we'll just show an alert to match the reference design
    alert('Mobile menu would toggle here in the actual implementation');
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile logo and menu button */}
          <div className="flex lg:hidden items-center">
            <button 
              type="button" 
              className="text-neutral-600 hover:text-neutral-800 focus:outline-none"
              onClick={handleToggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-3 flex items-center">
              <Leaf className="text-primary h-5 w-5 mr-2" />
              <h1 className="text-lg font-bold font-heading text-primary">EcoFinance</h1>
            </div>
          </div>
          
          {/* Search bar (desktop) */}
          <div className="hidden md:flex items-center flex-1 mx-8">
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-neutral-100 focus:bg-white border border-transparent focus:border-neutral-300 focus:outline-none focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600"></i>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center">
            <button className="p-2 rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100" title="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 ml-1" title="Help">
              <HelpCircle className="h-5 w-5" />
            </button>
            {/* Mobile user profile */}
            <button className="lg:hidden p-2 rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 ml-1">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
