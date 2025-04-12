import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, UserIcon, UserPlusIcon, Mail, Phone, Badge } from "lucide-react";

export default function TeamPage() {
  const { user } = useAuth();
  
  // This is a placeholder for team members data
  // In a real implementation, this would come from an API call
  const teamMembers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@hvacpro.com",
      phone: "(555) 123-4567",
      role: "Admin",
      avatar: null,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@hvacpro.com",
      phone: "(555) 234-5678",
      role: "Technician",
      avatar: null,
    },
  ];

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Team members list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-3">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10" />
                  )}
                </div>
                <h3 className="text-lg font-medium">{member.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {member.role}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}