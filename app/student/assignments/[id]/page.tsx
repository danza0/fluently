"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { StatusBadge } from "@/components/assignments/status-badge"
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_FILE_ACCEPT } from "@/lib/upload-config"

export default function StudentAssignmentPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssignment = useCallback(async () => {
    const res = await fetch(`/api/assignments/${params.id}`)
    const data = await res.json()
    setAssignment(data)
    if (data.submissions?.[0]?.textContent) setText(data.submissions[0].textContent)
    setLoading(false)
  }, [params.id])

  useEffect(() => { fetchAssignment() }, [fetchAssignment])

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

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; fileType: string } | null> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) { toast.error(`Помилка завантаження ${file.name}`); return null }
    return res.json()
  }

  const submit = async () => {
    if (!text.trim() && files.length === 0) { toast.error("Введіть текст або прикріпіть файл"); return }
    setSubmitting(true)
    setUploading(files.length > 0)
    try {
      const uploadedAttachments = []
      for (const file of files) {
        const result = await uploadFile(file)
        if (result) uploadedAttachments.push(result)
      }
      setUploading(false)

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: params.id, textContent: text, attachments: uploadedAttachments }),
      })
      if (res.ok) {
        toast.success("Роботу здано!")
        setFiles([])
        await fetchAssignment()
      } else {
        toast.error("Помилка при здачі")
      }
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>
  if (!assignment) return <div className="p-8 text-gray-500">Завдання не знайдено</div>

  const submission = assignment.submissions?.[0]
  const dueDate = new Date(assignment.dueDate)
  const isOverdue = new Date() > dueDate
  const isGraded = submission?.status === "GRADED"

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      {/* Banner */}
      <div className="w-full bg-[#BED9F4] px-8 py-6">
        <Link href="/student" className="inline-flex items-center gap-2 text-[#1e3a52]/70 hover:text-[#1e3a52] mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-[#1e3a52]">{assignment.title}</h1>
        {assignment.assignmentGroups?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {assignment.assignmentGroups.map((ag: any) => (
              <span key={ag.id} className="text-xs bg-white/40 text-[#1e3a52] px-2 py-0.5 rounded-full">{ag.group.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-8 py-6 space-y-4">
        {/* Task info card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center bg-[#BED9F4] rounded-xl px-4 py-3 flex-shrink-0">
            <span className="text-[10px] font-semibold text-[#1e3a52] uppercase tracking-wide">
              {format(dueDate, "MMM", { locale: uk })}
            </span>
            <span className="text-2xl font-bold text-[#1e3a52] leading-none">
              {format(dueDate, "d")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {submission ? (
                <StatusBadge status={submission.status} isLate={submission.isLate} />
              ) : isOverdue ? (
                <StatusBadge status="LATE" />
              ) : (
                <StatusBadge status="NOT_SUBMITTED" />
              )}
              <span className="text-xs text-gray-400">Макс: {assignment.maxGrade} балів</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {isOverdue ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Calendar className="w-4 h-4" />}
              <span className={isOverdue ? "text-red-500" : ""}>
                {format(dueDate, "d MMMM yyyy, HH:mm", { locale: uk })}
              </span>
            </div>
            {assignment.description && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{assignment.description}</p>
            )}
          </div>
        </div>

        {/* Grade card */}
        {isGraded && submission?.grade && (
          <div className="bg-green-50 rounded-xl border border-green-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-green-800">Оцінено!</h2>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {submission.grade.score} / {assignment.maxGrade}
            </div>
            {submission.grade.feedback && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Коментар вчителя:</p>
                <p className="text-gray-600 bg-white rounded-lg p-3 text-sm">{submission.grade.feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Teacher attachments */}
        {assignment.attachments?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Матеріали від вчителя</h2>
            <div className="space-y-2">
              {assignment.attachments.map((att: any) => (
                <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#3A7AA8] hover:underline">
                  {att.fileType.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {att.fileName}
                  <Download className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dropbox section */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-[#111111] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#3A7AA8]" />
            {submission ? "Ваша відповідь" : "Здати завдання"}
          </h2>

          {isOverdue && !submission && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-700">
              ⚠️ Дедлайн минув, нові файли будуть позначені як запізнені
            </div>
          )}

          {submission?.textContent && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">
              {submission.textContent}
            </div>
          )}

          {submission?.attachments?.length > 0 && (
            <div className="mb-4 p-3 bg-[#EBF5FD] rounded-lg">
              <p className="text-sm font-medium text-[#3A7AA8] mb-2">Завантажені файли:</p>
              <div className="space-y-2">
                {submission.attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center gap-2">
                    {att.fileType.startsWith("image/") ? (
                      <div>
                        <img src={att.fileUrl} alt={att.fileName} className="max-h-40 rounded-lg border border-gray-200" />
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#3A7AA8] hover:underline mt-1 flex items-center gap-1">
                          <Download className="w-3 h-3" /> {att.fileName}
                        </a>
                      </div>
                    ) : (
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#3A7AA8] hover:underline">
                        <FileText className="w-4 h-4" />
                        {att.fileName}
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGraded && (
            <>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Введіть вашу відповідь тут..."
                rows={5}
                className="mb-4"
              />
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_ACCEPT}
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 mb-2"
                >
                  <Paperclip className="w-4 h-4" />
                  Завантажити роботу
                </Button>
                <p className="text-xs text-gray-400 ml-1">Максимальний розмір файлу: 10 MB</p>
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#EBF5FD] px-3 py-1.5 rounded-lg text-sm">
                        {file.type.startsWith("image/") ? <ImageIcon className="w-4 h-4 text-[#3A7AA8]" /> : <FileText className="w-4 h-4 text-[#3A7AA8]" />}
                        <span className="flex-1 text-gray-700 truncate">{file.name}</span>
                        <span className="text-gray-400 text-xs">{(file.size / 1024).toFixed(0)} KB</span>
                        <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button onClick={submit} disabled={submitting} className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white">
                  {uploading ? "Завантаження..." : submitting ? "Здача..." : submission ? "Оновити відповідь" : "Здати роботу"}
                </Button>
                <Link href="/student">
                  <Button variant="outline" type="button">Скасувати</Button>
                </Link>
                {submission && (
                  <span className="text-sm text-gray-500 self-center">
                    Здано: {format(new Date(submission.submittedAt), "d MMM, HH:mm", { locale: uk })}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
