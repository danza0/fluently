import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id: lessonId } = await params

  const body = await request.json()

  if (!Array.isArray(body.attendance)) {
    return NextResponse.json({ error: "attendance must be an array" }, { status: 400 })
  }

  const results = await Promise.all(
    body.attendance.map(async (record: { studentId: string; status: "PRESENT" | "LATE" | "ABSENT"; note?: string }) => {
      const status = record.status ?? "PRESENT"
      return prisma.attendanceRecord.upsert({
        where: { lessonId_studentId: { lessonId, studentId: record.studentId } },
        create: { lessonId, studentId: record.studentId, status, note: record.note },
        update: { status, note: record.note },
      })
    })
  )

  return NextResponse.json(results)
}
