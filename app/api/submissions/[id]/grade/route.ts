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

  const { score, feedback } = await request.json()

  if (score < 0 || score > 12) {
    return NextResponse.json({ error: "Score must be between 0 and 12" }, { status: 400 })
  }

  const existing = await prisma.grade.findUnique({ where: { submissionId: id } })

  let grade
  if (existing) {
    grade = await prisma.grade.update({
      where: { submissionId: id },
      data: { score, feedback, teacherId: user.id },
    })
  } else {
    grade = await prisma.grade.create({
      data: { submissionId: id, score, feedback, teacherId: user.id },
    })
  }

  await prisma.submission.update({
    where: { id },
    data: { status: "GRADED" },
  })

  return NextResponse.json(grade)
}
