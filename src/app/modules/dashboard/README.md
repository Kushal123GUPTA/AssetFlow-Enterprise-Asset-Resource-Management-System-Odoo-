# dashboard module

## Module purpose

Operational overview: KPIs, quick actions, alerts, and recent activity.

## Owned screens

- DashboardPage

## Allowed responsibilities

- KPI cards/grids
- Dashboard summaries and activity lists
- Overdue and notification banners scoped to the dashboard

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Aggregate counts via APIs
- Asset/allocation/booking/maintenance IDs as references only

## Things it must not implement

- Own asset CRUD
- Perform allocations or bookings
- Import other feature modules directly
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 4

## Current status

scaffold only
