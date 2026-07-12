# Contributing to AssetFlow

## Branch naming

```
feature/<devN>-<module>-<short-desc>
fix/<devN>-<module>-<short-desc>
chore/<area>-<short-desc>
```

Examples: `feature/dev2-assets-register`, `fix/dev3-booking-overlap`.

## Commit naming

Use concise, imperative subjects focused on why:

```
add asset directory table scaffold
fix allocation status constant usage
update shared StatusBadge placeholder
```

Avoid noisy commits that mix unrelated modules.

## Pull requests

- One module ownership area per PR when possible.
- Describe scope, owner, and any shared/integrator touchpoints.
- Link related issues/tasks.
- Request review from the module owner and integrator if shared files change.

## Module ownership

| Developer | Modules |
|-----------|---------|
| Dev 1 | auth, organization |
| Dev 2 | assets, allocation |
| Dev 3 | booking, maintenance |
| Dev 4 | dashboard, audit, reports, notifications |

Work only in owned folders under `src/app/modules/` and matching `src/app/api/modules/`.

## Protected shared files

Require integrator approval before changing:

- `src/app/shared/**`
- `src/app/providers/**`, `src/app/guards/**`, `src/app/routes/**`
- Root layouts/routing wiring under `src/app/`
- `package.json`, lockfiles
- `.cursor/**`
- `CODEOWNERS`, architecture docs

## Smallest-diff principle

- Change only what the task requires.
- Do not rewrite whole files for small edits.
- Do not invent speculative features or mock data.

## No unrelated formatting

- Do not reformat files you are not editing for the task.
- Do not reorder unrelated imports.
- Do not rename symbols or move files without explicit agreement.

## No direct commits to main

- Branch → PR → review → merge.
- Never push feature work straight to `main`.

## Before merge

Run locally:

```bash
npm run lint
npm run build
```

Add/run tests when the project has module tests for the area you changed.
