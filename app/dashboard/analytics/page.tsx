import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Users, BookOpen, CheckSquare, Star, TrendingUp, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const [totalStudents, totalGroups, totalAssignments, submissions, grades] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.group.count({ where: { teacherId: user.id } }),
    prisma.assignment.count({ where: { teacherId: user.id } }),
    prisma.submission.findMany({ include: { grade: true } }),
    prisma.grade.findMany({ where: { teacherId: user.id } }),
  ])

  const avgGrade = grades.length > 0 ? grades.reduce((s, g) => s + g.score, 0) / grades.length : 0
  const gradedCount = submissions.filter(s => s.status === "GRADED").length
  const submittedCount = submissions.length
  const lateCount = submissions.filter(s => s.isLate).length

  const gradeDistribution = [1,2,3,4,5,6,7,8,9,10,11,12].map(score => ({
    score,
    count: grades.filter(g => g.score === score).length,
  }))
  const maxCount = Math.max(...gradeDistribution.map(g => g.count), 1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Аналітика</h1>
        <p className="text-gray-500 mt-1">Статистика вашої роботи</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Учні" value={totalStudents} icon={Users} />
        <StatsCard title="Групи" value={totalGroups} icon={BookOpen} iconColor="text-purple-600" iconBg="bg-purple-100" />
        <StatsCard title="Завдання" value={totalAssignments} icon={TrendingUp} iconColor="text-orange-600" iconBg="bg-orange-100" />
        <StatsCard title="Середня оцінка" value={`${avgGrade.toFixed(1)}/12`} icon={Star} iconColor="text-yellow-600" iconBg="bg-yellow-100" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Здача робіт</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Здано</span>
                <span className="font-medium">{submittedCount}</span>
              </div>
              <Progress value={submittedCount > 0 ? 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Оцінено</span>
                <span className="font-medium">{gradedCount}</span>
              </div>
              <Progress value={submittedCount > 0 ? (gradedCount / submittedCount) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Із запізненням</span>
                <span className="font-medium text-orange-600">{lateCount}</span>
              </div>
              <Progress value={submittedCount > 0 ? (lateCount / submittedCount) * 100 : 0} className="h-2 [&>div]:bg-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Розподіл оцінок</h2>
          <div className="flex items-end gap-1 h-32">
            {gradeDistribution.map(({ score, count }) => (
              <div key={score} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-400 rounded-t"
                  style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-gray-400">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
