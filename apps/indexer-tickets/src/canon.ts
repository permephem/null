import { JsonRpcProvider, Contract, Log, Interface } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

export const CANON_ABI = [
  // Adjust to your real ABI/event name/signatures
  "event Anchored(bytes32 ticketCommit, bytes32 eventCommit, bytes32 holderTag, bytes32 policyCommit, address foundation, uint8 topic, uint8 assurance, string uri)"
];

export function canonContract() {
  const provider = new JsonRpcProvider(process.env.RPC_URL!);
  const contract = new Contract(process.env.CANON_ADDRESS!, CANON_ABI, provider);
  return { provider, contract, iface: new Interface(CANON_ABI) };
}

export function isTicketsTopic(topic: number): boolean {
  return topic === Number(process.env.CANON_TOPIC_TICKETS ?? 4);
}
