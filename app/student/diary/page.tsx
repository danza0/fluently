"use client"

import { useState, useEffect } from "react"
import { BookMarked, Clock, Users, Link as LinkIcon, UserCheck } from "lucide-react"
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
  teacher: { id: string; name: string; nickname: string }
  assignment?: { id: string; title: string } | null
  attendances: { student: { id: string }; present: boolean; note?: string | null }[]
}

export default function StudentDiaryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [lessonsRes, sessionRes] = await Promise.all([
        fetch("/api/lessons"),
        fetch("/api/auth/session"),
      ])
      const [lessonsData, sessionData] = await Promise.all([
        lessonsRes.json(),
        sessionRes.json(),
      ])
      setLessons(Array.isArray(lessonsData) ? lessonsData : [])
      setCurrentUserId(sessionData?.user?.id ?? null)
      setLoading(false)
    }
    fetchData()
  }, [])

  const todayLessons = lessons.filter(l => isToday(new Date(l.date)))
  const upcomingLessons = lessons.filter(l => isFuture(new Date(l.date)) && !isToday(new Date(l.date)))
  const pastLessons = lessons.filter(l => isPast(new Date(l.date)) && !isToday(new Date(l.date)))

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>

  const renderLesson = (lesson: Lesson) => {
    const myAttendance = currentUserId
      ? lesson.attendances.find(a => a.student.id === currentUserId)
      : null

    return (
      <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
              {lesson.theme && (
                <span className="text-xs text-sky-darker bg-sky-light px-2 py-0.5 rounded-full">{lesson.theme}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>{format(new Date(lesson.date), "d MMMM yyyy", { locale: uk })}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.startTime} – {lesson.endTime}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {lesson.group.name}
              </span>
            </div>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{lesson.description}</p>
            )}
            {lesson.meetLink && (
              <a
                href={lesson.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-sky-darker hover:underline mt-2"
              >
                <LinkIcon className="w-3 h-3" />
                Приєднатися до уроку
              </a>
            )}
            {lesson.assignment && (
              <div className="mt-2 text-xs text-gray-400">
                Завдання: {lesson.assignment.title}
              </div>
            )}
          </div>
          {myAttendance != null && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ml-4 ${
              myAttendance.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}>
              <UserCheck className="w-3 h-3" />
              {myAttendance.present ? "Присутній" : "Відсутній"}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Щоденник уроків</h1>
        <p className="text-gray-500 mt-1">Ваш розклад занять та відвідуваність</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookMarked className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає уроків</h3>
          <p className="text-gray-500">Ваш вчитель ще не додав уроки</p>
        </div>
      ) : (
        <div className="space-y-8">
          {todayLessons.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-custom rounded-full inline-block" />
                Сьогодні ({todayLessons.length})
              </h2>
              <div className="space-y-3">{todayLessons.map(renderLesson)}</div>
            </div>
          )}
          {upcomingLessons.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Майбутні ({upcomingLessons.length})</h2>
              <div className="space-y-3">{upcomingLessons.map(renderLesson)}</div>
            </div>
          )}
          {pastLessons.length > 0 && (
            <div className="opacity-70">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Минулі ({pastLessons.length})</h2>
              <div className="space-y-3">{pastLessons.map(renderLesson)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
