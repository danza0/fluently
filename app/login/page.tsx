"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Введіть коректну email адресу"),
  password: z.string().min(1, "Введіть пароль"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Невірний email або пароль")
      } else {
        const res = await fetch("/api/auth/session")
        const session = await res.json()
        if (session?.user?.role === "TEACHER") {
          router.push("/dashboard")
        } else {
          router.push("/student")
        }
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-light to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-milk rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Fluently</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Вхід до кабінету</h1>
          <p className="text-gray-500 mt-1">Введіть ваші дані для входу</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-sky-mid p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input id="email" type="email" placeholder="email@example.com" {...register("email")} className={errors.email ? "border-red-300" : ""} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} className={errors.password ? "border-red-300 pr-10" : "pr-10"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-milk hover:bg-milk-dark rounded-xl h-11">
              {isLoading ? "Вхід..." : "Увійти"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Немає акаунту?{" "}
            <Link href="/register" className="text-sky-darker hover:underline font-medium">Зареєструватися</Link>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          Вчитель: teacher@fluently.ua / teacher123
        </div>
      </div>
    </div>
  )
}
