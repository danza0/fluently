import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
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

    const blob = await put(`uploads/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileType: file.type,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Помилка завантаження" }, { status: 500 })
  }
}
