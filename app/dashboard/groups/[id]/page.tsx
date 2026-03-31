"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Copy, RefreshCw, UserPlus, Trash2, Pencil, Check, X, Image, BookOpen, GraduationCap, Star, Rss, ClipboardList } from "lucide-react"
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

type Tab = "stream" | "assignments" | "people" | "grades"

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "stream", label: "Стрічка класу", icon: Rss },
  { id: "assignments", label: "Завдання", icon: ClipboardList },
  { id: "people", label: "Люди", icon: Users },
  { id: "grades", label: "Оцінки", icon: Star },
]

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-500",
  SUBMITTED: "bg-[#EBF5FD] text-[#3A7AA8]",
  GRADED: "bg-[#E0FFC2] text-green-800",
}
const statusLabels: Record<string, string> = {
  PENDING: "Очікує",
  SUBMITTED: "Здано",
  GRADED: "Оцінено",
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("stream")
  const [nickname, setNickname] = useState("")
  const [addingStudent, setAddingStudent] = useState(false)

  // Edit state
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const uploadImage = async (file: File, setUrl: (url: string) => void, setUploading: (v: boolean) => void) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setUrl(data.url)
      } else {
        const err = await res.json()
        toast.error(err.error || "Помилка завантаження")
      }
    } catch {
      toast.error("Помилка завантаження")
    } finally {
      setUploading(false)
    }
  }

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

  const assignments = group.assignmentGroups ?? []
  const members = group.memberships ?? []

  // Group submissions for grades tab: per assignment per student
  const gradesData = assignments.flatMap((ag: any) =>
    members.map((m: any) => {
      const sub = ag.assignment.submissions?.find((s: any) => s.studentId === m.user.id)
      return { assignment: ag.assignment, student: m.user, submission: sub ?? null }
    })
  )

  const bannerBg = group.coverImage
    ? `url(${group.coverImage})`
    : "linear-gradient(135deg, #BED9F4 0%, #5B9BD1 100%)"

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      {/* Top Banner */}
      <div
        className="w-full h-44 relative flex items-end"
        style={{ background: bannerBg, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative z-10 flex items-end justify-between w-full px-8 pb-5">
          <div className="flex items-end gap-4">
            {group.logo ? (
              <img src={group.logo} alt="Логотип" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-lg font-bold bg-white/90 text-[#111111] border-white h-8 px-2"
                  />
                  <Button size="sm" onClick={saveEdit} disabled={saving} className="h-8 bg-white text-[#3A7AA8] hover:bg-[#EBF5FD]">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-white hover:bg-white/20">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-white drop-shadow">{group.name}</h1>
              )}
              {group.description && !editing && (
                <p className="text-white/80 text-sm mt-0.5">{group.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={openMedia} className="text-white hover:bg-white/20 h-8 w-8" title="Зображення">
              <Image className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={startEdit} className="text-white hover:bg-white/20 h-8 w-8" title="Редагувати">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} className="text-white hover:bg-red-500/30 h-8 w-8" title="Видалити">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Link href="/dashboard/groups" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-8">
        <div className="flex gap-2 py-3">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-medium transition-all min-w-[90px] ${
                  active
                    ? "bg-[#BED9F4] text-[#1e3a52]"
                    : "bg-[#F5F8FA] text-gray-500 hover:bg-[#EBF5FD] hover:text-[#3A7AA8]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs leading-tight text-center">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {tab === "stream" && (
              <motion.div key="stream" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {assignments.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">Поки що немає публікацій</p>
                    <p className="text-gray-400 text-sm mt-1">Завдання з&apos;являться тут автоматично</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((ag: any) => {
                      const submissionCount = ag.assignment.submissions?.length ?? 0
                      return (
                        <motion.div
                          key={ag.id}
                          whileHover={{ y: -2 }}
                          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
                        >
                          <Link href={`/dashboard/assignments/${ag.assignment.id}`}>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#EBF5FD] flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-5 h-5 text-[#3A7AA8]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-[#111111] hover:text-[#3A7AA8] transition-colors">{ag.assignment.title}</h3>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    {format(new Date(ag.assignment.dueDate), "d MMM", { locale: uk })}
                                  </span>
                                </div>
                                {ag.assignment.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ag.assignment.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                  <span>Здали: {submissionCount} / {members.length}</span>
                                  <span>Макс: {ag.assignment.maxGrade} балів</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "assignments" && (
              <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає завдань</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FFFDF8]">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Завдання</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Термін</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Здано</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Дія</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {assignments.map((ag: any) => (
                          <tr key={ag.id} className="hover:bg-[#FFFDF8] transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium text-[#111111] text-sm">{ag.assignment.title}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {format(new Date(ag.assignment.dueDate), "d MMM yyyy", { locale: uk })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {ag.assignment.submissions?.length ?? 0} / {members.length}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Link href={`/dashboard/assignments/${ag.assignment.id}`}>
                                <Button size="sm" variant="outline" className="text-xs h-7">
                                  Відкрити
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "people" && (
              <motion.div key="people" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Додати учня</h2>
                  <form onSubmit={addStudent} className="flex gap-2">
                    <Input placeholder="Нікнейм учня..." value={nickname} onChange={e => setNickname(e.target.value)} className="max-w-xs" />
                    <Button type="submit" disabled={addingStudent} className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white gap-2">
                      <UserPlus className="w-4 h-4" />
                      Додати
                    </Button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-[#FFFDF8]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Учні ({members.length})
                    </span>
                  </div>
                  {members.length === 0 ? (
                    <div className="text-center py-10">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає учнів</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {members.map((m: any) => (
                        <motion.div key={m.id} whileHover={{ backgroundColor: "#FFFDF8" }} className="flex items-center justify-between px-5 py-3 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#EBF5FD] flex items-center justify-center text-sm font-bold text-[#3A7AA8]">
                              {m.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-[#111111] text-sm">{m.user.name}</p>
                              <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{format(new Date(m.joinedAt), "d MMM", { locale: uk })}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeStudent(m.user.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "grades" && (
              <motion.div key="grades" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {members.length === 0 || assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає даних для оцінок</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-[#FFFDF8]">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-[#FFFDF8] min-w-[160px]">Учень</th>
                            {assignments.map((ag: any) => (
                              <th key={ag.id} className="px-3 py-3 text-xs font-semibold text-gray-500 text-center max-w-[120px]">
                                <span className="line-clamp-2">{ag.assignment.title}</span>
                                <span className="block text-[10px] font-normal text-gray-400">/{ag.assignment.maxGrade}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {members.map((m: any) => (
                            <tr key={m.id} className="hover:bg-[#FFFDF8] transition-colors">
                              <td className="px-5 py-3 sticky left-0 bg-white">
                                <p className="font-medium text-sm text-[#111111]">{m.user.name}</p>
                                <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                              </td>
                              {assignments.map((ag: any) => {
                                const sub = ag.assignment.submissions?.find((s: any) => s.studentId === m.user.id)
                                return (
                                  <td key={ag.id} className="px-3 py-3 text-center">
                                    {sub?.grade ? (
                                      <Link href={`/dashboard/assignments/${ag.assignment.id}`}>
                                        <span className="inline-block bg-[#E0FFC2] text-green-800 font-bold text-sm px-3 py-1 rounded-lg hover:opacity-80 transition-opacity">
                                          {sub.grade.score}
                                        </span>
                                      </Link>
                                    ) : sub ? (
                                      <Link href={`/dashboard/assignments/${ag.assignment.id}`}>
                                        <span className="inline-block bg-[#EBF5FD] text-[#3A7AA8] text-xs px-2 py-1 rounded-lg">
                                          Здано
                                        </span>
                                      </Link>
                                    ) : (
                                      <span className="text-gray-300 text-sm">—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar card - class code */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Код класу</h3>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 font-mono font-bold text-[#3A7AA8] bg-[#EBF5FD] px-3 py-2 rounded-lg text-sm tracking-wider">
                {group.joinCode}
              </code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyCode} className="flex-1 gap-1 text-xs">
                <Copy className="w-3 h-3" />
                Копіювати
              </Button>
              <Button variant="outline" size="icon" onClick={resetCode} className="h-8 w-8" title="Оновити код">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Статистика</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Учні</span>
                <span className="font-bold text-[#111111]">{members.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Завдань</span>
                <span className="font-bold text-[#111111]">{assignments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Видалити групу?</DialogTitle></DialogHeader>
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

      {/* Logo / Cover dialog */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Логотип та обкладинка</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Логотип групи</Label>
              {editLogo && (
                <img src={editLogo} alt="Логотип" className="w-16 h-16 rounded-xl object-cover border border-gray-200 mb-2" />
              )}
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <div className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#BED9F4] rounded-xl p-4 cursor-pointer transition-colors ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                    <Image className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{uploadingLogo ? "Завантаження..." : "Обрати зображення"}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingLogo}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadImage(file, setEditLogo, setUploadingLogo)
                    }}
                  />
                </label>
                {editLogo && (
                  <Button variant="ghost" size="sm" onClick={() => setEditLogo("")} className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Обкладинка групи</Label>
              {editCover && (
                <img src={editCover} alt="Обкладинка" className="w-full h-24 rounded-xl object-cover border border-gray-200 mb-2" />
              )}
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <div className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#BED9F4] rounded-xl p-4 cursor-pointer transition-colors ${uploadingCover ? "opacity-50 pointer-events-none" : ""}`}>
                    <Image className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{uploadingCover ? "Завантаження..." : "Обрати зображення"}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingCover}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadImage(file, setEditCover, setUploadingCover)
                    }}
                  />
                </label>
                {editCover && (
                  <Button variant="ghost" size="sm" onClick={() => setEditCover("")} className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaOpen(false)}>Скасувати</Button>
            <Button onClick={saveMedia} disabled={savingMedia || uploadingLogo || uploadingCover} className="bg-[#BED9F4] hover:bg-[#5B9BD1] text-[#1e3a52] hover:text-white">
              {savingMedia ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
