import { ethers, Contract, Wallet } from "ethers";
import type { Hex } from "./crypto.js";
import { CONFIG } from "./config.js";

const CANON_ABI = [
  // Adjust to your CanonRegistry ABI
  "function anchor(bytes32 warrant, bytes32 att, bytes32 holderTag, address foundation, uint8 topic, uint8 assurance, string uri) payable returns (bool)"
];

export enum Topic {
  Tickets = 4
}

export type AnchorArgs = {
  ticket_id_commit: Hex;
  policy_commit: Hex;
  holder_tag: Hex;
  assurance: number;
  uri: string;
  feeWei: bigint;
};

export class CanonClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new Wallet(CONFIG.RELAYER_PK, this.provider);
    this.contract = new Contract(CONFIG.CANON_ADDRESS, CANON_ABI, this.wallet);
  }

  async anchorTickets(a: AnchorArgs): Promise<string> {
    const tx = await this.contract.anchor(
      a.ticket_id_commit,
      a.policy_commit,
      a.holder_tag,
      CONFIG.FOUNDATION_ADDRESS,
      Topic.Tickets,
      a.assurance,
      a.uri,
      { value: a.feeWei }
    );
    const rc = await tx.wait();
    return rc?.hash as string;
  }
}
