import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect admin to Atlas dashboard when they hit the root route
  const shouldRedirectToAtlas = path === "/" && user?.role === "admin" && location === "/";

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (shouldRedirectToAtlas) {
    return (
      <Route path={path}>
        <Redirect to="/atlas" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
