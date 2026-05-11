# FestoWeb CRM

A modern, full-stack CRM for FestoWeb digital agency — built with Next.js, TypeScript, Tailwind CSS & Supabase.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS (dark mode default)
- **Backend/DB:** Supabase (PostgreSQL + Storage + Auth)
- **Charts:** Recharts
- **PDF:** jsPDF + jsPDF-AutoTable
- **Drag & Drop:** @hello-pangea/dnd
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query

## Modules

1. Dashboard (KPIs + Charts)
2. Client Management
3. Sales Pipeline (Kanban)
4. Project Management
5. Invoice System (PDF export/import)
6. Expense Management
7. Notifications
8. File Vault
9. Communication (WhatsApp + Email)
10. Settings

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Abullrahmansouror/festoweb-crm.git
cd festoweb-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and keys

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (server only) |
