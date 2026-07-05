import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const existing = await prisma.group.findUnique({ where: { id }, select: { teacherId: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.teacherId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const newCode = nanoid(8).toUpperCase()
  const group = await prisma.group.update({
    where: { id },
    data: { joinCode: newCode },
  })
  return NextResponse.json({ joinCode: group.joinCode })
}
