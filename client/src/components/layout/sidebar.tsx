import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Get unread message count
  const { data: messagesData } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user?.contractorId,
  });
  
  const unreadCount = messagesData?.count || 0;

  const isActive = (path: string) => {
    return location === path ? "active" : "";
  };

  return (
    <aside className="sidebar w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-16 hidden md:block">
      <nav className="mt-2 px-2">
        <div className="space-y-1">
          {/* Dashboard Link */}
          <Link href="/">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/")}`}>
              <span className="material-icons mr-3 text-primary">dashboard</span>
              <span>Dashboard</span>
            </a>
          </Link>
          
          {/* Contacts Link */}
          <Link href="/contacts">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/contacts")}`}>
              <span className="material-icons mr-3 text-neutral">contacts</span>
              <span>Contacts</span>
            </a>
          </Link>
          
          {/* Jobs Link */}
          <Link href="/jobs">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/jobs")}`}>
              <span className="material-icons mr-3 text-neutral">construction</span>
              <span>Jobs</span>
            </a>
          </Link>
          
          {/* Schedule Link */}
          <Link href="/schedule">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/schedule")}`}>
              <span className="material-icons mr-3 text-neutral">calendar_today</span>
              <span>Schedule</span>
            </a>
          </Link>
          
          {/* Invoices Link */}
          <Link href="/invoices">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/invoices")}`}>
              <span className="material-icons mr-3 text-neutral">receipt</span>
              <span>Invoices</span>
            </a>
          </Link>
          
          {/* Reviews Link */}
          <Link href="/reviews">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/reviews")}`}>
              <span className="material-icons mr-3 text-neutral">star_rate</span>
              <span>Reviews</span>
            </a>
          </Link>
          
          {/* Messages Link */}
          <Link href="/messages">
            <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/messages")}`}>
              <span className="material-icons mr-3 text-neutral">chat</span>
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full bg-primary text-white">
                  {unreadCount}
                </span>
              )}
            </a>
          </Link>
        </div>
        
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
          <div className="mt-2 space-y-1">
            <Link href="/company">
              <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/company")}`}>
                <span className="material-icons mr-3 text-neutral">business</span>
                <span>Company</span>
              </a>
            </Link>
            
            <Link href="/team">
              <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/team")}`}>
                <span className="material-icons mr-3 text-neutral">group</span>
                <span>Team</span>
              </a>
            </Link>
            
            <Link href="/settings">
              <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/settings")}`}>
                <span className="material-icons mr-3 text-neutral">settings</span>
                <span>Settings</span>
              </a>
            </Link>
            
            {user?.role === "admin" && (
              <Link href="/admin/dashboard">
                <a className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-md ${isActive("/admin/dashboard")}`}>
                  <span className="material-icons mr-3 text-neutral">admin_panel_settings</span>
                  <span>Admin Portal</span>
                </a>
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      <style jsx>{`
        .sidebar-item.active {
          border-left: 4px solid #2563EB;
          background-color: rgba(37, 99, 235, 0.1);
        }
        
        .sidebar-item:hover:not(.active) {
          background-color: rgba(37, 99, 235, 0.05);
        }
      `}</style>
    </aside>
  );
}
