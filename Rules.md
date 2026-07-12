---
## 2. API Routes

- All endpoints defined in the **Zustand store** as a top-level `API` const:
  ```ts
  const API = {
    GET: "/api/module/resource",
    ADD: "/api/module/resource/add",
    UPDATE: "/api/module/resource/update",
    DELETE: "/api/module/resource/delete",
  };
  ```
- All API calls made **only through store methods** — never call fetch/axios directly from components
- Use **axios** for all HTTP calls (no raw `fetch`)

---

## 3. State & Data Flow

- All server state lives in **Zustand stores**
- Components call store methods — stores call APIs — APIs return data back through the store
- No direct API calls or local `useState` for server data in components

---

## 4. UI & Styling

- **Tailwind CSS** for layout, spacing, and utilities
- **Ant Design (antd)** for all interactive components (Table, Form, Modal, Select, Button, etc.)
- Consistent professional theme across the entire project — no one-off inline color overrides
- No mixing of component libraries for the same element type
- **Strictly use Tailwind CSS for all layouts and spacing:** Do NOT use Ant Design's grid system (`Row`, `Col`) or built-in padding/margin properties. Use Tailwind's grid and spacing utility classes instead.
- **Component Sizing:** Do NOT use `size="large"` for Ant Design components. Keep component sizes standard and unified.
- **No Ellipses / Truncating in Tables:** Never use ellipses (`...` or `truncate` class) in tables for critical text like location names, zone names, or MBR/Cluster names. Always use proper text wrapping (`whitespace-normal break-words leading-tight`) to keep the content fully visible and readable for the user.
- **Responsive Design**: All developed pages, views, and custom components must be fully mobile and all-screen responsive. Always design with mobile-first or multi-device layouts in mind, using Tailwind's responsive modifiers (e.g. `sm:`, `md:`, `lg:`) for layouts, grid columns, flex directions, margins, padding, and text sizing.

---
## 5. API Design — POST-Only, Optimised, Minimal API Calls

- **All API endpoints must use `POST` method only** — no GET, PUT, DELETE, or PATCH.
- For reads, the action (`get`, `search`) is encoded in the URL path; any filter/query params are sent in the request body.
- For deletes, the ID is sent in the request body, not via URL segments or query params.
- **Optimisation is mandatory on every endpoint:**
  - Single DB round-trip per endpoint wherever possible.
  - Use `inArray` + Map (never per-row queries) for resolving user names or related records.
  - Use `returning()` on insert/update — never re-fetch the same row.
  - Bulk endpoints must use a single `insert().values([...])` call — never loop inserts.
  - Bulk deduplication must be done in JS before hitting the DB, not via multiple DB calls.
- **Bulk upload is required on every master module** — every master must expose a `/bulk-upload` POST endpoint alongside the standard add/get/update/delete endpoints.
- **Minimum API calls from frontend** — design APIs and Zustand stores so that each user action triggers the fewest possible network calls:
  - Combine related data into one endpoint wherever logical (e.g. a project `get` should return client, members, and status summary in the same response, not three separate calls).
  - On page load, batch all bootstrap data into one or two calls — never fire N calls for N records.
  - For forms that create a parent + children (e.g. Project + Milestones + Tasks), provide a single `/add-full` endpoint that accepts the full object graph and inserts everything in one DB transaction.
  - Avoid polling; prefer loading full state once and updating via local store mutations after write operations.


---
## 6. Code Structure & Component Splitting

- **Avoid large file sizes**: Always split pages into small, focused, reusable sub-components. Do not make a single page code file huge.
- Keep page-level code clean, readable, and structured by moving distinct parts (such as statistics grids, complex forms, large modals, filter bars, etc.) into their own dedicated components.

---