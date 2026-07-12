-- Apply against an existing AssetFlow database (idempotent where possible).
-- Employee return requests + transfer/maintenance fields needed for employee flows.

ALTER TABLE transfer_requests
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_open_transfer_per_allocation
    ON transfer_requests(current_allocation_id)
    WHERE status = 'requested' AND deleted_at IS NULL AND current_allocation_id IS NOT NULL;

DO $$ BEGIN
    CREATE TYPE return_request_status AS ENUM ('requested', 'approved', 'rejected', 'completed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS return_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    allocation_id           UUID NOT NULL REFERENCES asset_allocations(id),
    requested_by            UUID NOT NULL REFERENCES employees(id),
    reason                  TEXT,
    condition_notes         TEXT,
    preferred_return_date   DATE,
    attachment_url          TEXT,
    remarks                 TEXT,
    status                  return_request_status NOT NULL DEFAULT 'requested',
    approved_by             UUID REFERENCES employees(id),
    approved_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES employees(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES employees(id),
    deleted_at              TIMESTAMPTZ,
    deleted_by              UUID REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_return_requests_asset ON return_requests(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_return_requests_requested_by ON return_requests(requested_by) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_open_return_per_allocation
    ON return_requests(allocation_id)
    WHERE status = 'requested' AND deleted_at IS NULL;

ALTER TABLE maintenance_requests
    ADD COLUMN IF NOT EXISTS issue_title TEXT;

DO $$ BEGIN
    CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON return_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
