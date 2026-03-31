"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, Clock, CheckCircle, FileText, Image as ImageIcon, Download } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { StatusBadge } from "@/components/assignments/status-badge"

export default function AssignmentDetailPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<Record<string, { score: number; feedback: string }>>({})

  const fetchAssignment = async () => {
    const res = await fetch(`/api/assignments/${params.id}`)
    if (res.ok) setAssignment(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchAssignment() }, [params.id])

  const submitGrade = async (submissionId: string) => {
    const data = grading[submissionId]
    if (!data) return
    const res = await fetch(`/api/submissions/${submissionId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(data.score), feedback: data.feedback }),
    })
    if (res.ok) {
      toast.success("Оцінку виставлено!")
      fetchAssignment()
    } else {
      toast.error("Помилка")
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>
  if (!assignment) return <div className="p-8 text-gray-500">Завдання не знайдено</div>

  const dueDate = new Date(assignment.dueDate)
  const isOverdue = new Date() > dueDate
  const submittedCount = assignment.submissions?.length ?? 0
  const gradedCount = assignment.submissions?.filter((s: any) => s.status === "GRADED").length ?? 0

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      {/* Banner */}
      <div className="w-full bg-[#BED9F4] px-8 py-6">
        <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-[#1e3a52]/70 hover:text-[#1e3a52] mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Назад до завдань
        </Link>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-[#1e3a52]">{assignment.title}</h1>
          {isOverdue && <Badge variant="destructive">Дедлайн минув</Badge>}
        </div>
        {assignment.assignmentGroups?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {assignment.assignmentGroups.map((ag: any) => (
              <span key={ag.id} className="text-xs bg-white/40 text-[#1e3a52] px-2 py-0.5 rounded-full">{ag.group.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
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
            {assignment.description && (
              <p className="text-gray-600 mb-3 whitespace-pre-wrap text-sm">{assignment.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(dueDate, "d MMMM yyyy, HH:mm", { locale: uk })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Макс: {assignment.maxGrade} балів
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {gradedCount}/{submittedCount} перевірено
              </span>
            </div>
          </div>
        </div>

        {/* Teacher attachments */}
        {assignment.attachments?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Прикріплені матеріали</h2>
            <div className="space-y-2">
              {assignment.attachments.map((att: any) => (
                <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#3A7AA8] hover:underline">
                  {att.fileType?.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {att.fileName}
                  <Download className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Submissions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-[#111111] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3A7AA8]" />
            Роботи учнів ({submittedCount})
          </h2>
          {assignment.submissions?.length === 0 ? (
            <p className="text-gray-400 text-sm">Жодної роботи ще не здано</p>
          ) : (
            <div className="space-y-4">
              {assignment.submissions?.map((sub: any) => (
                <div key={sub.id} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">{sub.student.name}</span>
                      <span className="text-gray-400 text-sm ml-2">@{sub.student.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.isLate && <Badge variant="destructive" className="text-xs">Пізно</Badge>}
                      <StatusBadge status={sub.status} />
                      <span className="text-xs text-gray-400">{format(new Date(sub.submittedAt), "d MMM, HH:mm", { locale: uk })}</span>
                    </div>
                  </div>
                  {sub.textContent && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 whitespace-pre-wrap">{sub.textContent}</div>
                  )}
                  {sub.attachments?.length > 0 && (
                    <div className="mb-4 p-3 bg-[#EBF5FD] rounded-lg">
                      <p className="text-sm font-medium text-[#3A7AA8] mb-2">Файли учня:</p>
                      <div className="space-y-1">
                        {sub.attachments.map((att: any) => (
                          <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#3A7AA8] hover:underline">
                            {att.fileType?.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            {att.fileName}
                            <Download className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {sub.grade ? (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-green-700">Оцінка: {sub.grade.score}/{assignment.maxGrade}</span>
                      </div>
                      {sub.grade.feedback && <p className="text-sm text-gray-600">{sub.grade.feedback}</p>}
                      <div className="mt-2 border-t border-green-100 pt-2">
                        <p className="text-xs text-gray-400 mb-2">Оновити оцінку:</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={assignment.maxGrade}
                            defaultValue={sub.grade.score}
                            onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], score: Number(e.target.value) } }))}
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm"
                            placeholder="Оцінка"
                          />
                          <Textarea
                            defaultValue={sub.grade.feedback || ""}
                            onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value } }))}
                            placeholder="Коментар..." rows={1}
                            className="text-sm"
                          />
                          <Button size="sm" onClick={() => submitGrade(sub.id)} className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white">Оновити</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-[#BED9F4] rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Виставити оцінку:</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          max={assignment.maxGrade}
                          onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], score: Number(e.target.value) } }))}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-sm"
                          placeholder="Оцінка"
                        />
                        <Textarea
                          onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value } }))}
                          placeholder="Коментар для учня..." rows={1}
                          className="text-sm"
                        />
                        <Button size="sm" onClick={() => submitGrade(sub.id)} className="bg-green-500 hover:bg-green-600 text-white">Оцінити</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
