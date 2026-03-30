"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AssignmentCard } from "@/components/assignments/assignment-card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Assignment {
  id: string
  title: string
  description?: string | null
  dueDate: string | Date
  maxGrade: number
  assignmentGroups?: { group: { name: string } }[]
  submissions?: { status: string; isLate: boolean; grade?: { score: number } | null }[]
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

  const renderAssignment = (a: Assignment) => (
    <div key={a.id} className="relative group">
      <AssignmentCard assignment={a} role="TEACHER" />
      <button
        onClick={() => handleDelete(a.id, a.title)}
        disabled={deleting === a.id}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Видалити завдання"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <>
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Активні ({upcoming.length})</h2>
          <div className="grid gap-4">
            {upcoming.map(renderAssignment)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Минулі ({past.length})</h2>
          <div className="grid gap-4 opacity-75">
            {past.map(renderAssignment)}
          </div>
        </div>
      )}
    </>
  )
}
