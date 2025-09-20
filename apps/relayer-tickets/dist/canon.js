import { ethers, Contract, Wallet } from "ethers";
import { CONFIG } from "./config.js";
const CANON_ABI = [
    // Adjust to your CanonRegistry ABI
    "function anchor(bytes32 warrant, bytes32 att, bytes32 holderTag, address foundation, uint8 topic, uint8 assurance, string uri) payable returns (bool)"
];
export var Topic;
(function (Topic) {
    Topic[Topic["Tickets"] = 4] = "Tickets";
})(Topic || (Topic = {}));
export class CanonClient {
    provider;
    wallet;
    contract;
    constructor() {
        this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        this.wallet = new Wallet(CONFIG.RELAYER_PK, this.provider);
        this.contract = new Contract(CONFIG.CANON_ADDRESS, CANON_ABI, this.wallet);
    }
    async anchorTickets(a) {
        const tx = await this.contract.anchor(a.ticket_id_commit, a.policy_commit, a.holder_tag, CONFIG.FOUNDATION_ADDRESS, Topic.Tickets, a.assurance, a.uri, { value: a.feeWei });
        const rc = await tx.wait();
        return rc?.hash;
    }
}
