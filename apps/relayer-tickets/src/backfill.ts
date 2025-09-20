import { canonContract, isTicketsTopic } from "./canon.js";
import { upsertEvent, applyState, pool } from "./db.js";
import { opFromEvidenceUri } from "./decoder.js";

/**
 * One-shot backfill script to reindex Canon events from a specific block
 * Usage: tsx src/backfill.ts --from-block 12345 --to-block 67890
 */

async function backfill(fromBlock: number, toBlock?: number) {
  const { provider, contract } = canonContract();
  const latest = await provider.getBlockNumber();
  const endBlock = toBlock || latest;

  console.log(`🔄 Backfilling from block ${fromBlock} to ${endBlock}`);

  let processed = 0;
  let errors = 0;

  // Process in batches to avoid overwhelming the RPC
  const batchSize = 1000;
  for (let start = fromBlock; start <= endBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, endBlock);
    
    try {
      const filter = contract.filters.Anchored();
      const events = await contract.queryFilter(filter, start, end);
      
      for (const event of events) {
        try {
          const { ticketCommit, eventCommit, holderTag, policyCommit, foundation, topic, assurance, uri } = event.args!;
          
          if (!isTicketsTopic(Number(topic))) continue;

          const block = await event.getBlock();
          const opType = opFromEvidenceUri(uri);

          await upsertEvent({
            canonTx: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTime: new Date(Number(block.timestamp) * 1000),
            ticketCommit, eventCommit, holderTag, policyCommit,
            opType, assurance: Number(assurance), uri
          });

          if (opType === "ISSUANCE" || opType === "TRANSFER" || opType === "REVOCATION") {
            await applyState({
              ticketCommit, eventCommit, holderTag, policyCommit, opType, canonTx: event.transactionHash
            });
          }

          processed++;
          if (processed % 100 === 0) {
            console.log(`✅ Processed ${processed} events...`);
          }
        } catch (err) {
          console.error(`❌ Error processing event ${event.transactionHash}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error(`❌ Error processing block range ${start}-${end}:`, err);
      errors++;
    }
  }

  console.log(`🎉 Backfill complete! Processed: ${processed}, Errors: ${errors}`);
  await pool.end();
}

// Parse command line arguments
const args = process.argv.slice(2);
const fromBlockArg = args.find(arg => arg.startsWith('--from-block='));
const toBlockArg = args.find(arg => arg.startsWith('--to-block='));

if (!fromBlockArg) {
  console.error('Usage: tsx src/backfill.ts --from-block=12345 [--to-block=67890]');
  process.exit(1);
}

const fromBlock = parseInt(fromBlockArg.split('=')[1]);
const toBlock = toBlockArg ? parseInt(toBlockArg.split('=')[1]) : undefined;

backfill(fromBlock, toBlock).catch(console.error);
