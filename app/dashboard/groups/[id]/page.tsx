"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Copy, RefreshCw, UserPlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState("")
  const [addingStudent, setAddingStudent] = useState(false)

  const fetchGroup = async () => {
    const res = await fetch(`/api/groups/${params.id}`)
    if (res.ok) setGroup(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchGroup() }, [params.id])

  const copyCode = () => {
    navigator.clipboard.writeText(group.joinCode)
    toast.success("Код скопійовано!")
  }

  const resetCode = async () => {
    const res = await fetch(`/api/groups/${params.id}/reset-code`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setGroup((g: any) => ({ ...g, joinCode: data.joinCode }))
      toast.success("Код оновлено!")
    }
  }

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setAddingStudent(true)
    const res = await fetch(`/api/groups/${params.id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`${data.student.name} додано!`)
      setNickname("")
      fetchGroup()
    } else {
      toast.error(data.error)
    }
    setAddingStudent(false)
  }

  const removeStudent = async (studentId: string) => {
    const res = await fetch(`/api/groups/${params.id}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    if (res.ok) {
      toast.success("Учня видалено")
      fetchGroup()
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>
  if (!group) return <div className="p-8 text-gray-500">Група не знайдена</div>

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/groups" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад до груп
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="text-gray-500 mt-1">{group.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Код для приєднання:</span>
          <code className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{group.joinCode}</code>
          <Button variant="ghost" size="icon" onClick={copyCode}><Copy className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={resetCode}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Учні ({group.memberships?.length ?? 0})
        </h2>
        <form onSubmit={addStudent} className="flex gap-2 mb-4">
          <Input placeholder="Нікнейм учня..." value={nickname} onChange={(e) => setNickname(e.target.value)} className="max-w-xs" />
          <Button type="submit" disabled={addingStudent} className="bg-blue-500 hover:bg-blue-600 gap-2">
            <UserPlus className="w-4 h-4" />
            Додати
          </Button>
        </form>
        {group.memberships?.length === 0 ? (
          <p className="text-gray-400 text-sm">У групі ще немає учнів</p>
        ) : (
          <div className="space-y-2">
            {group.memberships?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{m.user.name}</span>
                  <span className="text-gray-400 text-sm ml-2">@{m.user.nickname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{format(new Date(m.joinedAt), "d MMM", { locale: uk })}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeStudent(m.user.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Завдання групи</h2>
        {group.assignmentGroups?.length === 0 ? (
          <p className="text-gray-400 text-sm">Немає завдань для цієї групи</p>
        ) : (
          <div className="space-y-2">
            {group.assignmentGroups?.map((ag: any) => (
              <Link key={ag.id} href={`/dashboard/assignments/${ag.assignment.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">{ag.assignment.title}</span>
                <span className="text-xs text-gray-400">{format(new Date(ag.assignment.dueDate), "d MMM yyyy", { locale: uk })}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
