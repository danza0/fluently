import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      assignmentGroups: { include: { group: true } },
      assignmentStudents: { include: { student: true } },
      submissions: {
        include: {
          student: true,
          grade: true,
          attachments: true,
        },
      },
      attachments: true,
    },
  })

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(assignment)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const body = await request.json()
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

  await prisma.assignment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
