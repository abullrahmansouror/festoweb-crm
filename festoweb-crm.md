# Festoweb CRM — Full Project Context for Claude AI

> **Purpose of this file:** Hand this document to Claude AI at the start of any session so it has complete context about the Festoweb CRM project — architecture, design system, pages, tech stack, known bugs, and rules. Claude should read this before making any edits or suggestions.

---

## 1. Project Overview

**Festoweb CRM** is a private, full-stack CRM (Customer Relationship Management) web application built for a digital agency. It manages clients, invoices, projects, subscriptions, and financial reporting — all in one dark-themed dashboard.

- **Live URL:** https://festoweb-crm.vercel.app
- **GitHub Repo:** https://github.com/Abullrahmansouror/festoweb-crm (private)
- **Owner:** Abdulrhman (Abullrahmansouror)
- **Deployment:** Vercel (auto-deploys on every push to `main`)
- **Database:** Supabase (PostgreSQL + Auth + RLS)

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.1.0 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS + inline React styles | ^3.4.0 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.39.0 |
| Auth | Supabase SSR Auth | @supabase/ssr ^0.1.0 |
| State | React useState / useEffect / useMemo | React ^18 |
| Server State | TanStack React Query | ^5.17.0 |
| Tables | TanStack React Table | ^8.11.0 |
| Forms | React Hook Form + Zod | ^7.49.0 / ^3.22.0 |
| Charts | Recharts (+ custom SVG BarChart) | ^2.10.0 |
| Drag & Drop | @hello-pangea/dnd | ^16.3.0 |
| PDF Export | jsPDF + jspdf-autotable | ^2.5.1 |
| Date Utils | date-fns | ^3.2.0 |
| Icons | lucide-react | ^0.309.0 |
| Utilities | clsx, tailwind-merge | ^2.1.0 / ^2.2.0 |

---

## 3. Project File Structure

```
festoweb-crm/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout (wraps CurrencyProvider)
│   │   ├── page.tsx                    ← Root redirect → /dashboard
│   │   ├── globals.css                 ← Global base styles
│   │   ├── icon.svg                    ← Favicon (SVG lightning bolt)
│   │   └── dashboard/
│   │       ├── layout.tsx              ← Dashboard shell (sidebar + top bar)
│   │       ├── page.tsx                ← Dashboard home (KPI cards + charts)
│   │       ├── clients/
│   │       │   ├── page.tsx            ← Clients list
│   │       │   └── [id]/page.tsx       ← Client detail view
│   │       ├── finance/
│   │       │   └── page.tsx            ← Finance (income + expense invoices)
│   │       ├── invoices/
│   │       │   └── page.tsx            ← Invoice list view
│   │       ├── pipeline/
│   │       │   └── page.tsx            ← Kanban pipeline (drag-and-drop)
│   │       ├── projects/
│   │       │   └── page.tsx            ← Projects list
│   │       ├── reports/
│   │       │   └── page.tsx            ← Reports + analytics
│   │       ├── subscriptions/
│   │       │   └── page.tsx            ← Subscription tracker
│   │       ├── expenses/
│   │       │   └── page.tsx            ← Expense tracking
│   │       └── settings/
│   │           └── page.tsx            ← Settings page
│   ├── components/                     ← Shared UI components
│   ├── lib/
│   │   ├── currency-context.tsx        ← Global currency state + conversion
│   │   ├── pdf.ts                      ← PDF generation logic (jsPDF)
│   │   ├── utils.ts                    ← Utility helpers (cn, formatters)
│   │   └── supabase/
│   │       ├── client.ts               ← Browser Supabase client
│   │       └── server.ts               ← Server Supabase client
│   └── types/                          ← TypeScript interfaces
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 4. Design System

### 4.1 Color Palette (Dark Theme)

The entire app uses a **dark theme**. All pages use inline React styles with these exact colors:

| Token | Value | Usage |
|---|---|---|
| `--bg-main` | `#111111` | Page background |
| `--bg-card` | `#1a1a1a` | Card/panel background |
| `--bg-hover` | `#222222` | Hover state on rows/links |
| `--border` | `#252525` | Card border |
| `--border-2` | `#2e2e2e` | Subtle dividers |
| `--text-primary` | `#f1f1f1` | Headings, main text |
| `--text-secondary` | `#e0e0e0` | Body text |
| `--text-muted` | `#777777` | Subtext, placeholders |
| `--text-faint` | `#555555` | Tertiary labels |
| `--accent-purple` | `#6366f1` | Primary links, active states |
| `--accent-green` | `#10b981` | Revenue, success, income |
| `--accent-red` | `#ef4444` | Expenses, errors, danger |
| `--accent-yellow` | `#f59e0b` | Warnings, outstanding |
| `--accent-blue` | `#60a5fa` | Projects, info |
| `--accent-purple-light` | `#c084fc` | Clients, tags |
| `--accent-indigo-muted` | `#818cf8` | Avatar initials, highlights |

### 4.2 Typography

- **Font:** System default (no external font loaded currently)
- **Page titles:** `fontSize: 22, fontWeight: 700, color: '#f1f1f1'`
- **Section headers:** `fontSize: 13, fontWeight: 600, color: '#e0e0e0'`
- **KPI labels:** `fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#888'`
- **KPI values:** `fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#f1f1f1'`
- **Body / table text:** `fontSize: 13, color: '#e0e0e0'`
- **Muted / sub labels:** `fontSize: 12, color: '#666'`
- **Tiny labels:** `fontSize: 11, color: '#555'`

### 4.3 Card Style (Reusable Pattern)

Every panel/card uses this base style:

```tsx
const card: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #252525',
  borderRadius: 14,
  padding: '18px 20px',
};
```

### 4.4 KPI Card Rules (Dashboard)

- **Grid:** `repeat(4, 1fr)` — always 4 per row, never auto-fill
- **Min height:** `110px` on every KPI card
- **Label row height:** Fixed `22px` to keep icon always aligned
- **No text wrapping:** All labels use `whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'`
- **Label names:** Keep them SHORT to avoid wrapping — e.g. "Outstanding" not "Outstanding Invoices"

### 4.5 Border Radius Scale

| Size | Value |
|---|---|
| Small | `6–8px` |
| Medium (cards) | `14px` |
| Full (pills/badges) | `999px` |
| Avatars | `50%` |

### 4.6 Accent Badge Pattern

Icon badges on KPI cards and status indicators use:

```tsx
background: accent + '1a',  // 10% opacity of accent color
color: accent,
padding: '5px 6px',
borderRadius: 8,
```

---

## 5. Supabase Database Tables

### `clients`
| Column | Type |
|---|---|
| id | uuid (PK) |
| full_name | text |
| company_name | text |
| email | text |
| phone | text |
| created_at | timestamptz |

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| invoice_number | text | |
| client_id | uuid (FK → clients) | |
| type | text | `'income'` or `'expense'` |
| status | text | `'Draft'`, `'Sent'`, `'Paid'`, `'Overdue'`, `'paid'`, `'unpaid'` |
| amount | numeric | Raw amount |
| total | numeric | Final total (use this first, fallback to `amount`) |
| currency | text | `'SAR'`, `'MAD'`, etc. |
| date | date | Invoice date |
| due_date | date | Payment due date |
| description | text | |
| tax_rate | numeric | Optional |
| note | text | Optional |
| client_email | text | Optional |
| client_phone | text | Optional |
| created_at | timestamptz | |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| client_id | uuid (FK → clients) | |
| status | text | `'active'`, `'in_progress'`, `'completed'`, `'won'` |
| deadline | date | |
| created_at | timestamptz | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | Service name |
| cost | numeric | Amount |
| currency | text | |
| billing_cycle | text | `'monthly'`, `'yearly'` |
| renewal_date | date | |
| category | text | |
| created_at | timestamptz | |

---

## 6. Currency System (`src/lib/currency-context.tsx`)

The entire app wraps in `<CurrencyProvider>`. Every page must use `useCurrency()`.

```tsx
const { fmt, convert, currency, rates, ratesLoading, ratesError, refreshRates } = useCurrency();
```

| Function | Usage |
|---|---|
| `currency` | Current active currency string, e.g. `'SAR'` |
| `convert(amount, fromCurrency)` | Converts any amount to the active display currency |
| `fmt(amount)` | Formats a number as currency string with symbol |
| `rates` | Live exchange rate object |
| `refreshRates()` | Manually refresh exchange rates |

**Important rules:**
- Always use `i.total ?? i.amount` when reading invoice values (not just `amount`)
- Always pass `i.currency` to `convert()` — never assume SAR
- Never create a local `fetchRates` function in a page — use the global context

---

## 7. PDF Export (`src/lib/pdf.ts`)

Invoice PDFs are generated via `jsPDF`. The export function is in `src/lib/pdf.ts`. It produces a styled dark-branded invoice PDF. The function signature is:

```ts
export function generateInvoicePDF(invoice: Invoice, agencySettings?: AgencySettings): void
```

---

## 8. Navigation Structure (Sidebar)

The sidebar is in `src/app/dashboard/layout.tsx`. These are the current nav items:

| Label | Route | Icon |
|---|---|---|
| Dashboard | `/dashboard` | LayoutDashboard |
| Clients | `/dashboard/clients` | Users |
| Pipeline | `/dashboard/pipeline` | TrendingUp |
| Finance | `/dashboard/finance` | DollarSign |
| Subscriptions | `/dashboard/subscriptions` | CreditCard |
| Reports | `/dashboard/reports` | BarChart2 |
| Settings | `/dashboard/settings` | Settings |

---

## 9. Known Bugs & Pending Fixes

### 🔴 High Priority

1. **`currency-context.tsx` — MAD conversion inverted**
   - `rates['MAD']` stores `1 MAD = X SAR`, so converting SAR → MAD should be `sarAmount / rates['MAD']`, not `sarAmount * (1 / rates['MAD'])`

2. **`settings/page.tsx` — Save does nothing**
   - `handleSave()` only sets a UI flag, never persists data to Supabase or localStorage
   - Fix: save to `localStorage` at minimum, or create a `settings` Supabase table

### 🟡 Medium Priority

3. **`currency-context.tsx` — `fmt()` decimal bug**
   - When `decimals = 0` is passed, `maximumFractionDigits` still falls back to `2`
   - Fix: `maximumFractionDigits: decimals` (use the value directly)

4. **`SubscriptionsPage.tsx` — Duplicate exchange rate fetcher**
   - Has its own local `fetchRates()` running independently from the global `CurrencyProvider`
   - Fix: remove local rate logic and use `useCurrency()` hook instead

5. **`finance/invoice-modal.tsx` — Excessive `as any` casts**
   - Nearly every invoice field is accessed with `(invoice as any)?.field`
   - Fix: update the `Invoice` TypeScript interface in `src/types` to include all fields

### 🟢 Low Priority

6. **`SubscriptionsPage.tsx` — `load()` missing `useCallback`**
   - `load` is called in `useEffect([])` without being wrapped in `useCallback`, causing stale closure warnings
   - Fix: wrap in `useCallback` and add to `useEffect` deps array

---

## 10. Design Rules — Things Claude Must Follow

When editing any file in this project, always follow these rules:

1. **Dark theme only** — never introduce light backgrounds. Background is always `#111` or `#1a1a1a`
2. **Inline React styles** — most styling is done with inline style objects, not Tailwind classes. Match the existing pattern in each file
3. **No external color changes** — do not change existing accent colors unless asked
4. **`repeat(4, 1fr)` for KPI grids** — never use `auto-fill` or `auto-fit` for KPI card rows
5. **Always use `i.total ?? i.amount`** when reading invoice monetary values
6. **Always use `convert(value, currency)`** from `useCurrency()` — never manually multiply exchange rates
7. **No `as any` casts** — when fixing or adding features, extend the TypeScript types properly
8. **`borderRadius: 14`** for all cards — do not change this
9. **Keep labels short** — any label displayed in a KPI card must fit on one line (max ~18 characters)
10. **Supabase client** — always import from `'@/lib/supabase/client'` for client components

---

## 11. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are defined in `.env.local` (not committed to git, see `.env.local.example`).

---

## 12. Deployment

- **Platform:** Vercel
- **Trigger:** Every push to `main` branch auto-deploys
- **Build command:** `next build`
- **Output directory:** `.next`
- **Env vars** must be set in the Vercel dashboard under Project Settings → Environment Variables

---

## 13. How to Start a Session with Claude

Paste the following prompt at the beginning of your Claude session, then attach this file:

```
You are helping me continue development of Festoweb CRM, a private Next.js 14 CRM app.
I've attached a full context document (festoweb-crm-context.md) with the entire project architecture,
design system, tech stack, database schema, known bugs, and design rules.

Please read it fully before making any suggestions or edits.
Always follow the design rules in Section 10.
When I ask you to fix something, check Section 9 (Known Bugs) first.
```

---

## 14. Useful Commands

```bash
# Run locally
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Push to GitHub (triggers Vercel deploy)
git add .
git commit -m "your message"
git push origin main
```

---

*Last updated: May 25, 2026 — Generated from live GitHub repo state*
