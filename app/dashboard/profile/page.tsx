"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Mail, Hash, Globe, Camera } from "lucide-react"
import { toast } from "sonner"

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

export default function TeacherProfilePage() {
  const { data: session, update } = useSession()
  const user = session?.user as any

  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [avatar, setAvatar] = useState("")
  const [timezone, setTimezone] = useState("Europe/Kyiv")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setNickname(user.nickname ?? "")
      setAvatar(user.avatar ?? "")
      setTimezone(user.timezone ?? "Europe/Kyiv")
    }
  }, [user])

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        await update({ name: data.name, avatar: data.avatar, nickname: data.nickname })
        toast.success("Профіль оновлено!")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Профіль</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-[#EBF5FD]" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-[#BED9F4] to-[#5B9BD1] rounded-full flex items-center justify-center border-2 border-[#EBF5FD]">
                <span className="text-white font-bold text-3xl">{name.charAt(0)}</span>
              </div>
            )}
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
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111111]">{name}</h2>
            <p className="text-gray-500 text-sm">Вчитель</p>
            <p className="text-xs text-gray-400 mt-1">Наведіть на фото щоб змінити</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-gray-400" />
            <span>@{nickname}</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-gray-400" />
            <span>{timezone}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-[#111111] mb-6">Редагувати профіль</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Повне ім&apos;я</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Іван Петренко"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Нікнейм</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ivan_petrenko"
            />
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
          <Button
            type="submit"
            disabled={saving}
            className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white"
          >
            {saving ? "Збереження..." : "Зберегти зміни"}
          </Button>
        </form>
      </div>
    </div>
  )
}
