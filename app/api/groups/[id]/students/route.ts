import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const { nickname } = await request.json()
  const student = await prisma.user.findUnique({ where: { nickname } })
  if (!student) return NextResponse.json({ error: "Учня з таким псевдонімом не знайдено" }, { status: 404 })

  const existing = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: student.id, groupId: id } },
  })
  if (existing) return NextResponse.json({ error: "Цей учень вже є у групі" }, { status: 400 })

  await prisma.groupMembership.create({ data: { userId: student.id, groupId: id } })
  return NextResponse.json({ success: true, student })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const { studentId } = await request.json()
  await prisma.groupMembership.delete({
    where: { userId_groupId: { userId: studentId, groupId: id } },
  })
  return NextResponse.json({ success: true })
}
