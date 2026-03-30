import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  const user = session.user as any
  if (user.role !== "STUDENT") redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="STUDENT" userName={session.user?.name ?? undefined} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
