# allocation module

## Module purpose

Asset allocation, transfer, return, and conflict awareness.

## Owned screens

- AllocationTransferPage

## Allowed responsibilities

- Allocation and transfer forms
- Return flows and allocation history
- Conflict alerts for double-allocation prevention

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
- Employee/department IDs
- Allocation status constants

## Things it must not implement

- Asset master registration UI
- Booking overlap logic
- Direct imports from other feature modules
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 2

## Current status

scaffold only
