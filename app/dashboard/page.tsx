import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/dashboard/stats-card"
import { AssignmentCard } from "@/components/assignments/assignment-card"
import { Users, BookOpen, CheckSquare, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const [totalStudents, totalGroups, assignments, grades] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.group.count({ where: { teacherId: user.id } }),
    prisma.assignment.findMany({
      where: { teacherId: user.id },
      include: {
        assignmentGroups: { include: { group: true } },
        submissions: { include: { grade: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.grade.findMany({ where: { teacherId: user.id } }),
  ])

  const avgGrade = grades.length > 0 ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1) : "—"
  const pendingGrades = await prisma.submission.count({ where: { status: "SUBMITTED" } })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Вітаємо, {session!.user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Ось ваш огляд на сьогодні</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Учні" value={totalStudents} icon={Users} iconColor="text-sky-darker" iconBg="bg-sky-mid" />
        <StatsCard title="Групи" value={totalGroups} icon={BookOpen} iconColor="text-purple-600" iconBg="bg-purple-100" />
        <StatsCard title="Потребують перевірки" value={pendingGrades} icon={CheckSquare} iconColor="text-sky-darker" iconBg="bg-sky-light" />
        <StatsCard title="Середня оцінка" value={avgGrade} icon={Star} iconColor="text-green-600" iconBg="bg-green-100" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Найближчі завдання</h2>
        <Link href="/dashboard/assignments">
          <Button variant="outline" size="sm">Всі завдання</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Немає завдань. Створіть перше!</p>
            <Link href="/dashboard/assignments/new">
              <Button className="mt-4 bg-sky-custom hover:bg-sky-dark text-sky-darker">Створити завдання</Button>
            </Link>
          </div>
        ) : (
          assignments.map((a) => <AssignmentCard key={a.id} assignment={a as any} role="TEACHER" />)
        )}
      </div>
    </div>
  )
}
