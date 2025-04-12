import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ContactsPage from "@/pages/contacts-page";
import JobsPage from "@/pages/jobs-page";
import SchedulePage from "@/pages/schedule-page";
import InvoicesPage from "@/pages/invoices-page";
import ReviewsPage from "@/pages/reviews-page";
import MessagesPage from "@/pages/messages-page";
import CompanyPage from "@/pages/company-page";
import TeamPage from "@/pages/team-page";
import SettingsPage from "@/pages/settings-page";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminContractorsPage from "@/pages/admin/contractors";
import AdminUsersPage from "@/pages/admin/users";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/contacts" component={ContactsPage} />
      <ProtectedRoute path="/jobs" component={JobsPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/reviews" component={ReviewsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/company" component={CompanyPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboardPage} />
      <ProtectedRoute path="/admin/contractors" component={AdminContractorsPage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
