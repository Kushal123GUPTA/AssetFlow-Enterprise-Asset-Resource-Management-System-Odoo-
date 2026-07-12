# booking module

## Module purpose

Shared resource booking calendar and conflict handling.

## Owned screens

- ResourceBookingPage

## Allowed responsibilities

- Resource selectors
- Booking calendar/list/forms
- Overlap conflict alerts

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Resource/asset IDs
- User IDs
- Booking status constants

## Things it must not implement

- Permanent asset allocation
- Maintenance workflows
- Organization setup
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 3

## Current status

scaffold only
