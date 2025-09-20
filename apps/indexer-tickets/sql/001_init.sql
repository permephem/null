-- Immutable append-only log of Canon ticket events
CREATE TABLE IF NOT EXISTS canon_ticket_events (
  id BIGSERIAL PRIMARY KEY,
  canon_tx_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  ticket_id_commit BYTEA NOT NULL,
  event_id_commit  BYTEA NOT NULL,
  holder_tag       BYTEA NOT NULL,
  policy_commit    BYTEA NOT NULL,
  op_type          TEXT CHECK (op_type IN ('ISSUANCE','TRANSFER','REVOCATION','ENTRY_OK','ENTRY_DENY')) NOT NULL,
  assurance        SMALLINT NOT NULL,
  uri              TEXT NOT NULL
);

-- Current state materialization
CREATE TABLE IF NOT EXISTS tickets_current_state (
  ticket_id_commit BYTEA PRIMARY KEY,
  event_id_commit  BYTEA NOT NULL,
  holder_tag       BYTEA NOT NULL,
  policy_commit    BYTEA NOT NULL,
  state            TEXT CHECK (state IN ('ISSUED','TRANSFERRED','REVOKED')) NOT NULL,
  last_canon_tx    TEXT NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON canon_ticket_events(ticket_id_commit);
CREATE INDEX IF NOT EXISTS idx_ticket_state_holder ON tickets_current_state(holder_tag);
