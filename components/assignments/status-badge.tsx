import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "PENDING" | "SUBMITTED" | "GRADED" | "LATE" | "NOT_SUBMITTED"
  isLate?: boolean
}

const statusConfig = {
  PENDING: { label: "Очікує", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  SUBMITTED: { label: "Здано", className: "bg-sky-mid text-blue-800 hover:bg-sky-mid" },
  GRADED: { label: "Оцінено", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  LATE: { label: "Прострочено", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  NOT_SUBMITTED: { label: "Не здано", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
}

export function StatusBadge({ status, isLate }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.NOT_SUBMITTED
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      {config.label}
      {isLate && status === "SUBMITTED" && " (пізно)"}
    </span>
  )
}
