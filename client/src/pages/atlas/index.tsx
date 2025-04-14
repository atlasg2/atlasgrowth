import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  ChevronLeft, ChevronRight, Search, Phone, Mail, 
  MapPin, RefreshCw, Calendar, FileText, UserCheck, 
  Star, ExternalLink, Globe, Clipboard, Check, Database 
} from "lucide-react";
import { format } from "date-fns";

// Utils function to format phone numbers
const formatPhone = (phone: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// Status badge colors
const statusColors = {
  prospect: "bg-gray-200 text-gray-700",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-yellow-100 text-yellow-700",
  demo: "bg-purple-100 text-purple-700",
  client: "bg-green-100 text-green-700",
};

// Component for displaying the status badge
const StatusBadge = ({ status }: { status: string }) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-200 text-gray-700";
  
  return (
    <Badge className={colorClass}>{label}</Badge>
  );
};

// Interface for contractor
interface Contractor {
  id: number;
  name: string;
  email: string;
  phone: string;
  phoneType?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  slug: string;
  status: string;
  lastContactedDate: string | null;
  notes: string | null;
  leadSource: string | null;
  rating?: string;
  reviewCount?: string;
  reviewsLink?: string;
  website?: string;
  placeId?: string;
  photosCount?: string;
  siteUrl?: string;
}

// Interface for pagination
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Interface for summary
interface Summary {
  prospect: number;
  contacted: number;
  qualified: number;
  demo: number;
  client: number;
  total: number;
}

// Component for the Atlas dashboard
export default function AtlasPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, sortBy, sortDir]);
  
  // Query to fetch pipeline summary
  const summaryQuery = useQuery({
    queryKey: ["atlas-summary"],
    queryFn: async () => {
      const response = await fetch("/api/atlas/pipeline-summary");
      if (!response.ok) {
        throw new Error("Failed to fetch pipeline summary");
      }
      return response.json() as Promise<Summary>;
    }
  });
  
  // Query to fetch contractors with filters
  const contractorsQuery = useQuery({
    queryKey: ["atlas-contractors", activeTab, searchTerm, page, sortBy, sortDir],
    queryFn: async () => {
      // Determine status filter based on active tab
      const statusFilter = activeTab !== "all" ? activeTab : null;
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.set("status", statusFilter);
      if (searchTerm) queryParams.set("search", searchTerm);
      if (sortBy) queryParams.set("sortBy", sortBy);
      if (sortDir) queryParams.set("sortDir", sortDir);
      if (page) queryParams.set("page", page.toString());
      
      const response = await fetch(`/api/atlas/contractors?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch contractors");
      }
      
      return response.json() as Promise<{
        contractors: Contractor[];
        pagination: Pagination;
      }>;
    }
  });
  
  // Open contractor detail dialog
  const openContractorDetail = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setNotes(contractor.notes || "");
    setIsDetailOpen(true);
  };
  
  // Save notes for a contractor
  const saveNotes = async () => {
    if (!selectedContractor) return;
    
    try {
      const response = await fetch(`/api/atlas/contractors/${selectedContractor.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          lastContactedDate: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update notes");
      }
      
      // Refetch data
      contractorsQuery.refetch();
      
      toast({
        title: "Notes saved",
        description: "Contractor notes have been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contractor notes",
        variant: "destructive",
      });
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };
  
  // Handle status change
  const handleStatusChange = async (contractorId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/atlas/contractors/${contractorId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          lastContactedDate: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      
      // Refetch data
      contractorsQuery.refetch();
      summaryQuery.refetch();
      
      toast({
        title: "Status updated",
        description: "Contractor status has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contractor status",
        variant: "destructive",
      });
    }
  };
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortDir("asc");
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };
  
  // Data for pipeline tabs
  const pipelineTabs = [
    { id: "all", label: "All", count: summaryQuery.data?.total || 0 },
    { id: "prospect", label: "Prospects", count: summaryQuery.data?.prospect || 0 },
    { id: "contacted", label: "Contacted", count: summaryQuery.data?.contacted || 0 },
    { id: "qualified", label: "Qualified", count: summaryQuery.data?.qualified || 0 },
    { id: "demo", label: "Demo", count: summaryQuery.data?.demo || 0 },
    { id: "client", label: "Clients", count: summaryQuery.data?.client || 0 },
  ];
  
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Atlas Growth Pipeline</CardTitle>
          <CardDescription>
            Manage contractor sales pipeline and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full">
              {pipelineTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="relative">
                  {tab.label}
                  <Badge variant="outline" className="ml-2">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Content will be the same for all tabs, just filtered differently */}
            {pipelineTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search contractors..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        contractorsQuery.refetch();
                        summaryQuery.refetch();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort("name")}
                        >
                          Company {getSortIndicator("name")}
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort("status")}
                        >
                          Status {getSortIndicator("status")}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort("lastContactedDate")}
                        >
                          Last Contact {getSortIndicator("lastContactedDate")}
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractorsQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 mx-auto animate-spin" />
                            <span className="mt-2 block">Loading contractors...</span>
                          </TableCell>
                        </TableRow>
                      ) : contractorsQuery.data?.contractors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <span className="text-muted-foreground">No contractors found</span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        contractorsQuery.data?.contractors.map((contractor) => (
                          <TableRow key={contractor.id}>
                            <TableCell 
                              className="font-medium cursor-pointer hover:text-blue-600"
                              onClick={() => openContractorDetail(contractor)}
                            >
                              {contractor.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-sm">{contractor.email}</span>
                                </div>
                                {contractor.phone && (
                                  <div className="flex items-center mt-1">
                                    <Phone className="h-4 w-4 mr-1 text-gray-500" />
                                    <span className="text-sm">{formatPhone(contractor.phone)}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(contractor.city || contractor.state) && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-sm">
                                    {[contractor.city, contractor.state].filter(Boolean).join(", ")}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={contractor.status || "prospect"} />
                            </TableCell>
                            <TableCell>
                              {contractor.lastContactedDate ? (
                                <span className="text-sm">
                                  {format(new Date(contractor.lastContactedDate), "MMM d, yyyy")}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Select 
                                  onValueChange={(value) => handleStatusChange(contractor.id, value)}
                                  defaultValue={contractor.status || "prospect"}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Change status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="prospect">Prospect</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="demo">Demo</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => openContractorDetail(contractor)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {contractorsQuery.data && contractorsQuery.data.pagination.pages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Showing {((page - 1) * contractorsQuery.data.pagination.limit) + 1} to{" "}
                      {Math.min(page * contractorsQuery.data.pagination.limit, contractorsQuery.data.pagination.total)}{" "}
                      of {contractorsQuery.data.pagination.total} contractors
                    </span>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === contractorsQuery.data.pagination.pages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for recent activities - will implement in future */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <UserCheck className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Atlas HVAC changed to Qualified</p>
                  <p className="text-xs text-gray-500">Today at 2:30 PM</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Demo scheduled with SunCity Services</p>
                  <p className="text-xs text-gray-500">Yesterday at 11:15 AM</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Mail className="h-4 w-4 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email sent to Franklin Cooling</p>
                  <p className="text-xs text-gray-500">Apr 12, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Demos</CardTitle>
            <CardDescription>Scheduled demonstrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for demos - will implement in future */}
              <div className="p-3 border rounded-md">
                <div className="flex justify-between">
                  <p className="font-medium">Atlas HVAC</p>
                  <Badge>Apr 15, 2:00 PM</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">Product walkthrough with team</p>
              </div>
              
              <div className="p-3 border rounded-md">
                <div className="flex justify-between">
                  <p className="font-medium">Summit Cooling</p>
                  <Badge>Apr 17, 10:30 AM</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">Initial system overview</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
            <CardDescription>Pipeline performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for metrics - will implement in future */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Prospect → Contacted</span>
                <span className="font-medium">43%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-[43%]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Contacted → Qualified</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-[65%]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Qualified → Demo</span>
                <span className="font-medium">27%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-[27%]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Demo → Client</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-[75%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Contractor Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          {selectedContractor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {selectedContractor.name}
                  {selectedContractor.rating && (
                    <div className="flex items-center ml-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{selectedContractor.rating}</span>
                      {selectedContractor.reviewCount && (
                        <span className="text-gray-500 ml-1">({selectedContractor.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  <StatusBadge status={selectedContractor.status || "prospect"} />
                  {selectedContractor.lastContactedDate && (
                    <span className="text-sm ml-2">
                      Last contacted: {format(new Date(selectedContractor.lastContactedDate), "MMM d, yyyy")}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {/* Email */}
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{selectedContractor.email}</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => copyToClipboard(selectedContractor.email, "email")}
                        >
                          {copySuccess === "email" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {/* Phone */}
                      {selectedContractor.phone && (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatPhone(selectedContractor.phone)}</span>
                            {selectedContractor.phoneType && (
                              <span className="text-xs text-gray-500 ml-1">({selectedContractor.phoneType})</span>
                            )}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(selectedContractor.phone, "phone")}
                          >
                            {copySuccess === "phone" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {/* Address */}
                      {(selectedContractor.address || selectedContractor.city || selectedContractor.state) && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            {selectedContractor.address && <div>{selectedContractor.address}</div>}
                            <div>
                              {[
                                selectedContractor.city,
                                selectedContractor.state,
                                selectedContractor.zip
                              ].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <h3 className="text-sm font-medium mt-4 mb-2">Online Presence</h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {/* Website */}
                      {selectedContractor.website && (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-gray-500" />
                            <a 
                              href={selectedContractor.website.startsWith('http') 
                                ? selectedContractor.website 
                                : `https://${selectedContractor.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedContractor.website}
                            </a>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(selectedContractor.website!, "website")}
                          >
                            {copySuccess === "website" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {/* Reviews Link */}
                      {selectedContractor.reviewsLink && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-gray-500" />
                          <a 
                            href={selectedContractor.reviewsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Google Reviews
                          </a>
                        </div>
                      )}
                      
                      {/* Photos Count */}
                      {selectedContractor.photosCount && (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Photos in listing: {selectedContractor.photosCount}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <Card>
                    <CardContent className="p-4">
                      <Textarea 
                        placeholder="Add notes about this contractor..."
                        className="min-h-[150px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </CardContent>
                    <CardFooter className="px-4 py-3 border-t flex justify-between">
                      <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</span>
                      <Button onClick={saveNotes}>Save Notes</Button>
                    </CardFooter>
                  </Card>
                  
                  <h3 className="text-sm font-medium mt-4 mb-2">Software Access</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Login URL: </span>
                            <a 
                              href={`/view-as/${selectedContractor.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-1 text-blue-600 hover:underline"
                            >
                              /view-as/{selectedContractor.slug}
                            </a>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(`${window.location.origin}/view-as/${selectedContractor.slug}`, "loginUrl")}
                          >
                            {copySuccess === "loginUrl" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        <div className="text-sm">
                          <p className="mb-1"><strong>Username:</strong> {selectedContractor.slug}</p>
                          <p><strong>Password:</strong> {selectedContractor.slug}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            Note: For prospects, the username and password are both set to their slug
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}