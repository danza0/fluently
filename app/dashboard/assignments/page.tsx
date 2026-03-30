import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import { AssignmentsClientList } from "./client-list"

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: user.id },
    include: {
      assignmentGroups: { include: { group: true } },
      assignmentStudents: { include: { student: true } },
      submissions: { include: { grade: true, student: true } },
    },
    orderBy: { dueDate: "asc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Завдання</h1>
          <p className="text-gray-500 mt-1">Всі ваші завдання для учнів</p>
        </div>
        <Link href="/dashboard/assignments/new">
          <Button className="bg-sky-custom hover:bg-sky-dark gap-2">
            <Plus className="w-4 h-4" />
            Нове завдання
          </Button>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає завдань</h3>
          <p className="text-gray-500 mb-6">Створіть перше завдання для учнів</p>
          <Link href="/dashboard/assignments/new">
            <Button className="bg-sky-custom hover:bg-sky-dark">Створити завдання</Button>
          </Link>
        </div>
      ) : (
        <AssignmentsClientList assignments={assignments as any} />
      )}
    </div>
  )
}

