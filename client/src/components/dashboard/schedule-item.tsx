import { Appointment, Contact } from "@shared/schema";
import { formatDate, formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, Building2, MapPin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import { useQuery } from "@tanstack/react-query";

interface ScheduleItemProps {
  appointment: Appointment;
}

export default function ScheduleItem({ appointment }: ScheduleItemProps) {
  const { data: contact } = useQuery<Contact>({
    queryKey: [`/api/contacts/${appointment.contactId}`],
    enabled: !!appointment.contactId,
  });

  if (!contact) return null;

  const getContactInitials = () => {
    return `${contact.firstName[0]}${contact.lastName[0]}`;
  };

  const isCommercial = contact.type === "commercial";
  const contactName = isCommercial 
    ? contact.companyName 
    : `${contact.firstName} ${contact.lastName}`;

  return (
    <div className="p-4 border border-gray-200 rounded-md hover:border-primary transition-colors flex flex-col md:flex-row md:items-center">
      <div className="md:w-24 text-sm text-gray-600 font-medium">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-amber-500 mr-1" />
          <span>{formatTime(appointment.startTime)}</span>
        </div>
      </div>
      
      <div className="flex-1 mt-2 md:mt-0 md:ml-4">
        <h3 className="font-medium">{appointment.title}</h3>
        <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-1">
          {isCommercial ? (
            <Building2 className="h-4 w-4 text-gray-500 mr-1" />
          ) : (
            <User className="h-4 w-4 text-gray-500 mr-1" />
          )}
          
          <span>{contactName}</span>
          <span className="mx-2">•</span>
          <MapPin className="h-4 w-4 text-gray-500 mr-1" />
          <span>{appointment.location || `${contact.city}, ${contact.state}`}</span>
        </div>
      </div>
      
      <div className="mt-3 md:mt-0 flex items-center">
        <StatusBadge status={appointment.status} entity="appointment" />
        <Button variant="ghost" size="icon" className="ml-2">
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}
