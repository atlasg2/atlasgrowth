import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  footer?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  trend,
  footer
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {trend ? (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'} px-2 py-1 rounded`}>
            {trend.value}
          </span>
        ) : footer ? (
          <span className="text-xs font-medium text-neutral-medium">{footer}</span>
        ) : null}
      </div>
    </div>
  );
}
