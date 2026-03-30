"use client"

import { useEffect, useState } from "react"
import { GroupCard } from "@/components/groups/group-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Plus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function StudentGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchGroups = async () => {
    const res = await fetch("/api/groups")
    if (res.ok) setGroups(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchGroups() }, [])

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Ви приєднались до групи "${data.group.name}"!`)
      setJoinCode("")
      setDialogOpen(false)
      fetchGroups()
    } else {
      toast.error(data.error)
    }
    setJoining(false)
  }

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мої групи</h1>
          <p className="text-gray-500 mt-1">Навчальні групи, до яких ви приєднались</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 gap-2">
              <Plus className="w-4 h-4" />
              Приєднатися до групи
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Приєднатися до групи</DialogTitle>
            </DialogHeader>
            <form onSubmit={joinGroup} className="space-y-4 mt-2">
              <p className="text-sm text-gray-500">Введіть код групи, який дав вам вчитель</p>
              <Input
                placeholder="Наприклад: BEGIN-2024"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
              <Button type="submit" disabled={joining} className="w-full bg-blue-500 hover:bg-blue-600">
                {joining ? "Приєднання..." : "Приєднатися"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ви не в жодній групі</h3>
          <p className="text-gray-500 mb-6">Попросіть вчителя надати код для вступу</p>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => setDialogOpen(true)}>Приєднатися до групи</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(g => <GroupCard key={g.id} group={g} role="STUDENT" />)}
        </div>
      )}
    </div>
  )
}
