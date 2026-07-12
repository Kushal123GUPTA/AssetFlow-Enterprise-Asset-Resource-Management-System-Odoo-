-- ============================================================================
-- AssetFlow — Enterprise Asset & Resource Management System
-- PostgreSQL Schema (v2 — with soft delete + full audit columns)
-- ============================================================================
-- Design notes:
--   * UUID PKs (gen_random_uuid()) for safe merges, offline inserts, and
--     eventual multi-tenant sharding.
--   * ENUM types for closed state sets (asset status, booking status, etc.)
--     keep storage tight and queries fast.
--
--   AUDIT / SOFT-DELETE CONVENTION
--   -------------------------------
--   Every mutable, user-facing table carries:
--     created_by  UUID REFERENCES employees(id)   -- who inserted the row
--     updated_by  UUID REFERENCES employees(id)   -- who last changed it
--     deleted_at  TIMESTAMPTZ                      -- NULL = active row
--     deleted_by  UUID REFERENCES employees(id)   -- who soft-deleted it
--   created_at/updated_at (already present) track *when*; created_by/
--   updated_by/deleted_by track *who*. Rows are never hard-deleted through
--   the app — application DELETEs should be rewritten as
--   `UPDATE ... SET deleted_at = now(), deleted_by = :employee_id`.
--   `updated_by` cannot be set by a generic trigger (Postgres doesn't know
--   which employee issued the query), so the app must set it explicitly in
--   the same UPDATE statement, e.g.:
--     UPDATE assets SET condition = 'Damaged', updated_by = :employee_id
--     WHERE id = :asset_id;
--   The trigger below only stamps updated_at automatically.
--
--   EXEMPT TABLES: asset_status_history, role_assignment_log, and
--   activity_logs are themselves append-only audit logs — they are never
--   updated or deleted, so they deliberately do NOT carry these columns.
--   audit_cycle_auditors is a lightweight junction table; it gets
--   deleted_at/deleted_by (an auditor can be unassigned) but no
--   created_by/updated_by (assigned_at + assigned_by already cover that).
--
--   All "uniqueness" and "search" constraints/indexes are scoped with
--   `WHERE deleted_at IS NULL` so a soft-deleted row (e.g. a retired asset
--   tag, a deactivated employee email) doesn't block reuse of that value.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- EXCLUDE USING gist on scalar + range
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email column

-- ============================================================================
-- 0. ORGANIZATIONS
-- ============================================================================
-- Root tenant table — created before `employees` exists, so created_by/
-- updated_by/deleted_by are plain UUIDs here (no FK) to avoid a circular
-- dependency. If you need referential integrity here too, add the FK via
-- ALTER TABLE once you have a bootstrap/superadmin employee strategy.

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID,
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID
);

CREATE TYPE user_role AS ENUM ('admin', 'asset_manager', 'department_head', 'employee');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- ============================================================================
-- 1. DEPARTMENTS
-- ============================================================================

CREATE TABLE departments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    parent_department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
    head_employee_id        UUID, -- FK added after employees table exists
    status                  user_status NOT NULL DEFAULT 'active',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID,
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID
);

CREATE INDEX idx_departments_org ON departments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_parent ON departments(parent_department_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_departments_org_name ON departments(organization_id, name) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. EMPLOYEES (users)
-- ============================================================================

CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           CITEXT NOT NULL,          -- case-insensitive login
    password_hash   TEXT NOT NULL,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    role            user_role NOT NULL DEFAULT 'employee', -- only ever changed via role_assignment_log
    status          user_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES employees(id),   -- self-referential (e.g. admin who created the account)
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES employees(id),
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID REFERENCES employees(id)
);

CREATE INDEX idx_employees_org ON employees(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_role ON employees(role) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_employees_org_email ON employees(organization_id, email) WHERE deleted_at IS NULL;

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head
    FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_created_by FOREIGN KEY (created_by) REFERENCES employees(id),
    ADD CONSTRAINT fk_departments_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id),
    ADD CONSTRAINT fk_departments_deleted_by FOREIGN KEY (deleted_by) REFERENCES employees(id);

-- Every role promotion (Employee -> Dept Head / Asset Manager) is logged here.
-- Immutable audit log: no soft delete, no updated_by — a role change is a
-- historical fact and is never itself edited or removed.
CREATE TABLE role_assignment_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    old_role        user_role NOT NULL,
    new_role        user_role NOT NULL,
    changed_by      UUID NOT NULL REFERENCES employees(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_log_employee ON role_assignment_log(employee_id);

-- ============================================================================
-- 3. ASSET CATEGORIES
-- ============================================================================

CREATE TABLE asset_categories (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    parent_category_id      UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    custom_fields_schema    JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"warranty_period_months": "number"}
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES employees(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES employees(id),
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID REFERENCES employees(id)
);

CREATE INDEX idx_categories_org ON asset_categories(organization_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_categories_org_name ON asset_categories(organization_id, name) WHERE deleted_at IS NULL;

-- ============================================================================
-- 4. ASSETS
-- ============================================================================

CREATE TYPE asset_status AS ENUM (
    'available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed'
);

CREATE TABLE assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_tag           TEXT NOT NULL,             -- e.g. AF-0001, generated app-side/sequence
    name                TEXT NOT NULL,
    category_id         UUID NOT NULL REFERENCES asset_categories(id),
    serial_number       TEXT,
    qr_code             TEXT,
    acquisition_date    DATE,
    acquisition_cost    NUMERIC(14,2),             -- reporting/ranking only, no accounting linkage
    condition           TEXT,
    location            TEXT,
    department_id       UUID REFERENCES departments(id) ON DELETE SET NULL, -- "home" department
    is_bookable         BOOLEAN NOT NULL DEFAULT false,
    status              asset_status NOT NULL DEFAULT 'available',
    custom_fields       JSONB NOT NULL DEFAULT '{}'::jsonb, -- values matching category.custom_fields_schema
    photo_url           TEXT,
    documents           JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {name,url}
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES employees(id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES employees(id),
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES employees(id)
);

CREATE INDEX idx_assets_org ON assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_category ON assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_department ON assets(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_serial ON assets(serial_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_bookable ON assets(is_bookable) WHERE is_bookable = true AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_assets_org_tag ON assets(organization_id, asset_tag) WHERE deleted_at IS NULL;
-- Fast text search across tag/name/serial for Screen 4 search bar
CREATE INDEX idx_assets_search ON assets
    USING gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(asset_tag,'') || ' ' || coalesce(serial_number,'')))
    WHERE deleted_at IS NULL;

-- Immutable log of every status transition (Available -> Under Maintenance, etc.)
-- Append-only audit trail: no soft delete, no updated_by.
CREATE TABLE asset_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_status     asset_status,
    to_status       asset_status NOT NULL,
    changed_by      UUID REFERENCES employees(id),
    reason          TEXT,     -- e.g. "maintenance approved", "audit: confirmed missing"
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_status_history_asset ON asset_status_history(asset_id, changed_at DESC);

-- ============================================================================
-- 5. ALLOCATIONS & TRANSFERS
-- ============================================================================

CREATE TYPE allocation_status AS ENUM ('active', 'returned', 'overdue');

CREATE TABLE asset_allocations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    employee_id             UUID REFERENCES employees(id),      -- allocated to a person...
    department_id           UUID REFERENCES departments(id),    -- ...and/or a department
    allocated_by            UUID NOT NULL REFERENCES employees(id),
    allocated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    expected_return_date    DATE,
    actual_return_date      TIMESTAMPTZ,
    return_condition_notes  TEXT,
    returned_approved_by    UUID REFERENCES employees(id),
    status                  allocation_status NOT NULL DEFAULT 'active',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES employees(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES employees(id),
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID REFERENCES employees(id),
    CHECK (employee_id IS NOT NULL OR department_id IS NOT NULL)
);

-- THE core conflict rule: an asset can have at most one ACTIVE allocation.
-- A second attempt to allocate a held asset fails at the DB layer, not just app logic.
CREATE UNIQUE INDEX uq_one_active_allocation_per_asset
    ON asset_allocations(asset_id)
    WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX idx_allocations_asset ON asset_allocations(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_allocations_employee ON asset_allocations(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_allocations_department ON asset_allocations(department_id) WHERE deleted_at IS NULL;
-- Powers the "overdue returns" dashboard query
CREATE INDEX idx_allocations_overdue
    ON asset_allocations(expected_return_date)
    WHERE status = 'active' AND deleted_at IS NULL;

CREATE TYPE transfer_status AS ENUM ('requested', 'approved', 'rejected');

CREATE TABLE transfer_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    current_allocation_id   UUID REFERENCES asset_allocations(id),
    from_employee_id        UUID REFERENCES employees(id),
    from_department_id      UUID REFERENCES departments(id),
    to_employee_id          UUID REFERENCES employees(id),
    to_department_id        UUID REFERENCES departments(id),
    requested_by             UUID NOT NULL REFERENCES employees(id),
    status                   transfer_status NOT NULL DEFAULT 'requested',
    approved_by               UUID REFERENCES employees(id),
    approved_at                TIMESTAMPTZ,
    resulting_allocation_id     UUID REFERENCES asset_allocations(id), -- set once re-allocated
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   UUID REFERENCES employees(id),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                    UUID REFERENCES employees(id),
    deleted_at                    TIMESTAMPTZ,
    deleted_by                    UUID REFERENCES employees(id),
    CHECK (to_employee_id IS NOT NULL OR to_department_id IS NOT NULL)
);

CREATE INDEX idx_transfers_asset ON transfer_requests(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_status ON transfer_requests(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- 6. RESOURCE BOOKINGS (shared/bookable assets, time-sliced)
-- ============================================================================

CREATE TYPE booking_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

CREATE TABLE resource_bookings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    booked_by_employee_id   UUID NOT NULL REFERENCES employees(id),
    department_id           UUID REFERENCES departments(id),
    start_time               TIMESTAMPTZ NOT NULL,
    end_time                  TIMESTAMPTZ NOT NULL,
    status                     booking_status NOT NULL DEFAULT 'upcoming',
    cancelled_reason            TEXT,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   UUID REFERENCES employees(id),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                    UUID REFERENCES employees(id),
    deleted_at                    TIMESTAMPTZ,
    deleted_by                    UUID REFERENCES employees(id),
    CHECK (end_time > start_time)
);

-- THE overlap rule, enforced by Postgres itself: no two non-cancelled,
-- non-deleted bookings of the same asset may have overlapping
-- [start_time, end_time) ranges. (10:00–11:00 immediately after a
-- 9:00–10:00 booking is allowed since ranges are half-open and don't overlap.)
ALTER TABLE resource_bookings
    ADD CONSTRAINT excl_no_overlapping_bookings
    EXCLUDE USING gist (
        asset_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status <> 'cancelled' AND deleted_at IS NULL);

CREATE INDEX idx_bookings_asset_time ON resource_bookings(asset_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_employee ON resource_bookings(booked_by_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON resource_bookings(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. MAINTENANCE
-- ============================================================================

CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_status AS ENUM (
    'pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved'
);

CREATE TABLE maintenance_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    raised_by                UUID NOT NULL REFERENCES employees(id),
    issue_description         TEXT NOT NULL,
    priority                   maintenance_priority NOT NULL DEFAULT 'medium',
    photo_url                    TEXT,
    status                       maintenance_status NOT NULL DEFAULT 'pending',
    approved_by                   UUID REFERENCES employees(id),
    approved_at                    TIMESTAMPTZ,
    rejection_reason                TEXT,
    technician_name                   TEXT,
    technician_assigned_at             TIMESTAMPTZ,
    resolved_at                          TIMESTAMPTZ,
    resolution_notes                      TEXT,
    created_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                             UUID REFERENCES employees(id),
    updated_at                              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                              UUID REFERENCES employees(id),
    deleted_at                              TIMESTAMPTZ,
    deleted_by                              UUID REFERENCES employees(id)
);

CREATE INDEX idx_maintenance_asset ON maintenance_requests(asset_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_status ON maintenance_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority) WHERE deleted_at IS NULL;

-- ============================================================================
-- 8. AUDIT CYCLES
-- ============================================================================

CREATE TYPE audit_cycle_status AS ENUM ('planned', 'in_progress', 'closed');
CREATE TYPE audit_item_status AS ENUM ('pending', 'verified', 'missing', 'damaged');

CREATE TABLE audit_cycles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    scope_department_id     UUID REFERENCES departments(id),
    scope_location           TEXT,
    start_date                DATE NOT NULL,
    end_date                   DATE NOT NULL,
    status                     audit_cycle_status NOT NULL DEFAULT 'planned',
    closed_by                   UUID REFERENCES employees(id),
    closed_at                    TIMESTAMPTZ,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                    UUID NOT NULL REFERENCES employees(id),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                     UUID REFERENCES employees(id),
    deleted_at                     TIMESTAMPTZ,
    deleted_by                     UUID REFERENCES employees(id),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_audit_cycles_org ON audit_cycles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_cycles_status ON audit_cycles(status) WHERE deleted_at IS NULL;

-- Junction table: an auditor can be unassigned from a cycle (soft delete),
-- but this isn't a "created/updated by someone else" record — assigned_at/
-- assigned_by cover provenance, so no separate created_by/updated_by.
CREATE TABLE audit_cycle_auditors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_by     UUID REFERENCES employees(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID REFERENCES employees(id)
);

CREATE UNIQUE INDEX uq_audit_cycle_auditor ON audit_cycle_auditors(audit_cycle_id, employee_id) WHERE deleted_at IS NULL;

CREATE TABLE audit_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_cycle_id      UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id            UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    status              audit_item_status NOT NULL DEFAULT 'pending',
    notes                TEXT,
    verified_by            UUID REFERENCES employees(id),
    verified_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                UUID REFERENCES employees(id),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                 UUID REFERENCES employees(id),
    deleted_at                 TIMESTAMPTZ,
    deleted_by                 UUID REFERENCES employees(id)
);

CREATE INDEX idx_audit_items_cycle ON audit_items(audit_cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_items_asset ON audit_items(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_items_status ON audit_items(status) WHERE status IN ('missing','damaged') AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_audit_items_cycle_asset ON audit_items(audit_cycle_id, asset_id) WHERE deleted_at IS NULL;

-- Auto-generated for any item flagged missing/damaged; resolved by Asset Manager.
CREATE TABLE discrepancy_reports (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_item_id           UUID NOT NULL REFERENCES audit_items(id) ON DELETE CASCADE,
    audit_cycle_id           UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id                  UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    discrepancy_type            audit_item_status NOT NULL, -- 'missing' or 'damaged'
    notes                        TEXT,
    resolved_by                    UUID REFERENCES employees(id),
    resolved_at                      TIMESTAMPTZ,
    resolution_status                  TEXT NOT NULL DEFAULT 'open', -- open / resolved
    created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                          UUID REFERENCES employees(id),
    updated_at                           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                           UUID REFERENCES employees(id),
    deleted_at                           TIMESTAMPTZ,
    deleted_by                           UUID REFERENCES employees(id)
);

CREATE INDEX idx_discrepancy_cycle ON discrepancy_reports(audit_cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_discrepancy_asset ON discrepancy_reports(asset_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 9. NOTIFICATIONS & ACTIVITY LOGS
-- ============================================================================

-- Notifications get deleted_at (a user "dismisses"/clears a notification)
-- but no created_by/updated_by — they're always system-generated and
-- immutable in content, only their read/dismissed state changes.
CREATE TABLE notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id             UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type                    TEXT NOT NULL, -- 'asset_assigned' | 'maintenance_approved' | 'booking_reminder' | ...
    message                 TEXT NOT NULL,
    related_entity_type      TEXT,        -- 'asset' | 'booking' | 'maintenance_request' | 'transfer_request' | 'audit_cycle'
    related_entity_id         UUID,
    is_read                     BOOLEAN NOT NULL DEFAULT false,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                    TIMESTAMPTZ,
    deleted_by                    UUID REFERENCES employees(id)
);

CREATE INDEX idx_notifications_employee_unread
    ON notifications(employee_id, created_at DESC)
    WHERE is_read = false AND deleted_at IS NULL;

-- Append-only activity log — consider partitioning by month once volume grows
-- (e.g. PARTITION BY RANGE (created_at)); the schema below is partition-ready.
-- Immutable audit trail: no soft delete, no updated_by/created_by (the
-- `employee_id` column already records who performed the logged action).
CREATE TABLE activity_logs (
    id                  UUID NOT NULL DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id         UUID REFERENCES employees(id),
    action               TEXT NOT NULL,       -- e.g. 'asset.allocate', 'maintenance.approve'
    entity_type           TEXT NOT NULL,
    entity_id               UUID,
    details                   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Example initial partition (create new ones monthly via cron/pg_partman):
CREATE TABLE activity_logs_default PARTITION OF activity_logs DEFAULT;

CREATE INDEX idx_activity_org_time ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- ============================================================================
-- 10. GENERIC updated_at TRIGGER
-- ============================================================================
-- Stamps updated_at automatically on every UPDATE. updated_by is NOT set
-- here — the application must pass it explicitly in the UPDATE statement,
-- since Postgres has no built-in notion of "current application user."
-- (If you want the DB to infer it automatically, set a session variable
-- per-request, e.g. `SET LOCAL app.current_employee_id = '<uuid>';`, and
-- swap the trigger body below for `NEW.updated_by = current_setting('app.current_employee_id')::uuid;`.)

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organizations','departments','employees','asset_categories','assets',
        'asset_allocations','transfer_requests','resource_bookings',
        'maintenance_requests','audit_cycles','audit_items','discrepancy_reports'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t
        );
    END LOOP;
END $$;

-- ============================================================================
-- Notes on scaling further:
--   * Read-heavy dashboard/report queries (KPI cards, heatmaps, utilization)
--     should hit materialized views refreshed on a schedule rather than
--     computing live aggregates over asset_status_history / bookings.
--     Materialized views should select WHERE deleted_at IS NULL.
--   * activity_logs is partitioned by month from day one — the table with
--     the fastest unbounded growth.
--   * All FKs use ON DELETE CASCADE only where child rows are meaningless
--     without the parent (e.g. audit_items under audit_cycles); reference
--     data (employees, departments) uses ON DELETE SET NULL / RESTRICT-like
--     patterns to preserve historical records.
--   * If sharding by organization becomes necessary, organization_id is
--     already present on every root table to serve as the partition/shard key.
--   * Application data-access layer should wrap every table listed above in
--     a shared "active rows" view (`... WHERE deleted_at IS NULL`) or use a
--     query builder default scope, so soft-deleted rows never leak into
--     normal reads by accident.
-- ============================================================================
