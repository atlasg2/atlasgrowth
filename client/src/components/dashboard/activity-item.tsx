import { Activity, Contact, Job, Invoice, Review, Message } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const getIconForActivityType = (type: string) => {
    switch (type) {
      case "invoice_paid":
      case "invoice_created":
        return <span className="material-icons text-sm">receipt</span>;
      case "job_completed":
        return <span className="material-icons text-sm">check_circle</span>;
      case "review_received":
        return <span className="material-icons text-sm">star</span>;
      case "job_created":
        return <span className="material-icons text-sm">edit</span>;
      case "message_received":
        return <span className="material-icons text-sm">chat</span>;
      default:
        return <span className="material-icons text-sm">notifications</span>;
    }
  };
  
  const getIconBgColorForActivityType = (type: string) => {
    switch (type) {
      case "invoice_paid":
      case "invoice_created":
        return "bg-primary-light";
      case "job_completed":
        return "bg-secondary-light";
      case "review_received":
        return "bg-yellow-400";
      case "job_created":
        return "bg-primary-light";
      case "message_received":
        return "bg-amber-500";
      default:
        return "bg-gray-400";
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const formatTimestamp = (date: Date) => {
    const dt = new Date(date);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex">
      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${getIconBgColorForActivityType(activity.type)} flex items-center justify-center text-white`}>
        {getIconForActivityType(activity.type)}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}
