# Fluently — Ukrainian English Tutoring Platform

A premium Ukrainian-language platform for English tutoring. Teachers can manage groups, create assignments, grade on a 12-point scale, and give feedback. Students can join groups, submit homework, and track their progress.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + custom shadcn-style components
- **Prisma ORM** with PostgreSQL
- **NextAuth v4** (email/password authentication)
- **React Hook Form + Zod** for form validation
- **Framer Motion** for animations
- **Recharts** for analytics
- **Sonner** for toast notifications

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/danza0/fluently.git
cd fluently
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` — PostgreSQL connection string (Neon or Supabase recommended for Vercel)
- `NEXTAUTH_URL` — Your app URL (use `http://localhost:3000` for local dev)
- `NEXTAUTH_SECRET` — Random secret string (generate with `openssl rand -base64 32`)

### 4. Set up the database

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 5. Seed the database with demo data

```bash
npx prisma db seed
```

This creates:
- **Teacher account:** `teacher@fluently.ua` / `teacher123`
- **7 demo students** (e.g., `mykola@example.com` / `student123`)
- **3 groups:** "Англійська для початківців", "Підготовка до ЗНО", "Розмовний клуб"
- **5 demo assignments** with submissions and grades

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

### Teacher / Admin
- Login: `teacher@fluently.ua` / `teacher123`
- Dashboard: `/dashboard`
- Create/manage groups with join codes
- Create assignments for specific groups or students
- Grade submissions (0–12 scale) with feedback comments
- View analytics and calendar

### Student
- Register at `/register` or use demo: `mykola@example.com` / `student123`
- Dashboard: `/student`
- Join groups via join code
- Submit homework (text, file)
- View grades and teacher feedback

## Database

Uses PostgreSQL. Recommended providers (Vercel-friendly):
- [Neon](https://neon.tech) (free tier, serverless)
- [Supabase](https://supabase.com) (free tier)

## Deploying to Vercel

1. Push the repo to GitHub
2. Create a new Vercel project and import the repo
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (set to your Vercel domain, e.g. `https://fluently.vercel.app`)
   - `NEXTAUTH_SECRET`
4. Deploy. After first deploy, run the database migration:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

## Project Structure

```
fluently/
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth/         # NextAuth handler
│   │   ├── groups/       # Group CRUD + join/student management
│   │   ├── assignments/  # Assignment CRUD
│   │   ├── submissions/  # Submission + grading
│   │   ├── students/     # Student list
│   │   └── analytics/    # Dashboard stats
│   ├── dashboard/        # Teacher dashboard pages
│   ├── student/          # Student portal pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # UI components (button, card, dialog, etc.)
│   ├── dashboard/        # Sidebar, stats cards
│   ├── assignments/      # Assignment cards, status badges
│   └── groups/           # Group cards
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Demo data seed script
└── middleware.ts         # Route protection (NextAuth)
```
