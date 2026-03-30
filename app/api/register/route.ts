import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  nickname: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingEmail) {
      return NextResponse.json({ error: "Ця електронна адреса вже використовується" }, { status: 400 })
    }

    const existingNickname = await prisma.user.findUnique({ where: { nickname: data.nickname } })
    if (existingNickname) {
      return NextResponse.json({ error: "Цей псевдонім вже зайнятий" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        nickname: data.nickname,
        role: "STUDENT",
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Невірні дані" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
