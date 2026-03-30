import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { User, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function StudentsPage() {
  const session = await getServerSession(authOptions)

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      groupMemberships: { include: { group: true } },
      submissions: { include: { grade: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Учні</h1>
        <p className="text-gray-500 mt-1">Всі зареєстровані учні платформи</p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Немає зареєстрованих учнів</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {students.map((student) => {
              const grades = student.submissions.filter(s => s.grade).map(s => s.grade!.score)
              const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : null
              return (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-mid rounded-full flex items-center justify-center">
                      <span className="text-sky-darker font-semibold text-sm">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-400">@{student.nickname} · {student.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {student.submissions.length} робіт
                      </div>
                      {avgGrade && <div className="text-sm font-semibold text-green-600">Сер: {avgGrade}</div>}
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {student.groupMemberships.slice(0, 2).map(m => (
                        <span key={m.id} className="text-xs bg-sky-light text-sky-darker px-2 py-0.5 rounded-full">{m.group.name}</span>
                      ))}
                      {student.groupMemberships.length > 2 && (
                        <span className="text-xs text-gray-400">+{student.groupMemberships.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
