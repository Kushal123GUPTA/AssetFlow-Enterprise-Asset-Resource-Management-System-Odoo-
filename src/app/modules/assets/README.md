# assets module

## Module purpose

Asset directory, registration, details, documents, and history.

## Owned screens

- AssetDirectoryPage
- RegisterAssetPage
- AssetDetailsPage

## Allowed responsibilities

- Asset tables, filters, forms, status badges
- Asset documents and history views

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- Category IDs
- Department IDs
- Asset status constants

## Things it must not implement

- Allocation/transfer workflows
- Booking calendar
- Maintenance kanban
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 2

## Current status

scaffold only
