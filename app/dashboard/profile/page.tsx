"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Mail, Hash, Globe } from "lucide-react"
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

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setNickname(user.nickname ?? "")
      setAvatar(user.avatar ?? "")
      setTimezone(user.timezone ?? "Europe/Kyiv")
    }
  }, [user])

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
        await update({ name: data.name })
        toast.success("Профіль оновлено!")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Профіль</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {avatar ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-sky-custom rounded-full flex items-center justify-center">
              <span className="text-sky-darker font-bold text-2xl">{name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            <p className="text-gray-500">Вчитель</p>
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

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Редагувати профіль</h3>
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
            <Label htmlFor="avatar">URL аватара</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
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
