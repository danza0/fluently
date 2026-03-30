import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, BookOpen } from "lucide-react"
import { AssignmentCard } from "@/components/assignments/assignment-card"

export default async function StudentGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = session!.user as any
  const { id } = await params

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: true } },
      assignmentGroups: {
        include: {
          assignment: {
            include: {
              assignmentGroups: { include: { group: true } },
              submissions: {
                where: { studentId: user.id },
                include: { grade: true },
              },
            },
          },
        },
      },
    },
  })

  if (!group) redirect("/student/groups")

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/student/groups" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад до груп
      </Link>
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{group.name}</h1>
        {group.description && <p className="text-gray-500">{group.description}</p>}
        <div className="flex gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{group.memberships.length} учнів</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{group.assignmentGroups.length} завдань</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Завдання групи</h2>
      {group.assignmentGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Немає завдань</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {group.assignmentGroups.map(ag => (
            <AssignmentCard key={ag.id} assignment={ag.assignment as any} role="STUDENT" />
          ))}
        </div>
      )}
    </div>
  )
}
