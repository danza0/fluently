"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, CheckCircle, XCircle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Assignment {
  id: string
  title: string
  description?: string | null
  dueDate: string | Date | null
  maxGrade: number
  assignmentGroups?: { group: { name: string } }[]
  assignmentStudents?: { student: { name: string } }[]
  submissions?: { status: string; isLate: boolean; grade?: { score: number } | null; student?: { name: string } }[]
}

export function AssignmentsClientList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [list, setList] = useState(assignments)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)

  const [editTarget, setEditTarget] = useState<Assignment | null>(null)
  const [editForm, setEditForm] = useState({ title: "", description: "", dueDate: "", maxGrade: 12 })
  const [savingEdit, setSavingEdit] = useState(false)

  const now = new Date()
  const upcoming = list.filter(a => !a.dueDate || new Date(a.dueDate) >= now)
  const past = list.filter(a => a.dueDate && new Date(a.dueDate) < now)

  const confirmDelete = (a: Assignment) => {
    setDeleteTarget(a)
  }

  const openEdit = (a: Assignment) => {
    setEditForm({
      title: a.title,
      description: a.description ?? "",
      dueDate: a.dueDate ? format(new Date(a.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
      maxGrade: a.maxGrade,
    })
    setEditTarget(a)
  }

  const saveEdit = async () => {
    if (!editTarget) return
    if (!editForm.title.trim()) { toast.error("Введіть назву"); return }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/assignments/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description,
          dueDate: editForm.dueDate || null,
          maxGrade: Number(editForm.maxGrade),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setList(prev => prev.map(a => a.id === editTarget.id
          ? { ...a, title: updated.title, description: updated.description, dueDate: updated.dueDate, maxGrade: updated.maxGrade }
          : a))
        toast.success("Завдання оновлено")
        setEditTarget(null)
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || "Помилка збереження")
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      const res = await fetch(`/api/assignments/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setList(prev => prev.filter(a => a.id !== deleteTarget.id))
        toast.success("Завдання видалено")
      } else {
        toast.error("Помилка видалення")
      }
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  const renderAssignment = (a: Assignment) => {
    const dueDate = a.dueDate ? new Date(a.dueDate) : null
    const submittedCount = a.submissions?.length ?? 0
    const gradedCount = a.submissions?.filter(s => s.status === "GRADED").length ?? 0
    const isOverdue = dueDate ? now > dueDate : false
    const groups = a.assignmentGroups?.map(ag => ag.group.name) ?? []

    return (
      <div key={a.id} className="flex items-stretch gap-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center bg-[var(--accent-300)] rounded-l-xl px-4 py-4 min-w-[72px] flex-shrink-0">
          <span className="text-[10px] font-semibold text-[var(--accent-900)] uppercase tracking-wide">
            {dueDate ? format(dueDate, "MMM", { locale: uk }) : "Без"}
          </span>
          <span className={dueDate ? "text-2xl font-bold text-[var(--accent-900)] leading-none" : "text-[10px] font-semibold text-[var(--accent-900)] leading-none"}>
            {dueDate ? format(dueDate, "d") : "дедлайну"}
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
                <span className="text-[10px] bg-[var(--accent-100)] text-[var(--accent-600)] px-1.5 py-0.5 rounded-full font-medium">
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
              {dueDate ? `Термін: ${format(dueDate, "d MMM yyyy, HH:mm", { locale: uk })}` : "Без дедлайну"}
            </span>
            <span className="text-[10px] text-gray-400">Макс: {a.maxGrade} б</span>
          </div>
        </Link>

        {/* Status indicator + actions */}
        <div className="flex flex-col items-center justify-center gap-1.5 pr-3 md:pr-4 flex-shrink-0">
          {submittedCount > 0 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : isOverdue ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEdit(a)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--accent-600)] hover:bg-[var(--accent-100)] transition-all"
              title="Редагувати завдання"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => confirmDelete(a)}
              disabled={deleting === a.id}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Видалити завдання"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-lg font-medium">Немає завдань</p>
          <p className="text-sm mt-1">Створіть перше завдання, натиснувши кнопку вище</p>
        </div>
      )}
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

      {/* Edit assignment dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати завдання</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Назва *</Label>
              <Input id="edit-title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Опис</Label>
              <Textarea id="edit-description" rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Дедлайн (порожньо = без дедлайну)</Label>
                <Input id="edit-dueDate" type="datetime-local" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxGrade">Макс. оцінка</Label>
                <Input id="edit-maxGrade" type="number" min={1} max={12} value={editForm.maxGrade} onChange={e => setEditForm(f => ({ ...f, maxGrade: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Скасувати</Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white">
              {savingEdit ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog (non-blocking) */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити завдання?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Завдання <strong>{deleteTarget?.title}</strong> буде видалено. Ця дія незворотна.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Скасувати</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting === deleteTarget?.id}>
              {deleting === deleteTarget?.id ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
