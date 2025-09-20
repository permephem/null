import type { Hex, CanonAnchorPayload, Assurance } from "./types.js";
import { Contract, Signer, Interface, ethers } from "ethers";

const CANON_ABI = [
  "function anchor(bytes32,bytes32,bytes32,address,uint8,uint8,string) payable"
  // Map to your CanonRegistry signature if different
];

export class CanonClient {
  private contract: Contract;
  constructor(
    rpcProvider: any,              // ethers Provider
    canonAddress: string,
    private foundation: string,
    private signer?: Signer
  ) {
    this.contract = new Contract(canonAddress, CANON_ABI, signer ?? rpcProvider);
  }

  /**
   * Anchor a lifecycle event to Canon.
   * In production, this should be called by your relayer (server-side); clients sign typed data only.
   */
  async anchor(payload: CanonAnchorPayload, msgValueWei = 0n): Promise<Hex> {
    // Map payload fields to your actual Canon ABI:
    // Example: anchor(warrantDigest, attestationDigest, subjectTag, controller, topic, assurance, uri)
    // For tickets, you might pack commitments into warrant/attestation digests.
    const tx = await this.contract.anchor(
      payload.ticket_id_commit,
      payload.policy_commit,        // illustratively reusing second slot
      payload.holder_tag,
      this.foundation,
      /* topic */ 0x04,             // e.g., Topic.Tickets
      payload.assurance as number,
      payload.uri,
      { value: msgValueWei }
    );
    const receipt = await tx.wait();
    return receipt?.hash as Hex;
  }
}


