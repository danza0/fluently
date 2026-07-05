import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [totalStudents, totalGroups, totalAssignments, submissions, grades] = await Promise.all([
    prisma.user.count({
      where: { role: "STUDENT", groupMemberships: { some: { group: { teacherId: user.id } } } },
    }),
    prisma.group.count({ where: { teacherId: user.id } }),
    prisma.assignment.count({ where: { teacherId: user.id } }),
    prisma.submission.findMany({
      where: { assignment: { teacherId: user.id } },
      include: { grade: true },
    }),
    prisma.grade.findMany({
      where: { submission: { assignment: { teacherId: user.id } } },
    }),
  ])

  const avgGrade = grades.length > 0 ? grades.reduce((s, g) => s + g.score, 0) / grades.length : 0
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length
  const submittedCount = submissions.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED").length

  return NextResponse.json({
    totalStudents,
    totalGroups,
    totalAssignments,
    totalSubmissions: submissions.length,
    gradedCount,
    submittedCount,
    avgGrade: Math.round(avgGrade * 10) / 10,
  })
}
