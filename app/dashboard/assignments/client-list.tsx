"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

interface Assignment {
  id: string
  title: string
  description?: string | null
  dueDate: string | Date
  maxGrade: number
  assignmentGroups?: { group: { name: string } }[]
  assignmentStudents?: { student: { name: string } }[]
  submissions?: { status: string; isLate: boolean; grade?: { score: number } | null; student?: { name: string } }[]
}

export function AssignmentsClientList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [list, setList] = useState(assignments)

  const now = new Date()
  const upcoming = list.filter(a => new Date(a.dueDate) >= now)
  const past = list.filter(a => new Date(a.dueDate) < now)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Видалити завдання "${title}"? Ця дія незворотна.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" })
      if (res.ok) {
        setList(prev => prev.filter(a => a.id !== id))
        toast.success("Завдання видалено")
      } else {
        toast.error("Помилка видалення")
      }
    } finally {
      setDeleting(null)
    }
  }

  const renderAssignment = (a: Assignment) => {
    const dueDate = new Date(a.dueDate)
    const submittedCount = a.submissions?.length ?? 0
    const gradedCount = a.submissions?.filter(s => s.status === "GRADED").length ?? 0
    const isOverdue = now > dueDate
    const groups = a.assignmentGroups?.map(ag => ag.group.name) ?? []

    return (
      <div key={a.id} className="flex items-stretch gap-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center bg-[#BED9F4] rounded-l-xl px-4 py-4 min-w-[72px] flex-shrink-0">
          <span className="text-[10px] font-semibold text-[#1e3a52] uppercase tracking-wide">
            {format(dueDate, "MMM", { locale: uk })}
          </span>
          <span className="text-2xl font-bold text-[#1e3a52] leading-none">
            {format(dueDate, "d")}
          </span>
        </div>

        {/* Main content */}
        <Link href={`/dashboard/assignments/${a.id}`} className="flex-1 min-w-0 py-4 pr-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[#111111] leading-tight">{a.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {gradedCount > 0 && (
                <span className="text-[10px] bg-[#E0FFC2] text-green-800 px-1.5 py-0.5 rounded-full font-medium">
                  Оцінено: {gradedCount}
                </span>
              )}
              {submittedCount > 0 && (
                <span className="text-[10px] bg-[#EBF5FD] text-[#3A7AA8] px-1.5 py-0.5 rounded-full font-medium">
                  Здано: {submittedCount}
                </span>
              )}
            </div>
          </div>
          {a.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{a.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {groups.map(g => (
              <span key={g} className="text-[10px] bg-[#F0F4F8] text-gray-600 px-2 py-0.5 rounded-full">{g}</span>
            ))}
            <span className="text-[10px] text-gray-400">
              Термін: {format(dueDate, "d MMM yyyy, HH:mm", { locale: uk })}
            </span>
            <span className="text-[10px] text-gray-400">Макс: {a.maxGrade} б</span>
          </div>
        </Link>

        {/* Status indicator + delete */}
        <div className="flex flex-col items-center justify-center gap-2 pr-4 flex-shrink-0">
          {submittedCount > 0 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : isOverdue ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
          )}
          <button
            onClick={() => handleDelete(a.id, a.title)}
            disabled={deleting === a.id}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            title="Видалити завдання"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Активні ({upcoming.length})</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map(renderAssignment)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Минулі ({past.length})</h2>
          <div className="flex flex-col gap-3 opacity-75">
            {past.map(renderAssignment)}
          </div>
        </div>
      )}
    </>
  )
}
