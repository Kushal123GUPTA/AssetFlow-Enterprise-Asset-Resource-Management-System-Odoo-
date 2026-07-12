# audit module

## Module purpose

Audit cycles, asset checklists, verification, and discrepancy reporting.

## Owned screens

- AuditPage
- AuditDetailsPage

## Allowed responsibilities

- Audit cycle forms and lists
- Verification forms and discrepancy reports

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Asset IDs
- Audit verification status constants

## Things it must not implement

- Unlock closed audit cycles in UI without domain rules
- Asset CRUD
- Direct feature-module imports
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 4

## Current status

scaffold only
