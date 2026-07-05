"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { ReportCard, type ReportData } from "@/components/report/report-card"

export default function StudentReportPage() {
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const monthKey = format(monthDate, "yyyy-MM")

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/report?month=${monthKey}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => { fetchReport() }, [fetchReport])

  const shiftMonth = (delta: number) =>
    setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#FFFDF8]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Табель</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {format(monthDate, "LLLL yyyy", { locale: uk })}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {loading ? (
        <div className="text-gray-400 py-16 text-center">Завантаження...</div>
      ) : data ? (
        <ReportCard data={data} />
      ) : (
        <div className="text-gray-400 py-16 text-center">Не вдалося завантажити табель</div>
      )}
    </div>
  )
}
