import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { nanoid } from "nanoid"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл занадто великий (максимум 10MB)" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Непідтримуваний тип файлу" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop() || "bin"
    const fileName = `${nanoid()}.${ext}`
    const uploadsDir = join(process.cwd(), "public", "uploads")

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, fileName), buffer)

    return NextResponse.json({
      url: `/uploads/${fileName}`,
      fileName: file.name,
      fileType: file.type,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка завантаження" }, { status: 500 })
  }
}
