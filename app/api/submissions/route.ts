import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { assignmentId, textContent } = await request.json()

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 })

  const isLate = new Date() > assignment.dueDate

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
  })

  if (existing) {
    const updated = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        textContent,
        isLate,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
    return NextResponse.json(updated)
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId: user.id,
      textContent,
      isLate,
      status: "SUBMITTED",
    },
  })

  return NextResponse.json(submission, { status: 201 })
}
