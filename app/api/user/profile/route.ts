import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const body = await request.json()
  const { name, nickname, avatar, timezone } = body

  if (name !== undefined && typeof name === "string" && name.trim().length < 2) {
    return NextResponse.json({ error: "Ім'я повинно містити щонайменше 2 символи" }, { status: 400 })
  }

  if (nickname !== undefined) {
    if (typeof nickname !== "string" || !/^[a-zA-Z0-9_]{2,30}$/.test(nickname)) {
      return NextResponse.json({ error: "Нікнейм має містити тільки латинські літери, цифри та _" }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { nickname } })
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Цей нікнейм вже зайнятий" }, { status: 409 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(nickname !== undefined && { nickname }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(timezone !== undefined && { timezone }),
    },
    select: { id: true, name: true, nickname: true, avatar: true, timezone: true, email: true },
  })

  return NextResponse.json(updated)
}
