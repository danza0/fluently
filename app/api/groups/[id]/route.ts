import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: true } },
      assignmentGroups: {
        include: {
          assignment: {
            include: {
              submissions: { include: { grade: true } },
              attachments: true,
            },
          },
        },
      },
    },
  })

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(group)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const body = await request.json()
  const group = await prisma.group.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      ...("logo" in body && { logo: body.logo }),
      ...("coverImage" in body && { coverImage: body.coverImage }),
    },
  })
  return NextResponse.json(group)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  await prisma.group.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
