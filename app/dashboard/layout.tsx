import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  const user = session.user as any
  if (user.role !== "TEACHER") redirect("/student")

  return (
    <div className="flex min-h-screen bg-[#FAFBFD]">
      <Sidebar role="TEACHER" userName={session.user?.name ?? undefined} userAvatar={(user as any).avatar ?? undefined} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
