import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AssignmentCard } from "@/components/assignments/assignment-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Clock, Star } from "lucide-react"

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  })
  const groupIds = memberships.map(m => m.groupId)

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { assignmentGroups: { some: { groupId: { in: groupIds } } } },
        { assignmentStudents: { some: { studentId: user.id } } },
      ],
    },
    include: {
      assignmentGroups: { include: { group: true } },
      submissions: {
        where: { studentId: user.id },
        include: { grade: true },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  const now = new Date()
  const pending = assignments.filter(a => new Date(a.dueDate) >= now && !a.submissions[0])
  const submitted = assignments.filter(a => a.submissions[0])
  const graded = assignments.filter(a => a.submissions[0]?.status === "GRADED")
  const grades = graded.map(a => a.submissions[0]?.grade?.score).filter(Boolean) as number[]
  const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "—"

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Вітаємо, {session!.user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Ваш навчальний кабінет</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Активні завдання" value={pending.length} icon={Clock} iconColor="text-orange-600" iconBg="bg-orange-100" />
        <StatsCard title="Здано" value={submitted.length} icon={CheckCircle} iconColor="text-blue-600" iconBg="bg-blue-100" />
        <StatsCard title="Оцінено" value={graded.length} icon={BookOpen} iconColor="text-green-600" iconBg="bg-green-100" />
        <StatsCard title="Середній бал" value={avgGrade} icon={Star} iconColor="text-yellow-600" iconBg="bg-yellow-100" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Активні завдання</h2>
        <Link href="/student/groups"><Button variant="outline" size="sm">Мої групи</Button></Link>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">Всі завдання виконано! 🎉</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map(a => <AssignmentCard key={a.id} assignment={a as any} role="STUDENT" />)}
        </div>
      )}

      {submitted.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Здані роботи</h2>
          <div className="grid gap-4">
            {submitted.map(a => <AssignmentCard key={a.id} assignment={a as any} role="STUDENT" />)}
          </div>
        </>
      )}
    </div>
  )
}
