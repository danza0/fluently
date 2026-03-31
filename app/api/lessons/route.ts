import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const where = user.role === "TEACHER"
    ? { teacherId: user.id }
    : { group: { memberships: { some: { userId: user.id } } } }

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      group: true,
      teacher: { select: { id: true, name: true, nickname: true } },
      assignment: { select: { id: true, title: true } },
      attendances: {
        include: { student: { select: { id: true, name: true, nickname: true } } },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  })
  return NextResponse.json(lessons)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await request.json()
    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.groupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const parsedDate = new Date(body.date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        theme: body.theme || null,
        description: body.description || null,
        date: parsedDate,
        startTime: body.startTime,
        endTime: body.endTime,
        meetLink: body.meetLink || null,
        coverImage: body.coverImage || null,
        groupId: body.groupId,
        teacherId: user.id,
        assignmentId: body.assignmentId || null,
      },
      include: {
        group: true,
        teacher: { select: { id: true, name: true } },
        assignment: { select: { id: true, title: true } },
      },
    })
    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
