import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"
import { Calendar } from "lucide-react"

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)

  const assignments = await prisma.assignment.findMany({
    where: {
      teacherId: user.id,
      dueDate: { gte: start, lte: end },
    },
    orderBy: { dueDate: "asc" },
  })

  const days = eachDayOfInterval({ start, end })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Календар
        </h1>
        <p className="text-gray-500 mt-1">{format(now, "LLLL yyyy", { locale: uk })}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (days[0].getDay() || 7) - 1 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const dayAssignments = assignments.filter(a => isSameDay(new Date(a.dueDate), day))
            return (
              <div key={day.toISOString()} className={`min-h-[80px] p-1.5 rounded-lg border ${isToday(day) ? "bg-blue-50 border-blue-200" : "border-transparent hover:bg-gray-50"}`}>
                <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-blue-600" : "text-gray-700"}`}>
                  {format(day, "d")}
                </div>
                {dayAssignments.map(a => (
                  <div key={a.id} className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 mb-1 truncate">
                    {a.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Дедлайни цього місяця</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-400">Немає завдань цього місяця</p>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center gap-4 py-2">
                <div className="text-center min-w-[48px]">
                  <div className="text-2xl font-bold text-blue-600">{format(new Date(a.dueDate), "d")}</div>
                  <div className="text-xs text-gray-400">{format(new Date(a.dueDate), "EEE", { locale: uk })}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{a.title}</div>
                  <div className="text-xs text-gray-400">{format(new Date(a.dueDate), "HH:mm")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
