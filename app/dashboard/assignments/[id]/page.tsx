"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, Clock, CheckCircle } from "lucide-react"
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
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад до завдань
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          {isOverdue && <Badge variant="destructive">Дедлайн минув</Badge>}
        </div>
        {assignment.description && <p className="text-gray-600 mb-4 whitespace-pre-wrap">{assignment.description}</p>}
        <div className="flex gap-6 text-sm text-gray-500">
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
        {assignment.assignmentGroups?.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {assignment.assignmentGroups.map((ag: any) => (
              <span key={ag.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{ag.group.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Роботи учнів ({submittedCount})
        </h2>
        {assignment.submissions?.length === 0 ? (
          <p className="text-gray-400">Жодної роботи ще не здано</p>
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
                        <Button size="sm" onClick={() => submitGrade(sub.id)} className="bg-blue-500 hover:bg-blue-600">Оновити</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-blue-100 rounded-lg p-3">
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
                      <Button size="sm" onClick={() => submitGrade(sub.id)} className="bg-green-500 hover:bg-green-600">Оцінити</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
