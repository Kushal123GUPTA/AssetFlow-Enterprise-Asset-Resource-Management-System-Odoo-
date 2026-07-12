# maintenance module

## Module purpose

Maintenance requests, approval-gated work, and technician assignment.

## Owned screens

- MaintenancePage

## Allowed responsibilities

- Request forms
- Kanban/board views
- Technician assignment and history

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
- Technician/user IDs
- Maintenance status constants

## Things it must not implement

- Start work before approval
- Asset registration
- Audit cycle management
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 3

## Current status

scaffold only
