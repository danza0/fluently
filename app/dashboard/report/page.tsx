"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { ReportCard, type ReportData } from "@/components/report/report-card"

interface StudentOption {
  id: string
  name: string
  nickname: string
  avatar?: string | null
}

export default function TeacherReportPage() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentId, setStudentId] = useState<string>("")
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const monthKey = format(monthDate, "yyyy-MM")

  useEffect(() => {
    fetch("/api/students")
      .then(r => r.ok ? r.json() : [])
      .then((list) => {
        setStudents(list)
        if (list.length > 0) setStudentId((prev) => prev || list[0].id)
      })
  }, [])

  const fetchReport = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/report?month=${monthKey}&studentId=${studentId}`)
      setData(res.ok ? await res.json() : null)
    } finally {
      setLoading(false)
    }
  }, [monthKey, studentId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const shiftMonth = (delta: number) =>
    setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#FFFDF8]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Табель</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {format(monthDate, "LLLL yyyy", { locale: uk })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2">
            <User className="w-4 h-4 text-gray-400" />
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="py-2 pr-2 text-sm bg-transparent outline-none max-w-[180px]"
            >
              {students.length === 0 && <option value="">Немає учнів</option>}
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (@{s.nickname})</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1)) }} className="text-xs px-3">
            Цей місяць
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!studentId ? (
        <div className="text-gray-400 py-16 text-center">Додайте учнів, щоб побачити табель</div>
      ) : loading ? (
        <div className="text-gray-400 py-16 text-center">Завантаження...</div>
      ) : data ? (
        <ReportCard data={data} />
      ) : (
        <div className="text-gray-400 py-16 text-center">
          Не вдалося завантажити табель. Учень має бути учасником однієї з ваших груп.
        </div>
      )}
    </div>
  )
}
