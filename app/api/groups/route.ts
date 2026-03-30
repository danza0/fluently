import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any

  if (user.role === "TEACHER") {
    const groups = await prisma.group.findMany({
      where: { teacherId: user.id },
      include: {
        memberships: { include: { user: true } },
        assignmentGroups: { include: { assignment: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(groups)
  } else {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            memberships: { include: { user: true } },
            assignmentGroups: { include: { assignment: true } },
          },
        },
      },
    })
    return NextResponse.json(memberships.map((m) => m.group))
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await request.json()
    const data = createGroupSchema.parse(body)

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        joinCode: nanoid(8).toUpperCase(),
        teacherId: user.id,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
