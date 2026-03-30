"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, Clock, Users, ExternalLink, BookOpen, Pencil, Trash2, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"

interface Lesson {
  id: string
  title: string
  theme?: string | null
  description?: string | null
  date: string
  startTime: string
  endTime: string
  meetLink?: string | null
  group: { id: string; name: string }
  assignment?: { id: string; title: string } | null
  attendances: { student: { id: string; name: string }; status: string }[]
}

interface Group {
  id: string
  name: string
  memberships: { user: { id: string; name: string; nickname: string } }[]
}

const emptyForm = {
  title: "",
  theme: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  meetLink: "",
  groupId: "",
  assignmentId: "",
}

const DAYS_UA = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"]

const statusColor = (status: string) => {
  if (status === "PRESENT") return "bg-[#E0FFC2] text-green-800"
  if (status === "LATE") return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-700"
}

export default function TimetablePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceLesson, setAttendanceLesson] = useState<Lesson | null>(null)
  const [attendance, setAttendance] = useState<Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchData = async () => {
    const [lr, gr] = await Promise.all([fetch("/api/lessons"), fetch("/api/groups")])
    const [ld, gd] = await Promise.all([lr.json(), gr.json()])
    setLessons(Array.isArray(ld) ? ld : [])
    setGroups(Array.isArray(gd) ? gd : [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = (day?: Date) => {
    setEditLesson(null)
    setForm({ ...emptyForm, date: day ? format(day, "yyyy-MM-dd") : "" })
    setFormOpen(true)
  }

  const openEdit = (lesson: Lesson) => {
    setEditLesson(lesson)
    setForm({
      title: lesson.title,
      theme: lesson.theme ?? "",
      description: lesson.description ?? "",
      date: lesson.date.slice(0, 10),
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      meetLink: lesson.meetLink ?? "",
      groupId: lesson.group.id,
      assignmentId: lesson.assignment?.id ?? "",
    })
    setFormOpen(true)
  }

  const saveLesson = async () => {
    if (!form.title || !form.date || !form.startTime || !form.endTime || !form.groupId) {
      toast.error("Заповніть усі обов'язкові поля")
      return
    }
    setSaving(true)
    try {
      const url = editLesson ? `/api/lessons/${editLesson.id}` : "/api/lessons"
      const method = editLesson ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assignmentId: form.assignmentId || null }),
      })
      if (res.ok) {
        toast.success(editLesson ? "Урок оновлено!" : "Урок створено!")
        setFormOpen(false)
        fetchData()
      } else {
        toast.error("Помилка збереження")
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (lesson: Lesson) => {
    setDeleteTarget(lesson)
    setDeleteOpen(true)
  }

  const deleteLesson = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/lessons/${deleteTarget.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Урок видалено")
      setDeleteOpen(false)
      setDeleteTarget(null)
      fetchData()
    } else {
      toast.error("Помилка видалення")
    }
  }

  const openAttendance = (lesson: Lesson) => {
    const group = groups.find(g => g.id === lesson.group.id)
    if (!group) { toast.error("Групу не знайдено"); return }
    const init: Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }> = {}
    for (const m of group.memberships) {
      const existing = lesson.attendances.find(a => a.student.id === m.user.id)
      init[m.user.id] = {
        status: (existing?.status as "PRESENT" | "LATE" | "ABSENT") ?? "PRESENT",
        note: "",
      }
    }
    setAttendance(init)
    setAttendanceLesson(lesson)
    setAttendanceOpen(true)
  }

  const saveAttendance = async () => {
    if (!attendanceLesson) return
    setSavingAttendance(true)
    const records = Object.entries(attendance).map(([studentId, val]) => ({
      studentId,
      status: val.status,
      note: val.note,
    }))
    const res = await fetch(`/api/lessons/${attendanceLesson.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: records }),
    })
    if (res.ok) {
      toast.success("Відвідуваність збережено!")
      setAttendanceOpen(false)
      fetchData()
    } else {
      toast.error("Помилка збереження")
    }
    setSavingAttendance(false)
  }

  const lessonsOnDay = (day: Date) =>
    lessons
      .filter(l => isSameDay(new Date(l.date), day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="p-6 min-h-screen bg-[#FFFDF8]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Розклад</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(weekStart, "d MMM", { locale: uk })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: uk })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="text-xs px-3">
            Цей тиждень
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => openCreate()}
            className="ml-4 bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Додати урок
          </Button>
        </div>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="text-gray-400 py-16 text-center">Завантаження...</div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const dayLessons = lessonsOnDay(day)
            const today = isToday(day)
            return (
              <div key={idx} className="flex flex-col gap-2 min-h-[400px]">
                {/* Day header */}
                <div
                  className={`rounded-lg p-2 text-center cursor-pointer transition-colors ${
                    today ? "bg-[#BED9F4] text-[#1e3a52]" : "bg-white border border-gray-100 text-gray-600 hover:bg-[#EBF5FD]"
                  }`}
                  onClick={() => openCreate(day)}
                  title="Додати урок на цей день"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide">{DAYS_UA[idx].slice(0, 2)}</div>
                  <div className={`text-lg font-bold ${today ? "text-[#1e3a52]" : "text-[#111111]"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="text-xs text-gray-400">{format(day, "MMM", { locale: uk })}</div>
                </div>

                {/* Lessons */}
                <AnimatePresence>
                  {dayLessons.map(lesson => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-[#D5EAFB] rounded-xl p-3 group hover:shadow-md hover:border-[#BED9F4] transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-[#111111] leading-tight line-clamp-2 flex-1">{lesson.title}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => openAttendance(lesson)}
                            className="p-0.5 rounded hover:bg-[#EBF5FD] text-gray-400 hover:text-[#3A7AA8]"
                            title="Відвідуваність"
                          >
                            <UserCheck className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openEdit(lesson)}
                            className="p-0.5 rounded hover:bg-[#EBF5FD] text-gray-400 hover:text-[#3A7AA8]"
                            title="Редагувати"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => confirmDelete(lesson)}
                            className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Видалити"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {lesson.theme && (
                        <div className="text-[10px] text-[#3A7AA8] bg-[#EBF5FD] px-1.5 py-0.5 rounded mb-1.5 line-clamp-1">
                          {lesson.theme}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {lesson.startTime} – {lesson.endTime}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
                        <Users className="w-2.5 h-2.5" />
                        <span className="line-clamp-1">{lesson.group.name}</span>
                      </div>

                      {lesson.assignment && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <BookOpen className="w-2.5 h-2.5" />
                          <span className="line-clamp-1">{lesson.assignment.title}</span>
                        </div>
                      )}

                      {lesson.meetLink && (
                        <a
                          href={lesson.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-[#3A7AA8] hover:underline mt-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          Meet
                        </a>
                      )}

                      {lesson.attendances.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1.5">
                          {lesson.attendances.slice(0, 3).map(a => (
                            <span
                              key={a.student.id}
                              className={`text-[9px] px-1 py-0.5 rounded ${statusColor(a.status)}`}
                            >
                              {a.student.name.split(" ")[0]}
                            </span>
                          ))}
                          {lesson.attendances.length > 3 && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">
                              +{lesson.attendances.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add button */}
                <button
                  onClick={() => openCreate(day)}
                  className="mt-auto text-[10px] text-gray-400 hover:text-[#3A7AA8] hover:bg-[#EBF5FD] rounded-lg p-1.5 transition-colors flex items-center justify-center gap-1 border border-dashed border-gray-200 hover:border-[#BED9F4]"
                >
                  <Plus className="w-3 h-3" />
                  Урок
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit lesson dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLesson ? "Редагувати урок" : "Додати урок"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Назва уроку *</Label>
              <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Математика" />
            </div>
            <div>
              <Label htmlFor="theme">Тема уроку</Label>
              <Input id="theme" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="Квадратні рівняння" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Дата *</Label>
                <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="groupId">Група *</Label>
                <select
                  id="groupId"
                  value={form.groupId}
                  onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Обрати групу</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime">Початок *</Label>
                <Input id="startTime" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="endTime">Кінець *</Label>
                <Input id="endTime" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="meetLink">Посилання на урок (Google Meet)</Label>
              <Input id="meetLink" value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <Label htmlFor="description">Опис / план уроку</Label>
              <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Короткий план заняття..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Скасувати</Button>
            <Button
              onClick={saveLesson}
              disabled={saving}
              className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white"
            >
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
            Урок <strong>{deleteTarget?.title}</strong> буде видалено разом з усіма записами про відвідуваність.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Скасувати</Button>
            <Button variant="destructive" onClick={deleteLesson}>Видалити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Відвідуваність — {attendanceLesson?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {attendanceLesson && (() => {
              const group = groups.find(g => g.id === attendanceLesson.group.id)
              if (!group) return <p className="text-gray-400 text-sm">Учнів не знайдено</p>
              return group.memberships.map(m => {
                const val = attendance[m.user.id] ?? { status: "PRESENT", note: "" }
                return (
                  <div key={m.user.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111111]">{m.user.name}</p>
                      <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                    </div>
                    <div className="flex gap-1">
                      {(["PRESENT", "LATE", "ABSENT"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setAttendance(prev => ({
                            ...prev,
                            [m.user.id]: { ...prev[m.user.id], status: s }
                          }))}
                          className={`text-xs px-2 py-1 rounded font-medium transition-all ${
                            val.status === s
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
              })
            })()}
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span className="bg-[#E0FFC2] text-green-800 px-2 py-0.5 rounded">П — Присутній</span>
            <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">З — Запізнився</span>
            <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded">В — Відсутній</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceOpen(false)}>Скасувати</Button>
            <Button
              onClick={saveAttendance}
              disabled={savingAttendance}
              className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white"
            >
              {savingAttendance ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
