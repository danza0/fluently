import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      group: { include: { memberships: { include: { user: { select: { id: true, name: true, nickname: true } } } } } },
      teacher: { select: { id: true, name: true, nickname: true } },
      assignment: { select: { id: true, title: true } },
      attendances: { include: { student: { select: { id: true, name: true, nickname: true } } } },
    },
  })
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(lesson)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const body = await request.json()

  let parsedDate: Date | undefined
  if (body.date) {
    parsedDate = new Date(body.date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Невірна дата" }, { status: 400 })
    }
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      title: body.title,
      theme: body.theme || null,
      description: body.description || null,
      date: parsedDate,
      startTime: body.startTime,
      endTime: body.endTime,
      meetLink: body.meetLink || null,
      groupId: body.groupId,
      assignmentId: body.assignmentId || null,
    },
  })
  return NextResponse.json(lesson)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  await prisma.lesson.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
