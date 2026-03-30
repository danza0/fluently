import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(),
  maxGrade: z.number().min(1).max(12).default(12),
  submissionType: z.enum(["TEXT", "IMAGE", "FILE", "MIXED"]).default("MIXED"),
  groupIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
  attachments: z.array(z.object({ url: z.string(), fileName: z.string(), fileType: z.string() })).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role === "TEACHER") {
    const assignments = await prisma.assignment.findMany({
      where: { teacherId: user.id },
      include: {
        assignmentGroups: { include: { group: true } },
        assignmentStudents: { include: { student: true } },
        submissions: { include: { grade: true, student: true } },
        attachments: true,
      },
      orderBy: { dueDate: "asc" },
    })
    return NextResponse.json(assignments)
  } else {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    })
    const groupIds = memberships.map((m) => m.groupId)

    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { assignmentGroups: { some: { groupId: { in: groupIds } } } },
          { assignmentStudents: { some: { studentId: user.id } } },
        ],
      },
      include: {
        assignmentGroups: { include: { group: true } },
        submissions: {
          where: { studentId: user.id },
          include: { grade: true, attachments: true },
        },
        attachments: true,
      },
      orderBy: { dueDate: "asc" },
    })
    return NextResponse.json(assignments)
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await request.json()
    const data = createAssignmentSchema.parse(body)

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxGrade: data.maxGrade,
        submissionType: data.submissionType,
        teacherId: user.id,
        assignmentGroups: data.groupIds?.length ? {
          create: data.groupIds.map((groupId) => ({ groupId })),
        } : undefined,
        assignmentStudents: data.studentIds?.length ? {
          create: data.studentIds.map((studentId) => ({ studentId })),
        } : undefined,
        attachments: data.attachments?.length ? {
          create: data.attachments.map(a => ({
            fileUrl: a.url,
            fileName: a.fileName,
            fileType: a.fileType,
          })),
        } : undefined,
      },
      include: {
        assignmentGroups: { include: { group: true } },
        assignmentStudents: { include: { student: true } },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
