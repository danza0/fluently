import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { User, Mail, Hash, BookOpen, Star, CheckCircle } from "lucide-react"

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const studentData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      groupMemberships: { include: { group: true } },
      submissions: { include: { grade: true, assignment: true } },
    },
  })

  if (!studentData) return null

  const grades = studentData.submissions.filter(s => s.grade).map(s => s.grade!.score)
  const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "—"

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Профіль</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-2xl">{studentData.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{studentData.name}</h2>
            <p className="text-gray-500">Учень</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{studentData.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">@{studentData.nickname}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">На платформі з {new Date(studentData.createdAt).toLocaleDateString("uk-UA")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{studentData.groupMemberships.length}</div>
          <div className="text-sm text-gray-500 mt-1">Груп</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{studentData.submissions.length}</div>
          <div className="text-sm text-gray-500 mt-1">Здано</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{avgGrade}</div>
          <div className="text-sm text-gray-500 mt-1">Середній бал</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Мої групи</h3>
        {studentData.groupMemberships.length === 0 ? (
          <p className="text-gray-400 text-sm">Ви не в жодній групі</p>
        ) : (
          <div className="space-y-2">
            {studentData.groupMemberships.map(m => (
              <div key={m.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-gray-900">{m.group.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
