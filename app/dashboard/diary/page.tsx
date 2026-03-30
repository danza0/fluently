"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Plus, BookMarked, Clock, Users, Link as LinkIcon, Trash2, ChevronDown, ChevronUp, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { format, isToday, isFuture, isPast } from "date-fns"
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
  attendances: { student: { id: string; name: string; nickname: string }; status: string; note?: string | null }[]
}

interface Group {
  id: string
  name: string
  memberships: { user: { id: string; name: string; nickname: string } }[]
}

interface Assignment {
  id: string
  title: string
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

export default function TeacherDiaryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<Record<string, Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }>>>({})
  const [savingAttendance, setSavingAttendance] = useState<string | null>(null)

  const fetchData = async () => {
    const [lessonsRes, groupsRes, assignmentsRes] = await Promise.all([
      fetch("/api/lessons"),
      fetch("/api/groups"),
      fetch("/api/assignments"),
    ])
    const [lessonsData, groupsData, assignmentsData] = await Promise.all([
      lessonsRes.json(),
      groupsRes.json(),
      assignmentsRes.json(),
    ])
    setLessons(lessonsData)
    setGroups(groupsData)
    setAssignments(assignmentsData)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const initAttendance = (lesson: Lesson) => {
    if (attendance[lesson.id]) return
    const group = groups.find(g => g.id === lesson.group.id)
    if (!group) return
    const init: Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }> = {}
    for (const m of group.memberships) {
      const existing = lesson.attendances.find(a => a.student.id === m.user.id)
      init[m.user.id] = { status: (existing?.status as "PRESENT" | "LATE" | "ABSENT") ?? "PRESENT", note: existing?.note ?? "" }
    }
    setAttendance(prev => ({ ...prev, [lesson.id]: init }))
  }

  const toggleLesson = (lesson: Lesson) => {
    if (expandedLesson === lesson.id) {
      setExpandedLesson(null)
    } else {
      setExpandedLesson(lesson.id)
      initAttendance(lesson)
    }
  }

  const saveAttendance = async (lessonId: string) => {
    setSavingAttendance(lessonId)
    const records = Object.entries(attendance[lessonId] || {}).map(([studentId, val]) => ({
      studentId,
      status: val.status,
      note: val.note || undefined,
    }))
    const res = await fetch(`/api/lessons/${lessonId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: records }),
    })
    if (res.ok) {
      toast.success("Відвідуваність збережена")
      await fetchData()
    } else {
      toast.error("Помилка збереження")
    }
    setSavingAttendance(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.date || !form.startTime || !form.endTime || !form.groupId) {
      toast.error("Заповніть обов'язкові поля")
      return
    }
    setSaving(true)
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        theme: form.theme || null,
        description: form.description || null,
        meetLink: form.meetLink || null,
        assignmentId: form.assignmentId || null,
      }),
    })
    if (res.ok) {
      toast.success("Урок створено!")
      setForm(emptyForm)
      setShowForm(false)
      await fetchData()
    } else {
      toast.error("Помилка створення уроку")
    }
    setSaving(false)
  }

  const deleteLesson = async (id: string) => {
    if (!confirm("Видалити урок?")) return
    const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Урок видалено")
      setLessons(prev => prev.filter(l => l.id !== id))
    } else {
      toast.error("Помилка видалення")
    }
  }

  const todayLessons = lessons.filter(l => isToday(new Date(l.date)))
  const upcomingLessons = lessons.filter(l => isFuture(new Date(l.date)) && !isToday(new Date(l.date)))
  const pastLessons = lessons.filter(l => isPast(new Date(l.date)) && !isToday(new Date(l.date)))

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Щоденник уроків</h1>
          <p className="text-gray-500 mt-1">Плануйте уроки та відстежуйте відвідуваність</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-sky-custom hover:bg-sky-dark text-sky-darker gap-2">
          <Plus className="w-4 h-4" />
          Новий урок
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новий урок</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Назва уроку *</Label>
                <Input placeholder="Наприклад: Present Perfect Tense" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Тема</Label>
                <Input placeholder="Тема уроку" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Опис</Label>
                <Textarea placeholder="Опис уроку, нотатки..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Дата *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Група *</Label>
                <Select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
                  <option value="">Оберіть групу</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Початок *</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Кінець *</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Посилання на урок (Google Meet тощо)</Label>
                <Input placeholder="https://meet.google.com/..." value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Пов&apos;язане завдання</Label>
                <Select value={form.assignmentId} onChange={e => setForm(f => ({ ...f, assignmentId: e.target.value }))}>
                  <option value="">Без завдання</option>
                  {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="bg-sky-custom hover:bg-sky-dark text-sky-darker">
                {saving ? "Збереження..." : "Створити урок"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm) }}>
                Скасувати
              </Button>
            </div>
          </form>
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookMarked className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає уроків</h3>
          <p className="text-gray-500">Створіть перший урок щоб почати</p>
        </div>
      ) : (
        <div className="space-y-8">
          {todayLessons.length > 0 && (
            <LessonSection
              title="Сьогодні"
              lessons={todayLessons}
              groups={groups}
              attendance={attendance}
              setAttendance={setAttendance}
              expandedLesson={expandedLesson}
              toggleLesson={toggleLesson}
              saveAttendance={saveAttendance}
              savingAttendance={savingAttendance}
              deleteLesson={deleteLesson}
              highlight
            />
          )}
          {upcomingLessons.length > 0 && (
            <LessonSection
              title="Майбутні"
              lessons={upcomingLessons}
              groups={groups}
              attendance={attendance}
              setAttendance={setAttendance}
              expandedLesson={expandedLesson}
              toggleLesson={toggleLesson}
              saveAttendance={saveAttendance}
              savingAttendance={savingAttendance}
              deleteLesson={deleteLesson}
            />
          )}
          {pastLessons.length > 0 && (
            <LessonSection
              title="Минулі"
              lessons={pastLessons}
              groups={groups}
              attendance={attendance}
              setAttendance={setAttendance}
              expandedLesson={expandedLesson}
              toggleLesson={toggleLesson}
              saveAttendance={saveAttendance}
              savingAttendance={savingAttendance}
              deleteLesson={deleteLesson}
              muted
            />
          )}
        </div>
      )}
    </div>
  )
}

function LessonSection({
  title, lessons, groups, attendance, setAttendance, expandedLesson, toggleLesson,
  saveAttendance, savingAttendance, deleteLesson, highlight, muted
}: {
  title: string
  lessons: Lesson[]
  groups: Group[]
  attendance: Record<string, Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }>>
  setAttendance: React.Dispatch<React.SetStateAction<Record<string, Record<string, { status: "PRESENT" | "LATE" | "ABSENT"; note: string }>>>>
  expandedLesson: string | null
  toggleLesson: (lesson: Lesson) => void
  saveAttendance: (id: string) => Promise<void>
  savingAttendance: string | null
  deleteLesson: (id: string) => Promise<void>
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className={muted ? "opacity-70" : ""}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {highlight && <span className="w-2 h-2 bg-sky-custom rounded-full inline-block" />}
        {title} ({lessons.length})
      </h2>
      <div className="space-y-3">
        {lessons.map(lesson => {
          const group = groups.find(g => g.id === lesson.group.id)
          const isExpanded = expandedLesson === lesson.id
          const attendanceData = attendance[lesson.id]
          const presentCount = lesson.attendances.filter(a => a.status === "PRESENT").length

          return (
            <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      {lesson.theme && <span className="text-xs text-sky-darker bg-sky-light px-2 py-0.5 rounded-full">{lesson.theme}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{format(new Date(lesson.date), "d MMMM yyyy", { locale: uk })}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.startTime} – {lesson.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {lesson.group.name}
                      </span>
                      {lesson.attendances.length > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <UserCheck className="w-3 h-3" />
                          {presentCount}/{lesson.attendances.length}
                        </span>
                      )}
                    </div>
                    {lesson.meetLink && (
                      <a href={lesson.meetLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-darker hover:underline mt-2">
                        <LinkIcon className="w-3 h-3" />
                        Посилання на урок
                      </a>
                    )}
                    {lesson.assignment && (
                      <div className="text-xs text-gray-400 mt-1">
                        Завдання: {lesson.assignment.title}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleLesson(lesson)}
                      className="p-1.5 rounded-lg hover:bg-sky-light text-gray-400 hover:text-sky-darker transition-colors"
                      title="Відвідуваність"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Видалити урок"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && group && (
                <div className="border-t border-gray-100 p-5 bg-sky-light/40">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Відвідуваність
                  </h4>
                  {group.memberships.length === 0 ? (
                    <p className="text-sm text-gray-500">У групі немає учнів</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {group.memberships.map(m => {
                          const studentData = attendanceData?.[m.user.id] ?? { status: "PRESENT" as const, note: "" }
                          return (
                            <div key={m.user.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                              <div className="flex gap-1">
                                {(["PRESENT", "LATE", "ABSENT"] as const).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setAttendance(prev => ({
                                      ...prev,
                                      [lesson.id]: {
                                        ...prev[lesson.id],
                                        [m.user.id]: { ...studentData, status: s }
                                      }
                                    }))}
                                    className={`text-xs px-2 py-1 rounded font-medium transition-all ${
                                      studentData.status === s
                                        ? s === "PRESENT" ? "bg-[#E0FFC2] text-green-800"
                                          : s === "LATE" ? "bg-yellow-200 text-yellow-800"
                                          : "bg-red-200 text-red-700"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    }`}
                                  >
                                    {s === "PRESENT" ? "П" : s === "LATE" ? "З" : "В"}
                                  </button>
                                ))}
                              </div>
                              <span className="flex-1 text-sm font-medium text-gray-800">{m.user.name}</span>
                              <span className="text-xs text-gray-400">{m.user.nickname}</span>
                              <input
                                type="text"
                                placeholder="Нотатка..."
                                value={studentData.note}
                                onChange={e => setAttendance(prev => ({
                                  ...prev,
                                  [lesson.id]: {
                                    ...prev[lesson.id],
                                    [m.user.id]: { ...studentData, note: e.target.value }
                                  }
                                }))}
                                className="text-xs border border-gray-200 rounded px-2 py-1 w-32 text-gray-600"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveAttendance(lesson.id)}
                        disabled={savingAttendance === lesson.id}
                        className="bg-sky-custom hover:bg-sky-dark text-sky-darker"
                      >
                        {savingAttendance === lesson.id ? "Збереження..." : "Зберегти відвідуваність"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
