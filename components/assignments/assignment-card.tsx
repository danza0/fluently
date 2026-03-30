import Link from "next/link"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Calendar, Users, Clock } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface AssignmentCardProps {
  assignment: {
    id: string
    title: string
    description?: string | null
    dueDate: string | Date
    maxGrade: number
    assignmentGroups?: { group: { name: string } }[]
    submissions?: { status: string; isLate: boolean; grade?: { score: number } | null }[]
  }
  role?: "TEACHER" | "STUDENT"
}

export function AssignmentCard({ assignment, role = "STUDENT" }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate)
  const isOverdue = new Date() > dueDate
  const submission = assignment.submissions?.[0]
  const href = role === "TEACHER" ? `/dashboard/assignments/${assignment.id}` : `/student/assignments/${assignment.id}`

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 leading-tight">{assignment.title}</h3>
          {submission ? (
            <StatusBadge status={submission.status as any} isLate={submission.isLate} />
          ) : isOverdue ? (
            <StatusBadge status="LATE" />
          ) : (
            <StatusBadge status="NOT_SUBMITTED" />
          )}
        </div>
        {assignment.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{assignment.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(dueDate, "d MMM yyyy", { locale: uk })}
          </span>
          {assignment.assignmentGroups && assignment.assignmentGroups.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {assignment.assignmentGroups.map((ag) => ag.group.name).join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Макс: {assignment.maxGrade} б
          </span>
        </div>
        {submission?.grade && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <span className="text-sm font-semibold text-green-600">Оцінка: {submission.grade.score}/{assignment.maxGrade}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
