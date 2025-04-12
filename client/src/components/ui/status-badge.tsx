import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  entity: "job" | "invoice" | "appointment" | "review";
}

export default function StatusBadge({ status, entity }: StatusBadgeProps) {
  const getStatusConfig = () => {
    // Job statuses
    if (entity === "job") {
      switch (status) {
        case "estimate":
          return { color: "bg-gray-100 text-gray-800", label: "Estimate" };
        case "scheduled":
          return { color: "bg-yellow-100 text-yellow-800", label: "Scheduled" };
        case "in_progress":
          return { color: "bg-blue-100 text-blue-800", label: "In Progress" };
        case "completed":
          return { color: "bg-green-100 text-green-800", label: "Completed" };
        case "cancelled":
          return { color: "bg-red-100 text-red-800", label: "Cancelled" };
        default:
          return { color: "bg-gray-100 text-gray-800", label: status };
      }
    }
    
    // Invoice statuses
    if (entity === "invoice") {
      switch (status) {
        case "draft":
          return { color: "bg-gray-100 text-gray-800", label: "Draft" };
        case "sent":
          return { color: "bg-yellow-100 text-yellow-800", label: "Pending" };
        case "paid":
          return { color: "bg-green-100 text-green-800", label: "Paid" };
        case "overdue":
          return { color: "bg-red-100 text-red-800", label: "Overdue" };
        case "cancelled":
          return { color: "bg-red-100 text-red-800", label: "Cancelled" };
        default:
          return { color: "bg-gray-100 text-gray-800", label: status };
      }
    }
    
    // Appointment statuses
    if (entity === "appointment") {
      switch (status) {
        case "pending":
          return { color: "bg-yellow-100 text-yellow-800", label: "Pending" };
        case "confirmed":
          return { color: "bg-green-100 text-green-800", label: "Confirmed" };
        case "completed":
          return { color: "bg-green-100 text-green-800", label: "Completed" };
        case "cancelled":
          return { color: "bg-red-100 text-red-800", label: "Cancelled" };
        default:
          return { color: "bg-gray-100 text-gray-800", label: status };
      }
    }
    
    // Default fallback
    return { color: "bg-gray-100 text-gray-800", label: status };
  };
  
  const config = getStatusConfig();
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
