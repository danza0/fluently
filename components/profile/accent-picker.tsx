"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Palette } from "lucide-react"
import { ACCENT_PALETTES, DEFAULT_ACCENT } from "@/lib/accent"

export function AccentPicker() {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(DEFAULT_ACCENT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setSelected(p.accentColor || DEFAULT_ACCENT) })
  }, [])

  const pick = async (key: string) => {
    if (saving || key === selected) return
    const prev = selected
    setSelected(key)
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentColor: key === DEFAULT_ACCENT ? null : key }),
      })
      if (res.ok) {
        toast.success("Колір оновлено!")
        router.refresh()
      } else {
        setSelected(prev)
        toast.error("Помилка збереження")
      }
    } catch {
      setSelected(prev)
      toast.error("Помилка збереження")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-semibold text-[#111111] mb-1 flex items-center gap-2">
        <Palette className="w-4 h-4 text-[var(--accent-600)]" />
        Колір оформлення
      </h3>
      <p className="text-xs text-gray-400 mb-4">Оберіть акцентний колір вашого кабінету</p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(ACCENT_PALETTES).map(([key, palette]) => {
          const isActive = selected === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              disabled={saving}
              title={palette.label}
              className={`flex flex-col items-center gap-1.5 group ${saving ? "opacity-60" : ""}`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? "border-gray-700 scale-110" : "border-transparent group-hover:scale-105"}`}
                style={{ background: `linear-gradient(135deg, ${palette.shades[300]}, ${palette.shades[500]})` }}
              >
                {isActive && <Check className="w-4 h-4 text-white drop-shadow" />}
              </span>
              <span className={`text-[10px] ${isActive ? "text-gray-700 font-medium" : "text-gray-400"}`}>{palette.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
