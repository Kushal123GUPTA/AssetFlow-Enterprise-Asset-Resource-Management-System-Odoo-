# reports module

## Module purpose

Analytics charts and export actions for utilization and operations.

## Owned screens

- ReportsPage

## Allowed responsibilities

- Read-only charts and summaries
- Export action UI

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Aggregated report payloads from APIs
- Department/asset IDs as dimensions

## Things it must not implement

- Mutating asset/allocation state
- Owning transactional workflows
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 4

## Current status

scaffold only
