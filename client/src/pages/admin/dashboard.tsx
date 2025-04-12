import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  Star,
  Calendar,
  Briefcase,
  FileText,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: contractors = [], isLoading: contractorsLoading } = useQuery({
    queryKey: ["/api/contractors"],
    enabled: !!user && user.role === "admin",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  const isLoading = contractorsLoading || usersLoading;

  if (user?.role !== "admin") {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your HVAC contractor management platform
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Contractors
                  </CardTitle>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {contractors.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active contractor accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered system users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Admin Users
                  </CardTitle>
                  <Star className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {users.filter((u) => u.role === "admin").length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users with admin privileges
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Access key administrative functions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a
                      href="/admin/contractors"
                      className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Building2 className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">
                        Manage Contractors
                      </span>
                    </a>
                    <a
                      href="/admin/users"
                      className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Users className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </a>
                    <div className="flex flex-col items-center p-4 border rounded-lg opacity-60">
                      <Calendar className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Schedules</span>
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg opacity-60">
                      <Briefcase className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Job Reports</span>
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Statistics</CardTitle>
                  <CardDescription>
                    Overview of system usage and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>Detailed statistics will be available soon</p>
                    <p className="text-sm mt-2">
                      We're currently collecting data to provide insights on
                      platform usage
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}