# EIMS Migration Context

## Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma ORM + SQLite (dev) → Neon PostgreSQL (prod)
- NextAuth v5 Credentials
- shadcn/ui (sidebar-08, login-04, signup-04)

## Current Status
- Auth: ✅ working
- Sidebar layout: ✅ done  
- Module pages: ✅ exist but NOT role-protected
- RBAC: ❌ not implemented yet

## Next Task
Implement RBAC — see /docs/plan.md

## Roles
SUPERUSER, ADMIN, SECRETARY, LABTECH, SUPPLY, DEAN, STAFF

## Key Files
- src/lib/permissions.ts (to be created)
- src/components/layout/app-sidebar.tsx
- src/auth.ts
- prisma/schema.prisma