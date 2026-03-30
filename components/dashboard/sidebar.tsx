"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { GraduationCap, LayoutDashboard, Users, BookOpen, Calendar, BarChart2, LogOut, User, BookMarked, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  role: "TEACHER" | "STUDENT"
  userName?: string
}

const teacherLinks = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/dashboard/groups", label: "Групи", icon: Users },
  { href: "/dashboard/assignments", label: "Завдання", icon: BookOpen },
  { href: "/dashboard/diary", label: "Щоденник", icon: BookMarked },
  { href: "/dashboard/timetable", label: "Розклад", icon: CalendarDays },
  { href: "/dashboard/students", label: "Учні", icon: User },
  { href: "/dashboard/calendar", label: "Календар", icon: Calendar },
  { href: "/dashboard/analytics", label: "Аналітика", icon: BarChart2 },
  { href: "/dashboard/profile", label: "Профіль", icon: User },
]

const studentLinks = [
  { href: "/student", label: "Дашборд", icon: LayoutDashboard },
  { href: "/student/groups", label: "Мої групи", icon: Users },
  { href: "/student/diary", label: "Щоденник", icon: BookMarked },
  { href: "/student/calendar", label: "Календар", icon: Calendar },
  { href: "/student/profile", label: "Профіль", icon: User },
]

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const links = role === "TEACHER" ? teacherLinks : studentLinks

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href={role === "TEACHER" ? "/dashboard" : "/student"} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-custom rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Fluently</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/student" && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-custom text-sky-darker"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {userName && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-500">Увійшли як</p>
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Вийти
        </Button>
      </div>
    </aside>
  )
}
