"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { GraduationCap, LayoutDashboard, Users, BookOpen, Calendar, BarChart2, LogOut, User, CalendarDays } from "lucide-react"
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
  { href: "/dashboard/profile", label: "Профіль", icon: User },
]

const studentLinks = [
  { href: "/student", label: "Дашборд", icon: LayoutDashboard },
  { href: "/student/groups", label: "Мої групи", icon: Users },
  { href: "/student/timetable", label: "Розклад", icon: CalendarDays },
  { href: "/student/calendar", label: "Календар", icon: Calendar },
  { href: "/student/profile", label: "Профіль", icon: User },
]

export function Sidebar({ role, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const links = role === "TEACHER" ? teacherLinks : studentLinks
  const initials = userName ? userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href={role === "TEACHER" ? "/dashboard" : "/student"} className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#BED9F4] to-[#5B9BD1] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-[#111111] tracking-tight">Fluently</span>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{role === "TEACHER" ? "Викладач" : "Учень"}</p>
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
                  ? "bg-[#EBF5FD] text-[#1e3a52] border-l-[3px] border-[#3A7AA8] pl-[9px]"
                  : "text-gray-500 hover:bg-[#F5F9FD] hover:text-[#3A7AA8] border-l-[3px] border-transparent pl-[9px]"
              )}
            >
              <link.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-[#3A7AA8]" : "text-gray-400")} />
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
              <img src={userAvatar} alt={userName} className="w-9 h-9 rounded-full object-cover border-2 border-[#EBF5FD] flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BED9F4] to-[#5B9BD1] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
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
    </aside>
  )
}
