import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { joinCode } = await request.json()

  const group = await prisma.group.findUnique({ where: { joinCode: joinCode.trim().toUpperCase() } })
  if (!group) return NextResponse.json({ error: "Групу не знайдено. Перевірте код." }, { status: 404 })

  const existing = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  })
  if (existing) return NextResponse.json({ error: "Ви вже є членом цієї групи" }, { status: 400 })

  await prisma.groupMembership.create({ data: { userId: user.id, groupId: group.id } })
  return NextResponse.json({ success: true, group })
}
