"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Copy, RefreshCw, UserPlus, Trash2, Pencil, Check, X, Image } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState("")
  const [addingStudent, setAddingStudent] = useState(false)

  // Rename state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Cover / Logo state
  const [mediaOpen, setMediaOpen] = useState(false)
  const [editLogo, setEditLogo] = useState("")
  const [editCover, setEditCover] = useState("")
  const [savingMedia, setSavingMedia] = useState(false)

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

  const startEdit = () => {
    setEditName(group.name)
    setEditDescription(group.description ?? "")
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = async () => {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/groups/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDescription }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGroup((g: any) => ({ ...g, name: updated.name, description: updated.description }))
      setEditing(false)
      toast.success("Групу оновлено!")
    } else {
      toast.error("Помилка збереження")
    }
    setSaving(false)
  }

  const deleteGroup = async () => {
    setDeleting(true)
    const res = await fetch(`/api/groups/${params.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Групу видалено")
      router.push("/dashboard/groups")
    } else {
      toast.error("Помилка видалення")
      setDeleting(false)
    }
  }

  const openMedia = () => {
    setEditLogo(group.logo ?? "")
    setEditCover(group.coverImage ?? "")
    setMediaOpen(true)
  }

  const saveMedia = async () => {
    setSavingMedia(true)
    const res = await fetch(`/api/groups/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: group.name,
        description: group.description,
        logo: editLogo || null,
        coverImage: editCover || null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGroup((g: any) => ({ ...g, logo: updated.logo, coverImage: updated.coverImage }))
      setMediaOpen(false)
      toast.success("Зображення оновлено!")
    } else {
      toast.error("Помилка збереження")
    }
    setSavingMedia(false)
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

      {/* Cover image */}
      {group.coverImage && (
        <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
          <img src={group.coverImage} alt="Обкладинка групи" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {group.logo && (
              <img src={group.logo} alt="Логотип групи" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Назва групи"
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Опис групи (необов'язково)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white gap-1">
                      <Check className="w-3 h-3" />
                      Зберегти
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-3 h-3" />
                      Скасувати
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                  {group.description && <p className="text-gray-500 mt-1">{group.description}</p>}
                </>
              )}
            </div>
          </div>
          {!editing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={openMedia} title="Логотип / Обкладинка">
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={startEdit} title="Перейменувати">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
                title="Видалити групу"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Код для приєднання:</span>
          <code className="font-mono font-bold text-sky-darker bg-sky-light px-3 py-1 rounded-lg">{group.joinCode}</code>
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
          <Button type="submit" disabled={addingStudent} className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white gap-2">
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити групу?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Ця дія незворотна. Група <strong>{group.name}</strong> і всі пов&apos;язані дані будуть видалені.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Скасувати</Button>
            <Button variant="destructive" onClick={deleteGroup} disabled={deleting}>
              {deleting ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logo / Cover image dialog */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Логотип та обкладинка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">URL логотипу</Label>
              <Input
                id="logo-url"
                placeholder="https://example.com/logo.png"
                value={editLogo}
                onChange={(e) => setEditLogo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-url">URL обкладинки</Label>
              <Input
                id="cover-url"
                placeholder="https://example.com/cover.jpg"
                value={editCover}
                onChange={(e) => setEditCover(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaOpen(false)}>Скасувати</Button>
            <Button onClick={saveMedia} disabled={savingMedia} className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white">
              {savingMedia ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
