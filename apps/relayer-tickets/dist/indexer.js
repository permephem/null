/**
 * Minimal, in-memory indexer view for demo.
 * Replace with a real indexer that tails Canon events and persists state.
 */
const store = new Map();
export function setState(s) {
    store.set(s.ticketIdCommit, s);
}
export function getState(ticketIdCommit) {
    return store.get(ticketIdCommit);
}
