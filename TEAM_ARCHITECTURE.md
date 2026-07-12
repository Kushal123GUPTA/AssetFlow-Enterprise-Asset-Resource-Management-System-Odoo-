# AssetFlow — Team Architecture

AssetFlow is an Enterprise Asset & Resource Management System. This document is the permanent team map for a 4-developer workflow.

## Stack (do not replace)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js App Router (`src/app`), React, TypeScript |
| UI | Ant Design + Tailwind CSS |
| State | Zustand |
| Auth | NextAuth |
| Data | Drizzle ORM + PostgreSQL |
| Package manager | npm |
| Path alias | `@/*` → `./src/*` |

## 1. Project module map

```
src/app/
├── routes/                 # Route path helpers (scaffold)
├── providers/              # App-level provider exports (scaffold)
├── guards/                 # Auth/route guards (scaffold)
├── modules/                # Feature UI modules
│   ├── auth/
│   ├── dashboard/
│   ├── organization/
│   ├── assets/
│   ├── allocation/
│   ├── booking/
│   ├── maintenance/
│   ├── audit/
│   ├── reports/
│   └── notifications/
├── shared/                 # Domain-neutral UI + utilities
└── api/modules/            # Backend API modules (Next.js)
    ├── auth/
    ├── organization/
    ├── assets/
    ├── allocation/
    ├── booking/
    ├── maintenance/
    ├── audit/
    ├── reports/
    └── notifications/
```

Each frontend module contains: `components/`, `pages/`, `hooks/`, `services/`, `types/`, `constants/`, `index.ts`, `README.md`.

Each API module contains: `controllers/`, `services/`, `repositories/`, `routes/`, `validators/`, `dto/`, `types/`, `index.ts`.

## 2. Developer ownership map

| Developer | Owns |
|-----------|------|
| Developer 1 | auth, organization |
| Developer 2 | assets, allocation |
| Developer 3 | booking, maintenance |
| Developer 4 | dashboard, audit, reports, notifications |
| Integrator | `src/app/shared/`, `src/app/providers/`, `src/app/guards/`, `src/app/routes/`, root config, package files |

## 3. Folder responsibilities

| Folder | Responsibility |
|--------|----------------|
| `modules/<feature>/pages` | Compose feature screens from components |
| `modules/<feature>/components` | Feature-specific UI only |
| `modules/<feature>/services` | Feature API client calls |
| `modules/<feature>/types` | Feature domain types |
| `shared/` | Generic reusable UI, layouts, hooks, apiClient, domain constants |
| `api/modules/<feature>/` | Server controllers, services, repositories, validators, DTOs |
| `app/(routes)` | Next.js file-based routes (pages/layouts) — integrator-owned wiring |

## 4. Import boundary rules

- A module may import from **itself** and **`shared`** only.
- Never import another feature module directly.
- Cross-module needs use IDs, API contracts, events, or shared neutral types.
- Circular dependencies are forbidden.

## 5. Shared-folder rules

- Shared may contain only domain-neutral building blocks useful to ≥2 modules.
- Feature widgets (AssetCard, BookingCalendar, MaintenanceKanban, etc.) stay in their module.
- Changes to shared require integrator review.

## 6. Branch recommendations

```
main
 └── develop
      ├── feature/dev1-auth-login
      ├── feature/dev2-assets-register
      ├── feature/dev3-booking-calendar
      └── feature/dev4-dashboard-kpis
```

- Branch from `develop` (or `main` if `develop` is not yet used).
- One feature (or tightly related pair within ownership) per branch.
- Never commit directly to `main`.

## 7. Merge-conflict prevention rules

- Stay inside owned module folders.
- Do not reformat unrelated files or reorder unrelated imports.
- Do not rename or move files without agreement.
- Touch shared/routing/package files only with integrator approval.
- Prefer smallest possible diffs.
- Rebase/merge often from the integration branch.

## 8. Starting a new Cursor task

1. State which developer you are and which module(s) you own.
2. Ask Cursor to inspect the existing module before generating files.
3. Limit scope to owned folders.
4. Reuse shared components instead of inventing duplicates.
5. Follow `.cursor/rules/` and this document.
6. Do not implement outside the requested scope.

Example prompt:

> I am Developer 2 working in `src/app/modules/assets`. Add a placeholder for AssetHistory only. Do not touch shared or other modules.

## 9. Checklist before committing

- [ ] Changes are inside owned modules (or integrator-approved shared/config).
- [ ] No cross-module imports.
- [ ] No unrelated formatting or import churn.
- [ ] Domain statuses/roles use shared constants (no hardcoded lowercase variants).
- [ ] Lint passes (`npm run lint`).
- [ ] Build passes when relevant (`npm run build`).
- [ ] PR describes module scope and ownership.

## Current status

Architecture scaffold only. Placeholders return `null` / empty exports. No full UI, business logic, or API implementations are implied by this structure.
