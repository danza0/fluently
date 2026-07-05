"use client"

import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { UserCheck, Clock, XCircle, Star, CalendarDays, BookOpen } from "lucide-react"

export interface ReportData {
  student: { id: string; name: string; nickname: string; avatar?: string | null }
  month: string
  attendance: {
    present: number
    late: number
    absent: number
    recorded: number
    totalLessons: number
    records: {
      id: string
      status: "PRESENT" | "LATE" | "ABSENT"
      note?: string | null
      lesson: { id: string; title: string; date: string; startTime: string; group: { name: string } }
    }[]
  }
  grades: {
    avg: number | null
    items: {
      id: string
      score: number
      feedback?: string | null
      gradedAt: string
      isLate: boolean
      assignment: { id: string; title: string; maxGrade: number }
    }[]
  }
}

const statusMeta = {
  PRESENT: { label: "Присутній", cls: "bg-[#E0FFC2] text-green-800", Icon: UserCheck },
  LATE: { label: "Запізнився", cls: "bg-yellow-100 text-yellow-800", Icon: Clock },
  ABSENT: { label: "Відсутній", cls: "bg-red-100 text-red-700", Icon: XCircle },
} as const

export function ReportCard({ data }: { data: ReportData }) {
  const { attendance, grades } = data
  const attended = attendance.present + attendance.late
  const attendanceRate = attendance.recorded > 0
    ? Math.round((attended / attendance.recorded) * 100)
    : null

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <CalendarDays className="w-3.5 h-3.5" /> Уроків за місяць
          </div>
          <div className="text-2xl font-bold text-[#111111]">{attendance.totalLessons}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <UserCheck className="w-3.5 h-3.5" /> Відвідуваність
          </div>
          <div className="text-2xl font-bold text-[#111111]">
            {attendanceRate !== null ? `${attendanceRate}%` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {attendance.present} присутн. · {attendance.late} запізн. · {attendance.absent} відсутн.
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Star className="w-3.5 h-3.5" /> Середня оцінка
          </div>
          <div className="text-2xl font-bold text-[#111111]">{grades.avg ?? "—"}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <BookOpen className="w-3.5 h-3.5" /> Оцінених робіт
          </div>
          <div className="text-2xl font-bold text-[#111111]">{grades.items.length}</div>
        </div>
      </div>

      {/* Attendance detail */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-[#111111] mb-3">Відвідуваність</h3>
        {attendance.records.length === 0 ? (
          <p className="text-sm text-gray-400">Немає записів відвідуваності за цей місяць</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {attendance.records.map((r) => {
              const meta = statusMeta[r.status]
              return (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#111111] truncate">{r.lesson.title}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(r.lesson.date.slice(0, 10) + "T12:00:00"), "d MMMM", { locale: uk })}, {r.lesson.startTime} · {r.lesson.group.name}
                      {r.note && <span className="ml-1 italic">— {r.note}</span>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 ${meta.cls}`}>
                    <meta.Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Grades detail */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-[#111111] mb-3">Оцінки</h3>
        {grades.items.length === 0 ? (
          <p className="text-sm text-gray-400">Немає оцінок за цей місяць</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {grades.items.map((g) => (
              <div key={g.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#111111] truncate">{g.assignment.title}</div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(g.gradedAt), "d MMMM", { locale: uk })}
                    {g.isLate && <span className="text-orange-500 ml-1">· здано із запізненням</span>}
                    {g.feedback && <span className="ml-1 italic">— {g.feedback}</span>}
                  </div>
                </div>
                <span className="text-lg font-bold text-[var(--accent-900)] flex-shrink-0">
                  {g.score}<span className="text-xs text-gray-400 font-normal"> / {g.assignment.maxGrade}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
