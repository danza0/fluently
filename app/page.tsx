"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Star, Clock, CheckCircle, Award, ChevronRight, GraduationCap, MessageCircle } from "lucide-react"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Fluently</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Переваги</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Як це працює</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Відгуки</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700">Увійти</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Спробувати</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Преміум платформа для навчання англійської
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Вивчай англійську{" "}
              <span className="text-blue-500">з задоволенням</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Інтерактивна платформа для дітей та дорослих. Домашні завдання, оцінки, зворотній зв&apos;язок — все в одному місці.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8 h-12 text-base">
                  Спробувати платформу
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-8 h-12 text-base">
                  Увійти до кабінету
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "500+", label: "Учнів" },
              { value: "12-бальна", label: "Система оцінювання" },
              { value: "50+", label: "Завдань на місяць" },
              { value: "100%", label: "Задоволених учнів" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeIn} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-4xl font-bold text-gray-900 mb-4">Чому обирають Fluently?</motion.h2>
            <motion.p variants={fadeIn} className="text-gray-600 text-lg max-w-2xl mx-auto">
              Платформа розроблена спеціально для українських учнів та вчителів
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: BookOpen, title: "Зручні домашні завдання", desc: "Вчитель створює завдання, учні здають роботи онлайн. Без паперів та проблем." },
              { icon: Award, title: "12-бальна система", desc: "Оцінки за звичною українською шкалою від 1 до 12. Детальний зворотній зв'язок." },
              { icon: Users, title: "Групи та класи", desc: "Окремі групи для різних класів. Кожна група має свій список учнів та завдань." },
              { icon: Clock, title: "Контроль дедлайнів", desc: "Календар з усіма термінами. Учні та вчитель бачать всі важливі дати." },
              { icon: CheckCircle, title: "Статус виконання", desc: "Чітко видно: не здано / здано / оцінено / прострочено. Ніякої плутанини." },
              { icon: MessageCircle, title: "Зворотній зв'язок", desc: "Вчитель залишає коментарі до кожної роботи. Учні отримують персональні поради." },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="bg-blue-50 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeIn} className="text-4xl font-bold text-gray-900 mb-4">Як це працює</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                <span className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm mr-2">Вчитель</span>
              </h3>
              {[
                { step: "01", title: "Створює групи", desc: "Окрема група для кожного класу з кодом для приєднання" },
                { step: "02", title: "Додає учнів", desc: "Вручну або через код — учні легко приєднуються" },
                { step: "03", title: "Призначає завдання", desc: "Для всієї групи, кількох груп або окремих учнів" },
                { step: "04", title: "Перевіряє та оцінює", desc: "Переглядає роботи, ставить оцінки, залишає коментарі" },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeIn} className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                <span className="bg-green-500 text-white rounded-lg px-3 py-1 text-sm mr-2">Учень</span>
              </h3>
              {[
                { step: "01", title: "Реєструється", desc: "Створює акаунт з ім'ям, псевдонімом та паролем" },
                { step: "02", title: "Приєднується до групи", desc: "Вводить код від вчителя і одразу бачить завдання" },
                { step: "03", title: "Виконує завдання", desc: "Здає текст, фото або файли до дедлайну" },
                { step: "04", title: "Отримує оцінку", desc: "Бачить оцінку та коментар вчителя в особистому кабінеті" },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeIn} className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeIn} className="text-4xl font-bold text-gray-900 mb-4">Що кажуть наші учні</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Марія К.", role: "Учениця, 10 клас", text: "Нарешті зручна платформа! Бачу всі завдання і оцінки в одному місці. Більше не треба шукати в чатах." },
              { name: "Олексій Т.", role: "Учень, дорослий курс", text: "Дуже зручно, що вчитель може залишати детальні коментарі. Завжди знаю, що покращити." },
              { name: "Анна М.", role: "Учениця, 8 клас", text: "Подобається, що видно статус завдання — здано, оцінено або не здано. Не можна нічого пропустити!" },
            ].map((t) => (
              <motion.div key={t.name} variants={fadeIn} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-700 mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500 to-blue-600">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto text-center text-white">
          <motion.h2 variants={fadeIn} className="text-4xl font-bold mb-4">Готові почати?</motion.h2>
          <motion.p variants={fadeIn} className="text-blue-100 text-lg mb-8">Приєднуйтесь до платформи вже сьогодні</motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-8 h-12">
                Зареєструватися
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl px-8 h-12">
                Увійти
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Fluently</span>
          </div>
          <div className="text-sm">© 2024 Fluently. Всі права захищені.</div>
          <div className="flex gap-6 text-sm">
            <a href="mailto:contact@fluently.ua" className="hover:text-white transition-colors">contact@fluently.ua</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
