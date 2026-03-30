"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"

const registerSchema = z.object({
  name: z.string().min(2, "Мінімум 2 символи"),
  nickname: z.string().min(2, "Мінімум 2 символи").max(30, "Максимум 30 символів").regex(/^[a-zA-Z0-9_]+$/, "Тільки латинські літери, цифри та _"),
  email: z.string().email("Введіть коректну email адресу"),
  password: z.string().min(6, "Мінімум 6 символів"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, nickname: data.nickname, email: data.email, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Помилка реєстрації")
        return
      }
      await signIn("credentials", { email: data.email, password: data.password, redirect: false })
      router.push("/student")
      toast.success("Акаунт успішно створено!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Fluently</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Створити акаунт</h1>
          <p className="text-gray-500 mt-1">Зареєструйтесь як учень</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Повне ім&apos;я</Label>
              <Input id="name" placeholder="Іван Петренко" {...register("name")} className={errors.name ? "border-red-300" : ""} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Псевдонім (нікнейм)</Label>
              <Input id="nickname" placeholder="ivan_petrenko" {...register("nickname")} className={errors.nickname ? "border-red-300" : ""} />
              {errors.nickname && <p className="text-red-500 text-sm">{errors.nickname.message}</p>}
              <p className="text-xs text-gray-400">Тільки латинські літери, цифри та _</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input id="email" type="email" placeholder="email@example.com" {...register("email")} className={errors.email ? "border-red-300" : ""} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} className={errors.password ? "border-red-300" : ""} />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Підтвердити пароль</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} className={errors.confirmPassword ? "border-red-300" : ""} />
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl h-11 mt-2">
              {isLoading ? "Створення..." : "Зареєструватися"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Вже є акаунт?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Увійти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
