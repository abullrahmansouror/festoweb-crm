# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

No test suite is configured.

## Architecture

Next.js 14 App Router app. All pages live under `src/app/dashboard/`. The root `page.tsx` redirects to `/dashboard`.

**Layout hierarchy:**
- `src/app/layout.tsx` — wraps everything in `<CurrencyProvider>` and `<Providers>` (React Query)
- `src/app/dashboard/layout.tsx` — renders the sidebar + topbar shell around all dashboard pages

**Key lib files:**
- `src/lib/currency-context.tsx` — global currency state; every page must consume `useCurrency()`
- `src/lib/supabase/client.ts` — browser-side Supabase client (use in Client Components)
- `src/lib/supabase/server.ts` — server-side Supabase client
- `src/lib/pdf.ts` — invoice PDF generation via jsPDF
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) and formatters

**Data flow:** Pages fetch directly from Supabase in `useEffect` or React Query hooks. There is no API route layer — all DB calls go client → Supabase directly. TanStack Table is used for data-grid views; React Hook Form + Zod for forms; @hello-pangea/dnd for the Kanban pipeline.

## Currency System

Every page that displays monetary values must use `useCurrency()`:

```tsx
const { fmt, convert, currency } = useCurrency();
// Always read invoice value as:
const value = convert(invoice.total ?? invoice.amount, invoice.currency ?? 'SAR');
```

- `rates[X]` stores `"1 X = N SAR"` (already inverted from the API)
- Never create a local `fetchRates` function — use `refreshRates` from the context
- Never manually multiply exchange rates — always call `convert(amount, fromCurrency)`

## Database Schema (Supabase)

Key tables: `clients`, `invoices`, `projects`, `subscriptions`.

`invoices.type` is `'income' | 'expense'`. `invoices.status` can be `'Draft' | 'Sent' | 'Paid' | 'Overdue'`. Always read monetary value as `total ?? amount` since both columns exist.

TypeScript types are in `src/types/index.ts`. The `Invoice` interface there is incomplete — many DB fields are missing (e.g. `invoice_number`, `client_id`, `total`). Extend the interface rather than using `as any` casts.

## Design System

**Dark theme only.** All styling uses inline React style objects, not Tailwind classes (Tailwind is used sparingly for layout utilities only).

Core colors:
- Background: `#111111` (page), `#1a1a1a` (cards)
- Text: `#f1f1f1` (primary), `#e0e0e0` (body), `#777777` (muted)
- Accents: `#6366f1` (purple/primary), `#10b981` (green/income), `#ef4444` (red/expense), `#f59e0b` (yellow/warning), `#60a5fa` (blue/projects)

Card base style:
```tsx
{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: 14, padding: '18px 20px' }
```

KPI grid is always `gridTemplateColumns: 'repeat(4, 1fr)'` — never `auto-fill` or `auto-fit`.

Icon badge pattern: `background: accent + '1a'` (10% opacity), same color for the icon.

## Known Bugs

1. **`SubscriptionsPage.tsx`** — has its own local `fetchRates()` duplicating the global `CurrencyProvider`. Remove it and use `useCurrency()`.
2. **`settings/page.tsx`** — `handleSave()` sets UI state only, never persists to Supabase or localStorage.
3. **`finance/invoice-modal.tsx`** — extensive `as any` casts due to incomplete `Invoice` type. Fix by extending `src/types/index.ts`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only
```

Copy `.env.local.example` to `.env.local` and fill in values from your Supabase project.

## Deployment

Vercel — auto-deploys on every push to `main`. Build command: `next build`.
