import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/") ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">dashboard</span>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/contacts">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/contacts") ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">contacts</span>
            <span className="text-xs mt-1">Contacts</span>
          </a>
        </Link>
        
        <Link href="/jobs">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/jobs") ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">construction</span>
            <span className="text-xs mt-1">Jobs</span>
          </a>
        </Link>
        
        <Link href="/schedule">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/schedule") ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">calendar_today</span>
            <span className="text-xs mt-1">Schedule</span>
          </a>
        </Link>
        
        <div className="group relative">
          <button className="flex flex-col items-center py-2 px-3 text-gray-600">
            <span className="material-icons">more_horiz</span>
            <span className="text-xs mt-1">More</span>
          </button>
          
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block">
            <Link href="/invoices">
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <span className="material-icons inline-block mr-2 text-sm align-text-bottom">receipt</span>
                Invoices
              </a>
            </Link>
            
            <Link href="/reviews">
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <span className="material-icons inline-block mr-2 text-sm align-text-bottom">star_rate</span>
                Reviews
              </a>
            </Link>
            
            <Link href="/messages">
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <span className="material-icons inline-block mr-2 text-sm align-text-bottom">chat</span>
                Messages
              </a>
            </Link>
            
            <Link href="/settings">
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <span className="material-icons inline-block mr-2 text-sm align-text-bottom">settings</span>
                Settings
              </a>
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (min-width: 769px) {
          .mobile-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
