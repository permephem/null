import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

export async function upsertEvent(e: {
  canonTx: string;
  blockNumber: number;
  blockTime: Date;
  ticketCommit: string;
  eventCommit: string;
  holderTag: string;
  policyCommit: string;
  opType: "ISSUANCE"|"TRANSFER"|"REVOCATION"|"ENTRY_OK"|"ENTRY_DENY";
  assurance: number;
  uri: string;
}) {
  await pool.query(
    `INSERT INTO canon_ticket_events
      (canon_tx_hash, block_number, block_time, ticket_id_commit, event_id_commit, holder_tag, policy_commit, op_type, assurance, uri)
     VALUES ($1,$2,$3, decode($4,'hex'), decode($5,'hex'), decode($6,'hex'), decode($7,'hex'), $8, $9, $10)
     ON CONFLICT (canon_tx_hash) DO NOTHING`,
    [
      e.canonTx, e.blockNumber, e.blockTime,
      e.ticketCommit.replace(/^0x/, ""),
      e.eventCommit.replace(/^0x/, ""),
      e.holderTag.replace(/^0x/, ""),
      e.policyCommit.replace(/^0x/, ""),
      e.opType, e.assurance, e.uri
    ]
  );
}

export async function applyState(e: {
  ticketCommit: string;
  eventCommit: string;
  holderTag: string;
  policyCommit: string;
  opType: "ISSUANCE"|"TRANSFER"|"REVOCATION";
  canonTx: string;
}) {
  const state = e.opType === "REVOCATION" ? "REVOKED" : (e.opType === "TRANSFER" ? "TRANSFERRED" : "ISSUED");
  await pool.query(
    `INSERT INTO tickets_current_state
       (ticket_id_commit, event_id_commit, holder_tag, policy_commit, state, last_canon_tx)
     VALUES (decode($1,'hex'), decode($2,'hex'), decode($3,'hex'), decode($4,'hex'), $5, $6)
     ON CONFLICT (ticket_id_commit)
     DO UPDATE SET holder_tag=EXCLUDED.holder_tag,
                   policy_commit=EXCLUDED.policy_commit,
                   state=EXCLUDED.state,
                   last_canon_tx=EXCLUDED.last_canon_tx,
                   updated_at=NOW()`,
    [
      e.ticketCommit.replace(/^0x/, ""),
      e.eventCommit.replace(/^0x/, ""),
      e.holderTag.replace(/^0x/, ""),
      e.policyCommit.replace(/^0x/, ""),
      state,
      e.canonTx
    ]
  );
}
