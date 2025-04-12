import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Users, Building2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Sheet,
  SheetTrigger,
} from "@/components/ui/sheet";
import MainLayout from "./main-layout";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
          <p>You do not have admin privileges to view this page.</p>
        </div>
      </MainLayout>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: "Contractors",
      href: "/admin/contractors",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold">HVAC Pro</h2>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors",
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1">
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">HVAC Pro</h2>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <span className="sr-only">Toggle navigation menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>HVAC Pro Admin</SheetTitle>
                <SheetDescription>
                  Manage contractors, users, and settings
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <a
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors",
                        location === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                ))}
                <Button
                  variant="outline"
                  className="w-full justify-start mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/10">{children}</main>
      </div>
    </div>
  );
}