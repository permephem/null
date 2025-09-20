import { NullTicketsClient } from "./src/client.js";

// Example usage
const sdk = new NullTicketsClient({
  apiBase: "https://relay.null.xyz",
  canonContract: "0xCanon...",
  foundationAddress: "0xFoundation...",
  venueHmacKey: new TextEncoder().encode("super-secret-per-venue-key")
});

async function example() {
  try {
    // Issue
    const issued = await sdk.issue({
      eventId: "ARENA-2025-10-12-TourA",
      seat: "112-D-8",
      holderIdentifier: "alice@example.com",
      policy: { maxResalePct: 110, transferWindowHours: 48, kycLevel: "light" },
      assurance: 1
    });
    console.log("Issued:", issued.ticketIdCommit, issued.canonTx);

    // Transfer
    const tr = await sdk.transfer({
      ticketIdCommit: issued.ticketIdCommit,
      fromIdentifier: "alice@example.com",
      toIdentifier: "bob@example.com"
    });
    console.log("Transfer canonTx:", tr.canonTx);

    // Revoke
    const rv = await sdk.revoke({
      ticketIdCommit: issued.ticketIdCommit,
      reason: "policy_breach"
    });
    console.log("Revoked:", rv.canonTx);

    // Verify at gate
    const vr = await sdk.verifyAtGate({
      ticketQrPayload: "TICKET:ARENA-2025-10-12-TourA:112-D-8:session-xyz",
      holderProof: "123456" // OTP or wallet signature base64
    });
    console.log("Gate decision:", vr.decision);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Uncomment to run example
// example();
