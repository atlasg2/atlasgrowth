import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Contractor } from "@shared/schema";
import { Menu, Search, HelpCircle, Bell, ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  
  const { data: contractor } = useQuery<Contractor>({
    queryKey: ["/api/user/contractor"],
    enabled: !!user?.contractorId,
  });
  
  const initials = user 
    ? user.firstName && user.lastName 
      ? `${user.firstName[0]}${user.lastName[0]}` 
      : user.username.slice(0, 2).toUpperCase()
    : "";
    
  const companyName = contractor?.name || "Atlas Growth";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo Area */}
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white mr-2">
              <span className="material-icons text-xl">trending_up</span>
            </div>
            <span className="text-xl font-semibold">Atlas Growth</span>
          </div>
        </div>
        
        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm" 
              placeholder="Search..."
            />
          </div>
        </div>
        
        {/* Nav Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-neutral flex items-center justify-center text-white">
                  <span className="text-sm font-medium">{initials}</span>
                </div>
                <span className="hidden md:inline text-sm font-medium">{companyName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-icons mr-2 text-sm">settings</span>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <span className="material-icons mr-2 text-sm">logout</span>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
