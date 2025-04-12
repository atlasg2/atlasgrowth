import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contractor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  SearchIcon, 
  PlusIcon,
  Building,
  CalendarIcon,
  UserPlusIcon,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminContractorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Sample contractors data
  const contractors = [
    {
      id: 1,
      name: "Cool Air Services",
      slug: "cool-air-services",
      email: "contact@coolairservices.com",
      phone: "(555) 123-4567",
      city: "Phoenix",
      state: "AZ",
      status: "active",
      createdAt: "2023-01-15",
      lastActive: "2023-05-01",
    },
    {
      id: 2,
      name: "Comfort Climate",
      slug: "comfort-climate",
      email: "info@comfortclimate.com",
      phone: "(555) 234-5678",
      city: "Atlanta",
      state: "GA",
      status: "active",
      createdAt: "2023-02-10",
      lastActive: "2023-05-02",
    },
    {
      id: 3,
      name: "Premier HVAC Solutions",
      slug: "premier-hvac",
      email: "support@premierhvac.com",
      phone: "(555) 345-6789",
      city: "Dallas",
      state: "TX",
      status: "inactive",
      createdAt: "2023-03-05",
      lastActive: "2023-04-15",
    },
    {
      id: 4,
      name: "Arctic Air Systems",
      slug: "arctic-air",
      email: "info@arcticair.com",
      phone: "(555) 456-7890",
      city: "Chicago",
      state: "IL",
      status: "active",
      createdAt: "2023-03-22",
      lastActive: "2023-05-03",
    },
    {
      id: 5,
      name: "Sunshine Heating & Cooling",
      slug: "sunshine-hvac",
      email: "contact@sunshinehvac.com",
      phone: "(555) 567-8901",
      city: "Miami",
      state: "FL",
      status: "active",
      createdAt: "2023-04-01",
      lastActive: "2023-05-02",
    },
  ];

  // Filter contractors based on search query
  const filteredContractors = contractors.filter(contractor => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      contractor.name.toLowerCase().includes(query) ||
      contractor.email.toLowerCase().includes(query) ||
      contractor.phone.includes(query) ||
      contractor.city.toLowerCase().includes(query) ||
      contractor.state.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <Button>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Add Contractor
        </Button>
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Contractors list */}
      <Card>
        <CardHeader>
          <CardTitle>All Contractors</CardTitle>
          <CardDescription>
            {filteredContractors.length} contractors found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-2">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          {contractor.name}
                          <div className="text-xs text-gray-500">/{contractor.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{contractor.email}</div>
                      <div className="text-xs text-gray-500">{contractor.phone}</div>
                    </TableCell>
                    <TableCell>{contractor.city}, {contractor.state}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {contractor.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                        {contractor.createdAt}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                        {contractor.lastActive}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}