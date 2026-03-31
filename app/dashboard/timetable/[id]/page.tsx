"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock, Users, ExternalLink, BookOpen, Pencil, Trash2, UserCheck, Rss, ClipboardList, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

type Tab = "stream" | "attendance" | "materials" | "students"

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "stream", label: "Стрічка", icon: Rss },
  { id: "attendance", label: "Відвідуваність", icon: UserCheck },
  { id: "materials", label: "Матеріали", icon: FileText },
  { id: "students", label: "Учні", icon: Users },
]

const statusFullLabel = (s: string) => s === "PRESENT" ? "Присутній" : s === "LATE" ? "Запізнився" : "Відсутній"
const statusClass = (s: string) =>
  s === "PRESENT" ? "bg-[#E0FFC2] text-green-800" : s === "LATE" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("stream")

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "", theme: "", description: "", date: "", startTime: "", endTime: "", meetLink: "",
  })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Attendance state
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "LATE" | "ABSENT">>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  const fetchLesson = async () => {
    const res = await fetch(`/api/lessons/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setLesson(data)
      // Initialize attendance from existing records
      const init: Record<string, "PRESENT" | "LATE" | "ABSENT"> = {}
      for (const m of data.group?.memberships ?? []) {
        const existing = data.attendances?.find((a: any) => a.student.id === m.user.id)
        init[m.user.id] = (existing?.status as "PRESENT" | "LATE" | "ABSENT") ?? "PRESENT"
      }
      setAttendance(init)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLesson() }, [params.id])

  const openEdit = () => {
    setEditForm({
      title: lesson.title,
      theme: lesson.theme ?? "",
      description: lesson.description ?? "",
      date: lesson.date.slice(0, 10),
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      meetLink: lesson.meetLink ?? "",
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editForm.title || !editForm.date || !editForm.startTime || !editForm.endTime) {
      toast.error("Заповніть усі обов'язкові поля")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/lessons/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, groupId: lesson.group.id, assignmentId: lesson.assignment?.id ?? null }),
      })
      if (res.ok) {
        toast.success("Урок оновлено!")
        setEditOpen(false)
        fetchLesson()
      } else {
        toast.error("Помилка збереження")
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async () => {
    setDeleting(true)
    const res = await fetch(`/api/lessons/${params.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Урок видалено")
      router.push("/dashboard/timetable")
    } else {
      toast.error("Помилка видалення")
      setDeleting(false)
    }
  }

  const saveAttendance = async () => {
    setSavingAttendance(true)
    const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }))
    const res = await fetch(`/api/lessons/${params.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: records }),
    })
    if (res.ok) {
      toast.success("Відвідуваність збережено!")
      fetchLesson()
    } else {
      toast.error("Помилка збереження")
    }
    setSavingAttendance(false)
  }

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>
  if (!lesson) return <div className="p-8 text-gray-500">Урок не знайдено</div>

  const members = lesson.group?.memberships ?? []
  const presentCount = lesson.attendances?.filter((a: any) => a.status === "PRESENT").length ?? 0
  const totalCount = members.length

  let dateFormatted = ""
  try {
    dateFormatted = format(new Date(lesson.date), "d MMMM yyyy, EEEE", { locale: uk })
  } catch {
    dateFormatted = lesson.date?.slice(0, 10) ?? ""
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      {/* Top Banner */}
      <div
        className="w-full h-44 relative flex items-end"
        style={{ background: "linear-gradient(135deg, #BED9F4 0%, #5B9BD1 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative z-10 flex items-end justify-between w-full px-8 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow">{lesson.title}</h1>
            <p className="text-white/80 text-sm mt-0.5">{lesson.group?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={openEdit}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Редагувати"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              className="text-white hover:bg-red-500/30 h-8 w-8"
              title="Видалити"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Link
          href="/dashboard/timetable"
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-8">
        <div className="flex gap-2 py-3">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-medium transition-all min-w-[90px] ${
                  active
                    ? "bg-[#BED9F4] text-[#1e3a52]"
                    : "bg-[#F5F8FA] text-gray-500 hover:bg-[#EBF5FD] hover:text-[#3A7AA8]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs leading-tight text-center">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* Stream Tab */}
            {tab === "stream" && (
              <motion.div
                key="stream"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-[#111111] mb-4">Інформація про урок</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Дата</p>
                        <p className="text-sm text-[#111111] capitalize">{dateFormatted}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#3A7AA8] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Час</p>
                        <p className="text-sm text-[#111111]">{lesson.startTime} – {lesson.endTime}</p>
                      </div>
                    </div>
                    {lesson.theme && (
                      <div className="flex items-start gap-3">
                        <span className="text-lg">📝</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Тема</p>
                          <p className="text-sm text-[#111111]">{lesson.theme}</p>
                        </div>
                      </div>
                    )}
                    {lesson.description && (
                      <div className="flex items-start gap-3">
                        <span className="text-lg">📖</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Опис / план уроку</p>
                          <p className="text-sm text-[#111111] whitespace-pre-wrap">{lesson.description}</p>
                        </div>
                      </div>
                    )}
                    {lesson.meetLink && (
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-[#3A7AA8] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Google Meet</p>
                          <a
                            href={lesson.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#3A7AA8] hover:underline break-all"
                          >
                            {lesson.meetLink}
                          </a>
                        </div>
                      </div>
                    )}
                    {lesson.assignment && (
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-[#3A7AA8] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Завдання</p>
                          <Link
                            href={`/dashboard/assignments/${lesson.assignment.id}`}
                            className="text-sm text-[#3A7AA8] hover:underline"
                          >
                            {lesson.assignment.title}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Attendance Tab */}
            {tab === "attendance" && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-[#111111] mb-1">Відвідуваність</h2>
                  <p className="text-xs text-gray-400 mb-4">Позначте присутність для кожного учня</p>
                  {members.length === 0 ? (
                    <p className="text-gray-400 text-sm py-8 text-center">У групі немає учнів</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m: any) => {
                        const status = attendance[m.user.id] ?? "PRESENT"
                        return (
                          <div key={m.user.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-[#EBF5FD] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-[#3A7AA8]">
                                {m.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#111111]">{m.user.name}</p>
                              <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                            </div>
                            <div className="flex gap-1">
                              {(["PRESENT", "LATE", "ABSENT"] as const).map(s => (
                                <button
                                  key={s}
                                  onClick={() => setAttendance(prev => ({ ...prev, [m.user.id]: s }))}
                                  className={`text-xs px-2.5 py-1.5 rounded font-medium transition-all ${
                                    status === s
                                      ? s === "PRESENT" ? "bg-[#E0FFC2] text-green-800" : s === "LATE" ? "bg-yellow-200 text-yellow-800" : "bg-red-200 text-red-700"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                >
                                  {s === "PRESENT" ? "П" : s === "LATE" ? "З" : "В"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="bg-[#E0FFC2] text-green-800 px-2 py-0.5 rounded">П — Присутній</span>
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">З — Запізнився</span>
                      <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded">В — Відсутній</span>
                    </div>
                    <Button
                      onClick={saveAttendance}
                      disabled={savingAttendance}
                      className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white"
                    >
                      {savingAttendance ? "Збереження..." : "Зберегти"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Materials Tab */}
            {tab === "materials" && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                  <h2 className="text-base font-semibold text-[#111111]">Матеріали уроку</h2>
                  {!lesson.assignment && !lesson.meetLink && !lesson.description ? (
                    <div className="text-center py-10">
                      <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає прикріплених матеріалів</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lesson.assignment && (
                        <div className="flex items-center gap-4 p-4 bg-[#EBF5FD] rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-[#3A7AA8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-0.5">Завдання</p>
                            <Link
                              href={`/dashboard/assignments/${lesson.assignment.id}`}
                              className="text-sm font-medium text-[#3A7AA8] hover:underline"
                            >
                              {lesson.assignment.title}
                            </Link>
                          </div>
                          <ClipboardList className="w-4 h-4 text-[#3A7AA8] flex-shrink-0" />
                        </div>
                      )}
                      {lesson.meetLink && (
                        <div className="flex items-center gap-4 p-4 bg-[#EBF5FD] rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="w-5 h-5 text-[#3A7AA8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-0.5">Google Meet</p>
                            <a
                              href={lesson.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-[#3A7AA8] hover:underline break-all"
                            >
                              {lesson.meetLink}
                            </a>
                          </div>
                          <ExternalLink className="w-4 h-4 text-[#3A7AA8] flex-shrink-0" />
                        </div>
                      )}
                      {lesson.description && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-400 mb-1.5">Опис / план уроку</p>
                          <p className="text-sm text-[#111111] whitespace-pre-wrap">{lesson.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Students Tab */}
            {tab === "students" && (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-[#111111] mb-4">
                    Учні групи <span className="text-gray-400 font-normal text-sm ml-1">({members.length})</span>
                  </h2>
                  {members.length === 0 ? (
                    <div className="text-center py-10">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">У групі немає учнів</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m: any) => {
                        const att = lesson.attendances?.find((a: any) => a.student.id === m.user.id)
                        return (
                          <div key={m.user.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                            <div className="w-9 h-9 rounded-full bg-[#EBF5FD] flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-[#3A7AA8]">
                                {m.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#111111]">{m.user.name}</p>
                              <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                            </div>
                            {att ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(att.status)}`}>
                                {statusFullLabel(att.status)}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Не відмічено</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#111111] mb-3">Інформація про урок</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-[#3A7AA8] flex-shrink-0" />
                <span className="truncate">{lesson.group?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-base">📅</span>
                <span className="capitalize">{dateFormatted}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-[#3A7AA8] flex-shrink-0" />
                <span>{lesson.startTime} – {lesson.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <UserCheck className="w-4 h-4 text-[#3A7AA8] flex-shrink-0" />
                <span>{presentCount} присутніх / {totalCount} учнів</span>
              </div>
            </div>
          </div>

          {lesson.assignment && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#111111] mb-3">Завдання</h3>
              <Link
                href={`/dashboard/assignments/${lesson.assignment.id}`}
                className="flex items-center gap-2 text-sm text-[#3A7AA8] hover:underline"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-2">{lesson.assignment.title}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редагувати урок</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-title">Назва уроку *</Label>
              <Input id="edit-title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-theme">Тема уроку</Label>
              <Input id="edit-theme" value={editForm.theme} onChange={e => setEditForm(f => ({ ...f, theme: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-date">Дата *</Label>
                <Input id="edit-date" type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Група</Label>
                <Input value={lesson.group?.name ?? ""} disabled className="bg-gray-50 text-gray-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-start">Початок *</Label>
                <Input id="edit-start" type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-end">Кінець *</Label>
                <Input id="edit-end" type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-meet">Посилання на урок (Google Meet)</Label>
              <Input id="edit-meet" value={editForm.meetLink} onChange={e => setEditForm(f => ({ ...f, meetLink: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <Label htmlFor="edit-desc">Опис / план уроку</Label>
              <Textarea id="edit-desc" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Скасувати</Button>
            <Button onClick={saveEdit} disabled={saving} className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white">
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити урок?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Урок <strong>{lesson.title}</strong> буде видалено разом з усіма записами про відвідуваність.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Скасувати</Button>
            <Button variant="destructive" onClick={deleteLesson} disabled={deleting}>
              {deleting ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
