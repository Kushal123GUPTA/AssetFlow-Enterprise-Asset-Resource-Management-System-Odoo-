# notifications module

## Module purpose

In-app notifications and activity log presentation.

## Owned screens

- NotificationsPage

## Allowed responsibilities

- Notification list/item/filters
- Activity log table

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Notification IDs
- Actor/entity IDs as references

## Things it must not implement

- Business workflows that generate domain side effects beyond read/ack
- Feature widgets for other modules
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 4

## Current status

scaffold only
