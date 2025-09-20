/**
 * Minimal, in-memory indexer view for demo.
 * Replace with a real indexer that tails Canon events and persists state.
 */

type State = "ISSUED" | "TRANSFERRED" | "REVOKED";
type TicketState = {
  ticketIdCommit: string;
  holderTag: string;
  policyCommit: string;
  state: State;
  lastCanonTx: string;
};

const store = new Map<string, TicketState>();

export function setState(s: TicketState) {
  store.set(s.ticketIdCommit, s);
}

export function getState(ticketIdCommit: string): TicketState | undefined {
  return store.get(ticketIdCommit);
}

