"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_FILE_ACCEPT } from "@/lib/upload-config"

interface UploadedFile {
  url: string
  fileName: string
  fileType: string
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxGrade: 12,
    submissionType: "MIXED",
    groupIds: [] as string[],
  })

  useEffect(() => {
    fetch("/api/groups").then(r => r.json()).then(setGroups)
  }, [])

  const toggleGroup = (id: string) => {
    setForm(f => ({
      ...f,
      groupIds: f.groupIds.includes(id) ? f.groupIds.filter(g => g !== id) : [...f.groupIds, id],
    }))
  }

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter(f => {
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name}: файл занадто великий`); return false }
      if (!ALLOWED_MIME_TYPES.includes(f.type)) { toast.error(`${f.name}: непідтримуваний тип файлу`); return false }
      return true
    })
    setFiles(prev => [...prev, ...valid])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.dueDate) { toast.error("Заповніть обов'язкові поля"); return }
    setIsLoading(true)
    try {
      const attachments: UploadedFile[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (res.ok) {
          const data = await res.json()
          attachments.push(data)
        } else {
          toast.error(`Помилка завантаження ${file.name}`)
        }
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, maxGrade: Number(form.maxGrade), attachments }),
      })
      if (!res.ok) { toast.error("Помилка створення завдання"); return }
      toast.success("Завдання створено!")
      router.push("/dashboard/assignments")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад до завдань
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Нове завдання</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Назва завдання *</Label>
            <Input id="title" placeholder="Введіть назву завдання" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Опис завдання</Label>
            <Textarea id="description" placeholder="Детальний опис завдання..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Дедлайн *</Label>
              <Input id="dueDate" type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGrade">Максимальна оцінка</Label>
              <Select value={String(form.maxGrade)} onChange={e => setForm(f => ({ ...f, maxGrade: Number(e.target.value) }))}>
                {[6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Тип здачі</Label>
            <Select value={form.submissionType} onChange={e => setForm(f => ({ ...f, submissionType: e.target.value }))}>
              <option value="TEXT">Текст</option>
              <option value="FILE">Файл</option>
              <option value="IMAGE">Зображення</option>
              <option value="MIXED">Будь-який</option>
            </Select>
          </div>
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Групи</Label>
              <div className="space-y-2">
                {groups.map((g: any) => (
                  <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="rounded" />
                    <span className="text-sm text-gray-700">{g.name}</span>
                    <span className="text-xs text-gray-400">({g.memberships?.length ?? 0} учнів)</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Прикріпити файли (необов&apos;язково)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_FILE_ACCEPT}
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-4 h-4 mr-2" />
              Додати файл
            </Button>
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-sky-light px-3 py-1.5 rounded-lg text-sm">
                    {file.type.startsWith("image/") ? <ImageIcon className="w-4 h-4 text-sky-darker" /> : <FileText className="w-4 h-4 text-sky-darker" />}
                    <span className="flex-1 text-gray-700 truncate">{file.name}</span>
                    <span className="text-gray-400 text-xs">{(file.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-sky-custom hover:bg-sky-dark text-sky-darker">
              {isLoading ? "Створення..." : "Створити завдання"}
            </Button>
            <Link href="/dashboard/assignments">
              <Button variant="outline" type="button">Скасувати</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

