import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["PRESENT", "LATE", "ABSENT"] as const

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id: lessonId } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { teacherId: true, groupId: true },
  })
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (lesson.teacherId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()

  if (!Array.isArray(body.attendance)) {
    return NextResponse.json({ error: "attendance must be an array" }, { status: 400 })
  }

  for (const record of body.attendance) {
    if (!record || typeof record.studentId !== "string") {
      return NextResponse.json({ error: "Invalid studentId" }, { status: 400 })
    }
    if (record.status !== undefined && !VALID_STATUSES.includes(record.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
  }

  try {
    const results = await Promise.all(
      body.attendance.map(async (record: { studentId: string; status?: "PRESENT" | "LATE" | "ABSENT"; note?: string }) => {
        const status = record.status ?? "PRESENT"
        return prisma.attendanceRecord.upsert({
          where: { lessonId_studentId: { lessonId, studentId: record.studentId } },
          create: { lessonId, studentId: record.studentId, status, note: record.note },
          update: { status, note: record.note },
        })
      })
    )
    return NextResponse.json(results)
  } catch (err) {
    console.error("POST /api/lessons/[id]/attendance error:", err)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
