import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { prisma } from "@/lib/prisma"
import { accentStyle } from "@/lib/accent"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  const user = session.user as any
  if (user.role !== "TEACHER") redirect("/student")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { accentColor: true },
  })

  return (
    <div className="flex min-h-screen bg-[#FAFBFD]" style={accentStyle(dbUser?.accentColor)}>
      <Sidebar role="TEACHER" userName={session.user?.name ?? undefined} userAvatar={(user as any).avatar ?? undefined} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  )
}
