import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import StudentProfileClient from "./client"

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
    <StudentProfileClient
      studentData={{
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        nickname: studentData.nickname,
        avatar: studentData.avatar,
        timezone: studentData.timezone,
        createdAt: studentData.createdAt.toISOString(),
        groupsCount: studentData.groupMemberships.length,
        submissionsCount: studentData.submissions.length,
        avgGrade,
        groups: studentData.groupMemberships.map(m => ({
          id: m.id,
          groupName: m.group.name,
        })),
      }}
    />
  )
}
