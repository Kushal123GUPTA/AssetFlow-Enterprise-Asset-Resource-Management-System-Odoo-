# auth module

## Module purpose

Authentication: login, signup, and password recovery flows.

## Owned screens

- LoginPage
- SignupPage
- ForgotPasswordPage

## Allowed responsibilities

- Auth forms and auth-only UI shells
- Auth session client helpers
- Auth-specific types and constants

## Files that belong in the module

- `components/`
- `pages/`
- `hooks/`
- `services/`
- `types/`
- `constants/`
- `index.ts`

## External IDs / data it may consume

- User IDs from session
- Role constants from shared

## Things it must not implement

- Organization setup UI
- Asset or allocation workflows
- Elevated role self-assignment
- Direct imports from other feature modules
- Feature-specific code placed into `shared/`

## Developer owner

Developer 1

## Current status

scaffold only
