import { PrismaClient, Role, SubmissionStatus, SubmissionType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  await prisma.grade.deleteMany()
  await prisma.submissionAttachment.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.assignmentAttachment.deleteMany()
  await prisma.assignmentStudent.deleteMany()
  await prisma.assignmentGroup.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.groupMembership.deleteMany()
  await prisma.group.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  const teacherPassword = await bcrypt.hash("teacher123", 12)
  const teacher = await prisma.user.create({
    data: {
      email: "teacher@fluently.ua",
      password: teacherPassword,
      name: "Олена Коваленко",
      nickname: "ms_kovalenko",
      role: Role.TEACHER,
    },
  })

  const studentPassword = await bcrypt.hash("student123", 12)
  const students = await Promise.all([
    prisma.user.create({ data: { email: "mykola@example.com", password: studentPassword, name: "Микола Бондаренко", nickname: "mykola_b", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "oksana@example.com", password: studentPassword, name: "Оксана Мельник", nickname: "oksana_m", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "ivan@example.com", password: studentPassword, name: "Іван Шевченко", nickname: "ivan_sh", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "sofia@example.com", password: studentPassword, name: "Софія Петренко", nickname: "sofia_p", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "andriy@example.com", password: studentPassword, name: "Андрій Коваль", nickname: "andriy_k", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "daryna@example.com", password: studentPassword, name: "Дарина Іванченко", nickname: "daryna_i", role: Role.STUDENT } }),
    prisma.user.create({ data: { email: "maksym@example.com", password: studentPassword, name: "Максим Ткач", nickname: "maksym_t", role: Role.STUDENT } }),
  ])

  const group1 = await prisma.group.create({ data: { name: "Англійська для початківців", description: "Група для тих, хто тільки починає вивчати англійську мову", joinCode: "BEGIN-2024", teacherId: teacher.id } })
  const group2 = await prisma.group.create({ data: { name: "Підготовка до ЗНО", description: "Підготовка до зовнішнього незалежного оцінювання з англійської мови", joinCode: "ZNO-PREP", teacherId: teacher.id } })
  const group3 = await prisma.group.create({ data: { name: "Розмовний клуб", description: "Розвиток розмовних навичок та вдосконалення вимови", joinCode: "SPEAKING", teacherId: teacher.id } })

  await Promise.all([
    prisma.groupMembership.create({ data: { userId: students[0].id, groupId: group1.id } }),
    prisma.groupMembership.create({ data: { userId: students[1].id, groupId: group1.id } }),
    prisma.groupMembership.create({ data: { userId: students[2].id, groupId: group1.id } }),
    prisma.groupMembership.create({ data: { userId: students[3].id, groupId: group2.id } }),
    prisma.groupMembership.create({ data: { userId: students[4].id, groupId: group2.id } }),
    prisma.groupMembership.create({ data: { userId: students[5].id, groupId: group3.id } }),
    prisma.groupMembership.create({ data: { userId: students[6].id, groupId: group3.id } }),
    prisma.groupMembership.create({ data: { userId: students[0].id, groupId: group3.id } }),
  ])

  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const assignment1 = await prisma.assignment.create({ data: { title: "Введення в Present Simple", description: "Вивчіть правила використання Present Simple та виконайте вправи 1-5 на сторінці 23 підручника. Напишіть 5 речень про ваш типовий день.", dueDate: nextWeek, maxGrade: 12, submissionType: SubmissionType.MIXED, teacherId: teacher.id } })
  const assignment2 = await prisma.assignment.create({ data: { title: "Читання та розуміння тексту", description: "Прочитайте текст 'A Day in London' та дайте відповіді на запитання 1-10. Поясніть значення виділених слів.", dueDate: yesterday, maxGrade: 12, submissionType: SubmissionType.TEXT, teacherId: teacher.id } })
  const assignment3 = await prisma.assignment.create({ data: { title: "Граматика: Past Simple vs Past Continuous", description: "Виконайте граматичні вправи з підручника. Сторінки 45-47, вправи 2, 4, 6.", dueDate: nextWeek, maxGrade: 12, submissionType: SubmissionType.MIXED, teacherId: teacher.id } })
  const assignment4 = await prisma.assignment.create({ data: { title: "Listening: BBC News Report", description: "Послухайте аудіозапис та заповніть пропуски. Дайте відповіді на питання розуміння.", dueDate: nextWeek, maxGrade: 10, submissionType: SubmissionType.TEXT, teacherId: teacher.id } })
  const assignment5 = await prisma.assignment.create({ data: { title: "Есе: My Dream Career", description: "Напишіть есе на тему 'My Dream Career' (200-250 слів). Використовуйте складні граматичні структури.", dueDate: twoWeeksAgo, maxGrade: 12, submissionType: SubmissionType.TEXT, teacherId: teacher.id } })

  await Promise.all([
    prisma.assignmentGroup.create({ data: { assignmentId: assignment1.id, groupId: group1.id } }),
    prisma.assignmentGroup.create({ data: { assignmentId: assignment2.id, groupId: group1.id } }),
    prisma.assignmentGroup.create({ data: { assignmentId: assignment3.id, groupId: group2.id } }),
    prisma.assignmentGroup.create({ data: { assignmentId: assignment4.id, groupId: group2.id } }),
    prisma.assignmentGroup.create({ data: { assignmentId: assignment5.id, groupId: group3.id } }),
    prisma.assignmentGroup.create({ data: { assignmentId: assignment5.id, groupId: group2.id } }),
  ])

  const sub1 = await prisma.submission.create({ data: { assignmentId: assignment1.id, studentId: students[0].id, textContent: "I wake up at 7 o'clock every day. I have breakfast and drink tea. Then I go to school by bus. I study English, Math and History. After school I do my homework.", status: SubmissionStatus.GRADED, isLate: false } })
  const sub2 = await prisma.submission.create({ data: { assignmentId: assignment1.id, studentId: students[1].id, textContent: "Every day I get up at 6:30. I always eat porridge for breakfast. I go to school by foot because I live near.", status: SubmissionStatus.SUBMITTED, isLate: false } })
  const sub3 = await prisma.submission.create({ data: { assignmentId: assignment2.id, studentId: students[0].id, textContent: "1. London is the capital of Great Britain. 2. The Thames river flows through London. 3. Big Ben is a famous clock tower.", status: SubmissionStatus.GRADED, isLate: true } })
  const sub4 = await prisma.submission.create({ data: { assignmentId: assignment5.id, studentId: students[5].id, textContent: "My dream career is to become a doctor. I want to help people and save lives. Medicine is a noble profession that requires dedication.", status: SubmissionStatus.GRADED, isLate: false } })

  await Promise.all([
    prisma.grade.create({ data: { submissionId: sub1.id, score: 10, feedback: "Добрий опис! Гарне використання Present Simple. Зверни увагу на артиклі.", teacherId: teacher.id } }),
    prisma.grade.create({ data: { submissionId: sub3.id, score: 8, feedback: "Непогано, але відповіді могли бути більш детальними. Здано із запізненням.", teacherId: teacher.id } }),
    prisma.grade.create({ data: { submissionId: sub4.id, score: 12, feedback: "Чудове есе! Відмінна структура, багата лексика, правильна граматика. Молодець!", teacherId: teacher.id } }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log("👩‍🏫 Teacher: teacher@fluently.ua / teacher123")
  console.log("👨‍🎓 Students: mykola@example.com, oksana@example.com / student123")
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
