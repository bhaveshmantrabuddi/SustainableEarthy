
import { Menu, Bell, HelpCircle, User, LogOut } from "lucide-react";
import { Leaf } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  // Removed search query state
  const { user, logoutMutation } = useAuth();
  
  const handleToggleSidebar = () => {
    // This would be implemented with a mobile sidebar state
    // For now, we'll just show an alert to match the reference design
    alert('Mobile menu would toggle here in the actual implementation');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          
          {/* Empty space for layout balance */}
          <div className="hidden md:flex flex-1"></div>
          
          {/* Action buttons */}
          <div className="flex items-center">
            <button className="p-2 rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100" title="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 ml-1" title="Help">
              <HelpCircle className="h-5 w-5" />
            </button>
            
            {/* User profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
