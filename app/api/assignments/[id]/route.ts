import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publicUserSelect } from "@/lib/public-user"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const isTeacher = user.role === "TEACHER"

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      assignmentGroups: { include: { group: true } },
      assignmentStudents: { include: { student: { select: publicUserSelect } } },
      // Students only see their own submission; the teacher sees all
      submissions: {
        where: isTeacher ? undefined : { studentId: user.id },
        include: {
          student: { select: publicUserSelect },
          grade: true,
          attachments: true,
        },
      },
      attachments: true,
    },
  })

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (isTeacher) {
    if (assignment.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } else {
    const directlyAssigned = assignment.assignmentStudents.some((as) => as.studentId === user.id)
    let allowed = directlyAssigned
    if (!allowed && assignment.assignmentGroups.length > 0) {
      const membership = await prisma.groupMembership.findFirst({
        where: {
          userId: user.id,
          groupId: { in: assignment.assignmentGroups.map((ag) => ag.groupId) },
        },
      })
      allowed = !!membership
    }
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(assignment)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const existing = await prisma.assignment.findUnique({ where: { id }, select: { teacherId: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.teacherId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()

  if (body.dueDate && isNaN(new Date(body.dueDate).getTime())) {
    return NextResponse.json({ error: "Невірна дата" }, { status: 400 })
  }
  if (body.maxGrade !== undefined && (!Number.isInteger(body.maxGrade) || body.maxGrade < 1 || body.maxGrade > 12)) {
    return NextResponse.json({ error: "Невірна максимальна оцінка" }, { status: 400 })
  }

  const assignment = await prisma.assignment.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      maxGrade: body.maxGrade,
    },
  })
  return NextResponse.json(assignment)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const existing = await prisma.assignment.findUnique({ where: { id }, select: { teacherId: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.teacherId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.assignment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
