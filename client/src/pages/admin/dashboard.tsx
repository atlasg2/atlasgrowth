import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Building, Users, CreditCard, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Sample data for demonstration
  const stats = {
    totalContractors: 24,
    activeContractors: 18,
    monthlyRevenue: 12650,
    totalUsers: 42
  };

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Contractors Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Contractors</p>
                <p className="text-2xl font-bold mt-1">{stats.totalContractors}</p>
                <p className="text-xs text-green-600 mt-1">+9% from last month</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Active Contractors Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Contractors</p>
                <p className="text-2xl font-bold mt-1">{stats.activeContractors}</p>
                <p className="text-xs text-green-600 mt-1">75% activation rate</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Revenue Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-xs text-green-600 mt-1">+10% from last month</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Users Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">+5% from last month</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>System Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Building className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">New contractor registered</p>
                <p className="text-xs text-gray-500">Cool Air Services - 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">New user account created</p>
                <p className="text-xs text-gray-500">John Smith - 5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Subscription payment received</p>
                <p className="text-xs text-gray-500">Comfort Climate - 1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Contractor upgraded to pro plan</p>
                <p className="text-xs text-gray-500">Premier HVAC Solutions - 2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}