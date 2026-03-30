"use client"

import Link from "next/link"
import { Users, BookOpen, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string | null
    joinCode: string
    memberships?: { id: string }[]
    assignmentGroups?: { id: string }[]
  }
  role?: "TEACHER" | "STUDENT"
}

export function GroupCard({ group, role = "STUDENT" }: GroupCardProps) {
  const href = role === "TEACHER" ? `/dashboard/groups/${group.id}` : `/student/groups/${group.id}`

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(group.joinCode)
    toast.success("Код скопійовано!")
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <Link href={href}>
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{group.name}</h3>
          {group.description && <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {group.memberships?.length ?? 0} учнів
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {group.assignmentGroups?.length ?? 0} завдань
          </span>
        </div>
      </Link>
      {role === "TEACHER" && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">Код:</span>
          <code className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{group.joinCode}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={copyCode}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
