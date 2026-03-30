import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: string
}

export function StatsCard({ title, value, description, icon: Icon, iconColor = "text-blue-600", iconBg = "bg-blue-100", trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        {trend && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">{trend}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
    </div>
  )
}
