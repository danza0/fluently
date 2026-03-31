"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock, Users, ExternalLink, BookOpen, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addDays, startOfWeek, isToday } from "date-fns"
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
  teacher: { id: string; name: string; nickname: string }
  assignment?: { id: string; title: string } | null
  attendances: { student: { id: string }; status: string; note?: string | null }[]
}

const DAYS_UA = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"]

const attendanceInfo = (status: string) => {
  if (status === "PRESENT") return { label: "Присутній", cls: "bg-[#E0FFC2] text-green-800" }
  if (status === "LATE") return { label: "Запізнився", cls: "bg-yellow-100 text-yellow-800" }
  return { label: "Відсутній", cls: "bg-red-100 text-red-700" }
}

export default function StudentDiaryPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Lesson | null>(null)

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const fetchData = async () => {
      const [lr, sr] = await Promise.all([fetch("/api/lessons"), fetch("/api/auth/session")])
      const [ld, sd] = await Promise.all([lr.json(), sr.json()])
      setLessons(Array.isArray(ld) ? ld : [])
      setCurrentUserId(sd?.user?.id ?? null)
      setLoading(false)
    }
    fetchData()
  }, [])

  const lessonsOnDay = (day: Date) =>
    lessons
      .filter(l => l.date.slice(0, 10) === format(day, "yyyy-MM-dd"))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const myAttendance = (lesson: Lesson) =>
    currentUserId ? lesson.attendances.find(a => a.student.id === currentUserId) : null

  return (
    <div className="p-6 min-h-screen bg-[#FFFDF8]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Щоденник</h1>
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
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 py-16 text-center">Завантаження...</div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const dayLessons = lessonsOnDay(day)
            const today = isToday(day)
            return (
              <div key={idx} className="flex flex-col gap-2 min-h-[300px]">
                {/* Day header */}
                <div className={`rounded-lg p-2 text-center ${today ? "bg-[#BED9F4] text-[#1e3a52]" : "bg-white border border-gray-100 text-gray-600"}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide">{DAYS_UA[idx].slice(0, 2)}</div>
                  <div className={`text-lg font-bold ${today ? "text-[#1e3a52]" : "text-[#111111]"}`}>{format(day, "d")}</div>
                  <div className="text-xs text-gray-400">{format(day, "MMM", { locale: uk })}</div>
                </div>

                {/* Lessons */}
                <AnimatePresence>
                  {dayLessons.map(lesson => {
                    const att = myAttendance(lesson)
                    const info = att ? attendanceInfo(att.status) : null
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelected(lesson === selected ? null : lesson)}
                        className="bg-white border border-[#D5EAFB] rounded-xl p-3 hover:shadow-md hover:border-[#BED9F4] transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-[#111111] leading-tight mb-1 line-clamp-2">{lesson.title}</p>

                        {lesson.theme && (
                          <p className="text-[10px] text-[#3A7AA8] bg-[#EBF5FD] px-1.5 py-0.5 rounded mb-1.5 line-clamp-1">{lesson.theme}</p>
                        )}

                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {lesson.startTime} – {lesson.endTime}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="w-2.5 h-2.5" />
                          <span className="line-clamp-1">{lesson.group.name}</span>
                        </div>

                        {info && (
                          <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${info.cls}`}>
                            <UserCheck className="w-2.5 h-2.5" />
                            {info.label}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {dayLessons.length === 0 && (
                  <div className="flex-1 border border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-[10px] text-gray-300">Немає уроків</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lesson detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-xl border border-[#D5EAFB] p-5 z-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#111111] text-sm">{selected.title}</h3>
                {selected.theme && <p className="text-xs text-[#3A7AA8] mt-0.5">{selected.theme}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 ml-2 text-lg leading-none">×</button>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{format(new Date(selected.date.slice(0, 10) + "T12:00:00"), "d MMMM yyyy", { locale: uk })}, {selected.startTime} – {selected.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>{selected.group.name}</span>
              </div>
              {selected.description && (
                <p className="text-gray-500 pt-1 whitespace-pre-wrap">{selected.description}</p>
              )}
              {selected.assignment && (
                <div className="flex items-center gap-2 pt-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`/student/assignments/${selected.assignment.id}`} className="text-[#3A7AA8] hover:underline">
                    {selected.assignment.title}
                  </a>
                </div>
              )}
              {selected.meetLink && (
                <a
                  href={selected.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 pt-1 text-[#3A7AA8] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Приєднатися до уроку
                </a>
              )}
            </div>

            {(() => {
              const att = myAttendance(selected)
              if (!att) return null
              const info = attendanceInfo(att.status)
              return (
                <div className="mt-3 space-y-1.5">
                  <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${info.cls}`}>
                    <UserCheck className="w-3 h-3" />
                    {info.label}
                  </div>
                  {att.note && (
                    <p className="text-xs text-gray-500 italic bg-[#FAFBFD] rounded-lg px-2 py-1.5 border border-gray-100">
                      💬 {att.note}
                    </p>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
