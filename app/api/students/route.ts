import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      groupMemberships: { include: { group: true } },
      submissions: { include: { grade: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(students)
}
