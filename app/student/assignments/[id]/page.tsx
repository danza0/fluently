"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { StatusBadge } from "@/components/assignments/status-badge"

export default function StudentAssignmentPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/assignments/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setAssignment(data)
        if (data.submissions?.[0]?.textContent) {
          setText(data.submissions[0].textContent)
        }
        setLoading(false)
      })
  }, [params.id])

  const submit = async () => {
    if (!text.trim()) { toast.error("Введіть текст відповіді"); return }
    setSubmitting(true)
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: params.id, textContent: text }),
    })
    if (res.ok) {
      toast.success("Роботу здано!")
      const refreshed = await fetch(`/api/assignments/${params.id}`)
      setAssignment(await refreshed.json())
    } else {
      toast.error("Помилка при здачі")
    }
    setSubmitting(false)
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
        <div className="flex gap-6 text-sm text-gray-500">
          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
            {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            {format(dueDate, "d MMMM yyyy, HH:mm", { locale: uk })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Максимум: {assignment.maxGrade} балів
          </span>
        </div>
        {assignment.assignmentGroups?.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {assignment.assignmentGroups.map((ag: any) => (
              <span key={ag.id} className="text-xs bg-sky-light text-sky-darker px-2 py-1 rounded-full">{ag.group.name}</span>
            ))}
          </div>
        )}
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
        {!isGraded && (
          <>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Введіть вашу відповідь тут..."
              rows={8}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button onClick={submit} disabled={submitting} className="bg-sky-custom hover:bg-sky-dark">
                {submitting ? "Здача..." : submission ? "Оновити відповідь" : "Здати завдання"}
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
