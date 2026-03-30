"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, Download } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { StatusBadge } from "@/components/assignments/status-badge"

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
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: файл занадто великий`); return false }
      const allowed = ["image/jpeg","image/jpg","image/png","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      if (!allowed.includes(f.type)) { toast.error(`${f.name}: непідтримуваний тип файлу`); return false }
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
    <div className="p-8 max-w-3xl">
      <Link href="/student" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          {submission ? (
            <StatusBadge status={submission.status} isLate={submission.isLate} />
          ) : isOverdue ? (
            <StatusBadge status="LATE" />
          ) : (
            <StatusBadge status="NOT_SUBMITTED" />
          )}
        </div>
        {assignment.description && (
          <p className="text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
        )}
        {assignment.attachments?.length > 0 && (
          <div className="mt-3 p-3 bg-sky-light rounded-lg">
            <p className="text-sm font-medium text-sky-darker mb-2">Матеріали від вчителя:</p>
            <div className="space-y-1">
              {assignment.attachments.map((att: any) => (
                <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-darker hover:underline">
                  {att.fileType.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {att.fileName}
                  <Download className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-6 text-sm text-gray-500 mt-4">
          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
            {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            {format(dueDate, "d MMMM yyyy, HH:mm", { locale: uk })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Максимум: {assignment.maxGrade} балів
          </span>
        </div>
      </div>

      {isGraded && submission?.grade && (
        <div className="bg-green-50 rounded-xl border border-green-100 p-6 mb-6">
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

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {submission ? "Ваша відповідь" : "Здати завдання"}
        </h2>
        {submission?.textContent && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">
            {submission.textContent}
          </div>
        )}
        {submission?.attachments?.length > 0 && (
          <div className="mb-4 p-3 bg-sky-light rounded-lg">
            <p className="text-sm font-medium text-sky-darker mb-2">Прикріплені файли:</p>
            <div className="space-y-2">
              {submission.attachments.map((att: any) => (
                <div key={att.id} className="flex items-center gap-2">
                  {att.fileType.startsWith("image/") ? (
                    <div>
                      <img src={att.fileUrl} alt={att.fileName} className="max-h-40 rounded-lg border border-gray-200" />
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-darker hover:underline mt-1 flex items-center gap-1">
                        <Download className="w-3 h-3" /> {att.fileName}
                      </a>
                    </div>
                  ) : (
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-sky-darker hover:underline">
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
              rows={6}
              className="mb-4"
            />
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
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
                Прикріпити файл
              </Button>
              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-sky-light px-3 py-1.5 rounded-lg text-sm">
                      {file.type.startsWith("image/") ? <ImageIcon className="w-4 h-4 text-sky-darker" /> : <FileText className="w-4 h-4 text-sky-darker" />}
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
              <Button onClick={submit} disabled={submitting} className="bg-sky-custom hover:bg-sky-dark text-sky-darker">
                {uploading ? "Завантаження..." : submitting ? "Здача..." : submission ? "Оновити відповідь" : "Здати завдання"}
              </Button>
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
  )
}

