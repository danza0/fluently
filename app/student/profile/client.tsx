"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { User, Mail, Hash, BookOpen, Globe, Pencil, X, Camera } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const TIMEZONES = [
  { value: "Europe/Kyiv", label: "Київ (UTC+2/+3)" },
  { value: "Europe/London", label: "Лондон (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Берлін (UTC+1/+2)" },
  { value: "Europe/Paris", label: "Париж (UTC+1/+2)" },
  { value: "Europe/Warsaw", label: "Варшава (UTC+1/+2)" },
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "America/New_York", label: "Нью-Йорк (UTC-5/-4)" },
  { value: "America/Chicago", label: "Чикаго (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "Лос-Анджелес (UTC-8/-7)" },
  { value: "Asia/Tokyo", label: "Токіо (UTC+9)" },
  { value: "Asia/Dubai", label: "Дубай (UTC+4)" },
  { value: "Australia/Sydney", label: "Сідней (UTC+10/+11)" },
]

interface StudentData {
  id: string
  name: string
  email: string
  nickname: string
  avatar?: string | null
  timezone?: string | null
  createdAt: string
  groupsCount: number
  submissionsCount: number
  avgGrade: string
  groups: { id: string; groupName: string }[]
}

export default function StudentProfileClient({ studentData }: { studentData: StudentData }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(studentData.name)
  const [nickname, setNickname] = useState(studentData.nickname)
  const [avatar, setAvatar] = useState(studentData.avatar ?? "")
  const [timezone, setTimezone] = useState(studentData.timezone ?? "Europe/Kyiv")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setAvatar(data.url)
        toast.success("Фото завантажено!")
      } else {
        const err = await res.json()
        toast.error(err.error || "Помилка завантаження")
      }
    } catch {
      toast.error("Помилка завантаження")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, avatar, timezone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Помилка збереження")
      } else {
        toast.success("Профіль оновлено!")
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Профіль</h1>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-2"
          >
            <Pencil className="w-3 h-3" />
            Редагувати
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            {(() => {
              const displayAvatar = editing ? avatar : (studentData.avatar ?? "")
              return displayAvatar ? (
                <img src={displayAvatar} alt={studentData.name} className="w-20 h-20 rounded-full object-cover border-2 border-[#EBF5FD]" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#BED9F4] to-[#5B9BD1] rounded-full flex items-center justify-center border-2 border-[#EBF5FD]">
                  <span className="text-white font-bold text-3xl">{studentData.name.charAt(0)}</span>
                </div>
              )
            })()}
            {editing && (
              <>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingAvatar}
                    onChange={e => { const file = e.target.files?.[0]; if (file) handleAvatarUpload(file) }}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                    <div className="w-5 h-5 border-2 border-[#3A7AA8] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111111]">{studentData.name}</h2>
            <p className="text-gray-500 text-sm">Учень</p>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{studentData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">@{studentData.nickname}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{studentData.timezone ?? "Europe/Kyiv"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                На платформі з {new Date(studentData.createdAt).toLocaleDateString("uk-UA")}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Повне ім&apos;я</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Нікнейм</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Часовий пояс</Label>
              <Select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white"
              >
                {saving ? "Збереження..." : "Зберегти"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" />
                Скасувати
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-sky-darker">{studentData.groupsCount}</div>
          <div className="text-sm text-gray-500 mt-1">Груп</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-sky-darker">{studentData.submissionsCount}</div>
          <div className="text-sm text-gray-500 mt-1">Здано</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{studentData.avgGrade}</div>
          <div className="text-sm text-gray-500 mt-1">Середній бал</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Мої групи</h3>
        {studentData.groups.length === 0 ? (
          <p className="text-gray-400 text-sm">Ви не в жодній групі</p>
        ) : (
          <div className="space-y-2">
            {studentData.groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50">
                <BookOpen className="w-4 h-4 text-sky-dark" />
                <span className="text-gray-900">{g.groupName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

