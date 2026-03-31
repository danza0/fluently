"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Users, BookOpen, GraduationCap, Clock, Star, Rss, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

type Tab = "stream" | "assignments" | "people" | "grades"

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "stream", label: "Стрічка класу", icon: Rss },
  { id: "assignments", label: "Завдання", icon: ClipboardList },
  { id: "people", label: "Люди", icon: Users },
  { id: "grades", label: "Оцінки", icon: Star },
]

const statusBadge = (sub: any) => {
  if (!sub) return null
  if (sub.grade) return <span className="text-[10px] bg-[#E0FFC2] text-green-800 px-1.5 py-0.5 rounded-full font-medium">Оцінено: {sub.grade.score}</span>
  return <span className="text-[10px] bg-[#EBF5FD] text-[#3A7AA8] px-1.5 py-0.5 rounded-full font-medium">Здано</span>
}

export default function StudentGroupPage() {
  const params = useParams()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("stream")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [groupRes, sessionRes] = await Promise.all([
        fetch(`/api/groups/${params.id}`),
        fetch("/api/auth/session"),
      ])
      const [groupData, sessionData] = await Promise.all([
        groupRes.json(),
        sessionRes.json(),
      ])
      if (groupRes.ok) setGroup(groupData)
      setCurrentUserId(sessionData?.user?.id ?? null)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) return <div className="p-8 text-gray-500">Завантаження...</div>
  if (!group) return <div className="p-8 text-gray-500">Групу не знайдено</div>

  const assignments = group.assignmentGroups ?? []
  const members = group.memberships ?? []

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
        <div className="relative z-10 flex items-end gap-4 w-full px-8 pb-5">
          {group.logo ? (
            <img src={group.logo} alt="Логотип" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow">{group.name}</h1>
            {group.description && <p className="text-white/80 text-sm mt-0.5">{group.description}</p>}
          </div>
        </div>
        <Link href="/student/groups" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((ag: any) => {
                      const mySub = currentUserId
                        ? ag.assignment.submissions?.find((s: any) => s.studentId === currentUserId)
                        : null
                      return (
                        <motion.div
                          key={ag.id}
                          whileHover={{ y: -2 }}
                          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
                        >
                          <Link href={`/student/assignments/${ag.assignment.id}`}>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#EBF5FD] flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-5 h-5 text-[#3A7AA8]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-[#111111] hover:text-[#3A7AA8] transition-colors">{ag.assignment.title}</h3>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {statusBadge(mySub)}
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(ag.assignment.dueDate), "d MMM", { locale: uk })}
                                    </span>
                                  </div>
                                </div>
                                {ag.assignment.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ag.assignment.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Макс: {ag.assignment.maxGrade} балів</p>
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
                    <div className="divide-y divide-gray-50">
                      {assignments.map((ag: any) => {
                        const mySub = currentUserId
                          ? ag.assignment.submissions?.find((s: any) => s.studentId === currentUserId)
                          : null
                        const isPast = new Date(ag.assignment.dueDate) < new Date()
                        return (
                          <Link key={ag.id} href={`/student/assignments/${ag.assignment.id}`}>
                            <motion.div whileHover={{ backgroundColor: "#FFFDF8" }} className="flex items-center gap-4 px-5 py-4 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-[#EBF5FD] flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-[#3A7AA8]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#111111] text-sm">{ag.assignment.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className={`text-xs ${isPast && !mySub ? "text-red-500" : "text-gray-400"}`}>
                                    {format(new Date(ag.assignment.dueDate), "d MMM yyyy, HH:mm", { locale: uk })}
                                  </span>
                                </div>
                              </div>
                              <div>{statusBadge(mySub) ?? <span className="text-xs text-gray-400">Не здано</span>}</div>
                            </motion.div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "people" && (
              <motion.div key="people" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-[#FFFDF8]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Учні ({members.length})</span>
                  </div>
                  {members.length === 0 ? (
                    <div className="text-center py-10">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає учнів</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            m.user.id === currentUserId ? "bg-[#BED9F4] text-[#1e3a52]" : "bg-[#EBF5FD] text-[#3A7AA8]"
                          }`}>
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#111111] text-sm">
                              {m.user.name}
                              {m.user.id === currentUserId && <span className="ml-2 text-[10px] bg-[#BED9F4] text-[#1e3a52] px-1.5 py-0.5 rounded-full">Ви</span>}
                            </p>
                            <p className="text-xs text-gray-400">@{m.user.nickname}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "grades" && (
              <motion.div key="grades" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Немає оцінок</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {assignments.map((ag: any) => {
                        const mySub = currentUserId
                          ? ag.assignment.submissions?.find((s: any) => s.studentId === currentUserId)
                          : null
                        return (
                          <Link key={ag.id} href={`/student/assignments/${ag.assignment.id}`}>
                            <motion.div whileHover={{ backgroundColor: "#FFFDF8" }} className="flex items-center justify-between px-5 py-4 transition-colors">
                              <div>
                                <p className="font-medium text-[#111111] text-sm">{ag.assignment.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Термін: {format(new Date(ag.assignment.dueDate), "d MMM yyyy", { locale: uk })}</p>
                              </div>
                              <div className="text-right">
                                {mySub?.grade ? (
                                  <div>
                                    <span className="text-2xl font-bold text-[#111111]">{mySub.grade.score}</span>
                                    <span className="text-sm text-gray-400">/{ag.assignment.maxGrade}</span>
                                    {mySub.grade.feedback && (
                                      <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] text-right line-clamp-1">{mySub.grade.feedback}</p>
                                    )}
                                  </div>
                                ) : mySub ? (
                                  <span className="text-sm text-[#3A7AA8]">Очікує оцінки</span>
                                ) : (
                                  <span className="text-sm text-gray-400">Не здано</span>
                                )}
                              </div>
                            </motion.div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Інформація</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Учні</span>
                <span className="font-bold text-[#111111]">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Завдань</span>
                <span className="font-bold text-[#111111]">{assignments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Здано</span>
                <span className="font-bold text-[#111111]">
                  {assignments.filter((ag: any) =>
                    currentUserId && ag.assignment.submissions?.some((s: any) => s.studentId === currentUserId)
                  ).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
