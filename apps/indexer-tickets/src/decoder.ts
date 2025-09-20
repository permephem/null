export function mapAssurance(a: number) { return a; }

export function opFromEvidenceUri(uri: string): "ISSUANCE"|"TRANSFER"|"REVOCATION"|"ENTRY_OK"|"ENTRY_DENY" {
  // If your on-chain event already encodes op_type, parse that instead.
  // In this stub we assume URI or off-chain evidence implies op_type; replace with your real field.
  // For now default to TRANSFER unless URI hints:
  const u = uri.toLowerCase();
  if (u.includes("revocation")) return "REVOCATION";
  if (u.includes("issuance")) return "ISSUANCE";
  if (u.includes("entry_deny")) return "ENTRY_DENY";
  if (u.includes("entry_ok")) return "ENTRY_OK";
  return "TRANSFER";
}
