import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import StatsCard from "@/components/dashboard/stats-card";
import ActivityItem from "@/components/dashboard/activity-item";
import ScheduleItem from "@/components/dashboard/schedule-item";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Appointment, Job, Invoice, Review, Activity } from "@shared/schema";
import { DownloadIcon, PlusIcon, ChevronRightIcon, Combine, CalendarIcon, ReceiptCent, StarIcon } from "lucide-react";
import { Link } from "wouter";

interface DashboardPageProps {
  previewMode?: boolean;
  previewData?: any;
}

export default function DashboardPage({ previewMode = false, previewData = null }: DashboardPageProps) {
  const { user } = useAuth();
  
  // Use either preview data or fetch from API based on mode
  const contractorId = previewMode && previewData ? previewData.id : user?.contractorId;
  
  // Fetch stats for the contractor
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !previewMode && !!contractorId,
  });
  
  // Fetch today's appointments
  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/today"],
    enabled: !previewMode && !!contractorId,
  });
  
  // Fetch recent jobs
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs/recent"],
    enabled: !previewMode && !!contractorId,
  });
  
  // Fetch recent invoices
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices/recent"],
    enabled: !previewMode && !!contractorId,
  });
  
  // Fetch recent reviews
  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews/recent"],
    enabled: !previewMode && !!contractorId,
  });
  
  // Fetch recent activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
    enabled: !previewMode && !!contractorId,
  });
  
  // In preview mode, we use the preview data instead of the fetched data
  const displayStats = previewMode ? {
    activeJobs: 0,
    scheduledToday: 0,
    pendingInvoicesAmount: 0,
    pendingInvoicesCount: 0,
    averageRating: previewData?.rating ? parseFloat(previewData.rating) : 0,
    reviewCount: previewData?.reviewCount ? parseInt(previewData.reviewCount) : 0
  } : stats;
  
  const displayAppointments = previewMode ? [] : appointments;
  const displayJobs = previewMode ? [] : jobs;
  const displayInvoices = previewMode ? [] : invoices;
  const displayReviews = previewMode ? [] : reviews;
  const displayActivities = previewMode ? [] : activities;

  return (
    <MainLayout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral">Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" className="flex items-center">
            <DownloadIcon className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Link href="/jobs">
            <Button size="sm" className="flex items-center">
              <PlusIcon className="mr-1 h-4 w-4" />
              New Job
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Jobs Card */}
        <StatsCard 
          title="Active Jobs"
          value={displayStats?.activeJobs || 0}
          icon={<span className="material-icons text-primary">build</span>}
          iconBgColor="bg-blue-100"
          trend={{
            value: "+4.6% from last week",
            isPositive: true
          }}
        />
        
        {/* Scheduled Visits Card */}
        <StatsCard 
          title="Scheduled Today"
          value={displayStats?.scheduledToday || 0}
          icon={<span className="material-icons text-secondary">event</span>}
          iconBgColor="bg-green-100"
          footer={appointments && `${appointments.filter(a => a.status === 'pending').length} pending, ${appointments.filter(a => a.status === 'confirmed').length} confirmed`}
        />
        
        {/* Pending Invoices Card */}
        <StatsCard 
          title="Pending Invoices"
          value={stats?.pendingInvoicesAmount ? formatCurrency(stats.pendingInvoicesAmount) : '$0.00'}
          icon={<span className="material-icons text-accent">payments</span>}
          iconBgColor="bg-amber-100"
          footer={`${stats?.pendingInvoicesCount || 0} invoices`}
        />
        
        {/* Average Rating Card */}
        <StatsCard 
          title="Average Rating"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          icon={<span className="material-icons text-yellow-500">star</span>}
          iconBgColor="bg-yellow-100"
          footer={`Based on ${stats?.reviewCount || 0} reviews`}
        />
      </div>
      
      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Today's Schedule</h2>
            <Link href="/schedule">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0 h-auto">
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <ScheduleItem key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments today</h3>
                  <p>You have no appointments scheduled for today.</p>
                  <Link href="/schedule">
                    <Button variant="outline" className="mt-4">Schedule Appointment</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Activities Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Activities</h2>
            <Link href="/activities">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0 h-auto">
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Jobs and Invoices Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Jobs</h2>
            <Link href="/jobs">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0 h-auto">
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">#{job.jobNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{job.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{job.type}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={job.status} entity="job" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <p>No jobs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Link href="/invoices">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0 h-auto">
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices && invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">#{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">Customer</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={invoice.status} entity="invoice" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <p>No invoices found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Recent Customer Reviews Section */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Customer Reviews</h2>
            <Link href="/reviews">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0 h-auto">
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-md p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          <span className="text-sm font-medium">
                            {review.contactId && `C${review.contactId}`}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">Customer</p>
                          <p className="text-xs text-gray-500">{review.date ? new Date(review.date).toLocaleDateString() : 'Unknown date'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className="material-icons text-yellow-400">
                            {index < review.rating ? 'star' : 'star_border'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {review.comment || "No comment provided."}
                    </p>
                    <div className="mt-3 flex items-center text-xs text-primary font-medium">
                      <span className="material-icons text-xs mr-1">thumb_up</span>
                      <span>{review.serviceType || "Service"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-8 text-center text-gray-500">
                  <StarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
                  <p>Start collecting reviews from your customers.</p>
                  <Link href="/reviews">
                    <Button variant="outline" className="mt-4">Manage Reviews</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
