"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function NewGroupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Введіть назву групи"); return }
    setIsLoading(true)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) { toast.error("Помилка створення групи"); return }
      toast.success("Групу створено!")
      router.push("/dashboard/groups")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/groups" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад до груп
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Нова група</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Назва групи *</Label>
            <Input id="name" placeholder="Наприклад: Англійська для початківців" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Опис (необов&apos;язково)</Label>
            <Textarea id="description" placeholder="Короткий опис групи..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
              {isLoading ? "Створення..." : "Створити групу"}
            </Button>
            <Link href="/dashboard/groups">
              <Button variant="outline" type="button">Скасувати</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
