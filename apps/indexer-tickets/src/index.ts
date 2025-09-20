import { canonContract, isTicketsTopic } from "./canon.js";
import { upsertEvent, applyState, pool } from "./db.js";
import pRetry from "p-retry";

const CONF = {
  startBlock: BigInt(process.env.START_BLOCK ?? "0"),
  confirmations: BigInt(process.env.CONFIRMATIONS ?? "5")
};

async function main() {
  const { provider, contract } = canonContract();
  const latest = await provider.getBlockNumber();
  let from = Number(CONF.startBlock || BigInt(latest));

  contract.on("Anchored", async (ticketCommit, eventCommit, holderTag, policyCommit, foundation, topic, assurance, uri, ev) => {
    try {
      if (!isTicketsTopic(Number(topic))) return;

      const block = await ev.getBlock();
      const opType = inferOpType(uri); // replace with explicit field when available

      await upsertEvent({
        canonTx: ev.transactionHash,
        blockNumber: ev.blockNumber,
        blockTime: new Date(Number(block.timestamp) * 1000),
        ticketCommit, eventCommit, holderTag, policyCommit,
        opType, assurance: Number(assurance), uri
      });

      if (opType === "ISSUANCE" || opType === "TRANSFER" || opType === "REVOCATION") {
        await applyState({
          ticketCommit, eventCommit, holderTag, policyCommit, opType, canonTx: ev.transactionHash
        });
      }
    } catch (err) {
      console.error("Index error:", err);
    }
  });

  console.log(`⛓️  Indexing from block ~${from}. Listening for Canon Anchored events…`);
}

function inferOpType(uri: string): any {
  const u = uri.toLowerCase();
  if (u.includes("issuance")) return "ISSUANCE";
  if (u.includes("revocation")) return "REVOCATION";
  if (u.includes("entry_deny")) return "ENTRY_DENY";
  if (u.includes("entry_ok")) return "ENTRY_OK";
  return "TRANSFER";
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
