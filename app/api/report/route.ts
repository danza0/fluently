import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publicUserSelect } from "@/lib/public-user"

// Monthly report card (табель): attendance + grades for one student.
// Students can only ever see their own; teachers only their own students.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get("month") // YYYY-MM

  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() // 0-based
  if (monthParam) {
    const m = /^(\d{4})-(\d{2})$/.exec(monthParam)
    if (!m) return NextResponse.json({ error: "Невірний місяць" }, { status: 400 })
    year = Number(m[1])
    month = Number(m[2]) - 1
    if (month < 0 || month > 11) return NextResponse.json({ error: "Невірний місяць" }, { status: 400 })
  }
  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month + 1, 1))

  let studentId: string
  if (user.role === "STUDENT") {
    studentId = user.id
  } else {
    const requested = searchParams.get("studentId")
    if (!requested) return NextResponse.json({ error: "studentId обов'язковий" }, { status: 400 })
    // The student must be in one of this teacher's groups
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: requested, group: { teacherId: user.id } },
    })
    if (!membership) return NextResponse.json({ error: "Учня не знайдено" }, { status: 404 })
    studentId = requested
  }

  const lessonScope = user.role === "TEACHER" ? { teacherId: user.id } : {}

  const [student, attendanceRecords, totalLessons, grades] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId }, select: publicUserSelect }),
    prisma.attendanceRecord.findMany({
      where: {
        studentId,
        lesson: { date: { gte: monthStart, lt: monthEnd }, ...lessonScope },
      },
      include: {
        lesson: { select: { id: true, title: true, date: true, startTime: true, group: { select: { name: true } } } },
      },
      orderBy: { lesson: { date: "asc" } },
    }),
    prisma.lesson.count({
      where: {
        date: { gte: monthStart, lt: monthEnd },
        group: { memberships: { some: { userId: studentId } } },
        ...lessonScope,
      },
    }),
    prisma.grade.findMany({
      where: {
        submission: { studentId },
        gradedAt: { gte: monthStart, lt: monthEnd },
        ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
      },
      include: {
        submission: {
          select: {
            isLate: true,
            submittedAt: true,
            assignment: { select: { id: true, title: true, maxGrade: true } },
          },
        },
      },
      orderBy: { gradedAt: "asc" },
    }),
  ])

  if (!student) return NextResponse.json({ error: "Учня не знайдено" }, { status: 404 })

  const present = attendanceRecords.filter((r) => r.status === "PRESENT").length
  const late = attendanceRecords.filter((r) => r.status === "LATE").length
  const absent = attendanceRecords.filter((r) => r.status === "ABSENT").length
  const avgGrade = grades.length > 0
    ? Math.round((grades.reduce((s, g) => s + g.score, 0) / grades.length) * 10) / 10
    : null

  return NextResponse.json({
    student,
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    attendance: {
      present,
      late,
      absent,
      recorded: attendanceRecords.length,
      totalLessons,
      records: attendanceRecords.map((r) => ({
        id: r.id,
        status: r.status,
        note: r.note,
        lesson: r.lesson,
      })),
    },
    grades: {
      avg: avgGrade,
      items: grades.map((g) => ({
        id: g.id,
        score: g.score,
        feedback: g.feedback,
        gradedAt: g.gradedAt,
        isLate: g.submission.isLate,
        assignment: g.submission.assignment,
      })),
    },
  })
}
