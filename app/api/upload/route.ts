import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { nanoid } from "nanoid"
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/upload-config"

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

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Непідтримуваний тип файлу" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    }
    const safeExt = MIME_TO_EXT[file.type] ?? "bin"
    const fileName = `${nanoid()}.${safeExt}`
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
