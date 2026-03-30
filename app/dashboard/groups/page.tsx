import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GroupCard } from "@/components/groups/group-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  const user = session!.user as any

  const groups = await prisma.group.findMany({
    where: { teacherId: user.id },
    include: {
      memberships: true,
      assignmentGroups: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Групи</h1>
          <p className="text-gray-500 mt-1">Управляйте вашими навчальними групами</p>
        </div>
        <Link href="/dashboard/groups/new">
          <Button className="bg-milk hover:bg-milk-dark gap-2">
            <Plus className="w-4 h-4" />
            Нова група
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає груп</h3>
          <p className="text-gray-500 mb-6">Створіть першу групу, щоб почати роботу</p>
          <Link href="/dashboard/groups/new">
            <Button className="bg-milk hover:bg-milk-dark">Створити групу</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group as any} role="TEACHER" />
          ))}
        </div>
      )}
    </div>
  )
}
