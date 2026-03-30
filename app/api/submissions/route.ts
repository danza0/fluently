import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const where = user.role === "TEACHER"
    ? { assignment: { teacherId: user.id } }
    : { studentId: user.id }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      assignment: true,
      student: { select: { id: true, name: true, nickname: true } },
      grade: true,
      attachments: true,
    },
    orderBy: { submittedAt: "desc" },
  })
  return NextResponse.json(submissions)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { assignmentId, textContent, attachments } = body

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 })

  const isLate = new Date() > assignment.dueDate

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
  })

  try {
    if (existing) {
      await prisma.submissionAttachment.deleteMany({ where: { submissionId: existing.id } })
      const submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          textContent: textContent || null,
          isLate,
          status: "SUBMITTED",
          attachments: attachments?.length ? {
            create: attachments.map((a: any) => ({
              fileUrl: a.url,
              fileName: a.fileName,
              fileType: a.fileType,
            })),
          } : undefined,
        },
        include: { attachments: true },
      })
      return NextResponse.json(submission)
    } else {
      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: user.id,
          textContent: textContent || null,
          isLate,
          status: "SUBMITTED",
          attachments: attachments?.length ? {
            create: attachments.map((a: any) => ({
              fileUrl: a.url,
              fileName: a.fileName,
              fileType: a.fileType,
            })),
          } : undefined,
        },
        include: { attachments: true },
      })
      return NextResponse.json(submission, { status: 201 })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}

