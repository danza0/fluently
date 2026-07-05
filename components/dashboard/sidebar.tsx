"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { GraduationCap, LayoutDashboard, Users, BookOpen, Calendar, BarChart2, LogOut, User, CalendarDays, ClipboardList, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  role: "TEACHER" | "STUDENT"
  userName?: string
  userAvatar?: string
}

const teacherLinks = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/dashboard/groups", label: "Групи", icon: Users },
  { href: "/dashboard/assignments", label: "Завдання", icon: BookOpen },
  { href: "/dashboard/timetable", label: "Розклад", icon: CalendarDays },
  { href: "/dashboard/students", label: "Учні", icon: User },
  { href: "/dashboard/calendar", label: "Календар", icon: Calendar },
  { href: "/dashboard/analytics", label: "Аналітика", icon: BarChart2 },
  { href: "/dashboard/report", label: "Табель", icon: ClipboardList },
  { href: "/dashboard/profile", label: "Профіль", icon: User },
]

const studentLinks = [
  { href: "/student", label: "Дашборд", icon: LayoutDashboard },
  { href: "/student/groups", label: "Мої групи", icon: Users },
  { href: "/student/timetable", label: "Розклад", icon: CalendarDays },
  { href: "/student/calendar", label: "Календар", icon: Calendar },
  { href: "/student/report", label: "Табель", icon: ClipboardList },
  { href: "/student/profile", label: "Профіль", icon: User },
]

export function Sidebar({ role, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const links = role === "TEACHER" ? teacherLinks : studentLinks
  const initials = userName ? userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the drawer on navigation and lock body scroll while open
  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const content = (
    <>
      {/* Logo header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href={role === "TEACHER" ? "/dashboard" : "/student"} className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-300)] to-[var(--accent-500)] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-[#111111] tracking-tight">Fluently</span>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{role === "TEACHER" ? "Вчитель" : "Учень"}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/student" && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative",
                isActive
                  ? "bg-[var(--accent-100)] text-[var(--accent-900)] border-l-[3px] border-[var(--accent-600)] pl-[9px]"
                  : "text-gray-500 hover:bg-[#F5F9FD] hover:text-[var(--accent-600)] border-l-[3px] border-transparent pl-[9px]"
              )}
            >
              <link.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-[var(--accent-600)]" : "text-gray-400")} />
              <span className="leading-none">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        {userName && (
          <Link href={role === "TEACHER" ? "/dashboard/profile" : "/student/profile"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F9FD] transition-all duration-150 mb-1 group">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-9 h-9 rounded-full object-cover border-2 border-[var(--accent-100)] flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-300)] to-[var(--accent-500)] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">{role === "TEACHER" ? "Вчитель" : "Учень"}</p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm py-2.5 h-auto transition-all duration-150"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Вийти
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <Link href={role === "TEACHER" ? "/dashboard" : "/student"} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-300)] to-[var(--accent-500)] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-[#111111]">Fluently</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -m-2 text-gray-500 hover:text-[var(--accent-600)]"
          aria-label="Відкрити меню"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-xl overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 p-2 text-gray-400 hover:text-gray-700 z-10"
              aria-label="Закрити меню"
            >
              <X className="w-5 h-5" />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white border-r border-gray-100 flex-col shadow-sm">
        {content}
      </aside>
    </>
  )
}
