import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  AnchoredEvent,
  Relayer,
  AssuranceTier,
  ProtocolStats,
  SubjectTag,
  ControllerDID,
  DailyStats,
} from "../generated/schema";

// Assurance tier names
const ASSURANCE_TIER_NAMES = ["EMAIL_DKIM", "DID_JWS", "TEE_ATTESTATION"];

export function handleAnchored(event: ethereum.Event): void {
  // Create AnchoredEvent entity
  let anchoredEvent = new AnchoredEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  anchoredEvent.warrantDigest = event.params.warrantDigest;
  anchoredEvent.attestationDigest = event.params.attestationDigest;
  anchoredEvent.relayer = event.params.relayer;
  anchoredEvent.subjectTag = event.params.subjectTag;
  anchoredEvent.controllerDidHash = event.params.controllerDidHash;
  anchoredEvent.assurance = event.params.assurance;
  anchoredEvent.timestamp = event.params.timestamp;
  anchoredEvent.blockNumber = event.block.number;
  anchoredEvent.transactionHash = event.transaction.hash;
  anchoredEvent.logIndex = event.logIndex;
  anchoredEvent.save();

  // Update or create Relayer entity
  let relayerId = event.params.relayer.toHex();
  let relayer = Relayer.load(relayerId);
  if (relayer == null) {
    relayer = new Relayer(relayerId);
    relayer.address = event.params.relayer;
    relayer.totalAnchors = BigInt.fromI32(0);
    relayer.firstAnchor = event.block.number;
    relayer.totalFeesPaid = BigInt.fromI32(0);
  }
  relayer.totalAnchors = relayer.totalAnchors.plus(BigInt.fromI32(1));
  relayer.lastAnchor = event.block.number;
  relayer.totalFeesPaid = relayer.totalFeesPaid.plus(event.transaction.value);
  relayer.save();

  // Update or create AssuranceTier entity
  let assuranceId = event.params.assurance.toString();
  let assuranceTier = AssuranceTier.load(assuranceId);
  if (assuranceTier == null) {
    assuranceTier = new AssuranceTier(assuranceId);
    assuranceTier.level = event.params.assurance;
    assuranceTier.name = ASSURANCE_TIER_NAMES[event.params.assurance] || "UNKNOWN";
    assuranceTier.totalAnchors = BigInt.fromI32(0);
  }
  assuranceTier.totalAnchors = assuranceTier.totalAnchors.plus(BigInt.fromI32(1));
  assuranceTier.save();

  // Update or create SubjectTag entity
  let subjectId = event.params.subjectTag.toHex();
  let subjectTag = SubjectTag.load(subjectId);
  if (subjectTag == null) {
    subjectTag = new SubjectTag(subjectId);
    subjectTag.tag = event.params.subjectTag;
    subjectTag.totalAnchors = BigInt.fromI32(0);
    subjectTag.firstAnchor = event.block.number;
  }
  subjectTag.totalAnchors = subjectTag.totalAnchors.plus(BigInt.fromI32(1));
  subjectTag.lastAnchor = event.block.number;
  subjectTag.save();

  // Update or create ControllerDID entity
  let controllerId = event.params.controllerDidHash.toHex();
  let controllerDID = ControllerDID.load(controllerId);
  if (controllerDID == null) {
    controllerDID = new ControllerDID(controllerId);
    controllerDID.didHash = event.params.controllerDidHash;
    controllerDID.totalAnchors = BigInt.fromI32(0);
    controllerDID.firstAnchor = event.block.number;
  }
  controllerDID.totalAnchors = controllerDID.totalAnchors.plus(BigInt.fromI32(1));
  controllerDID.lastAnchor = event.block.number;
  controllerDID.save();

  // Update ProtocolStats
  let protocolStats = ProtocolStats.load("protocol");
  if (protocolStats == null) {
    protocolStats = new ProtocolStats("protocol");
    protocolStats.totalAnchors = BigInt.fromI32(0);
    protocolStats.totalFeesCollected = BigInt.fromI32(0);
    protocolStats.uniqueRelayers = BigInt.fromI32(0);
    protocolStats.uniqueSubjects = BigInt.fromI32(0);
  }
  protocolStats.totalAnchors = protocolStats.totalAnchors.plus(BigInt.fromI32(1));
  protocolStats.totalFeesCollected = protocolStats.totalFeesCollected.plus(
    event.transaction.value
  );
  protocolStats.lastUpdate = event.block.timestamp;
  protocolStats.save();

  // Update DailyStats
  let date = new Date(event.block.timestamp.toI32() * 1000);
  let dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  let dailyStats = DailyStats.load(dateString);
  if (dailyStats == null) {
    dailyStats = new DailyStats(dateString);
    dailyStats.date = dateString;
    dailyStats.anchors = BigInt.fromI32(0);
    dailyStats.fees = BigInt.fromI32(0);
    dailyStats.uniqueRelayers = BigInt.fromI32(0);
    dailyStats.assurance0Anchors = BigInt.fromI32(0);
    dailyStats.assurance1Anchors = BigInt.fromI32(0);
    dailyStats.assurance2Anchors = BigInt.fromI32(0);
  }
  dailyStats.anchors = dailyStats.anchors.plus(BigInt.fromI32(1));
  dailyStats.fees = dailyStats.fees.plus(event.transaction.value);

  // Update assurance-specific counters
  if (event.params.assurance == 0) {
    dailyStats.assurance0Anchors = dailyStats.assurance0Anchors.plus(
      BigInt.fromI32(1)
    );
  } else if (event.params.assurance == 1) {
    dailyStats.assurance1Anchors = dailyStats.assurance1Anchors.plus(
      BigInt.fromI32(1)
    );
  } else if (event.params.assurance == 2) {
    dailyStats.assurance2Anchors = dailyStats.assurance2Anchors.plus(
      BigInt.fromI32(1)
    );
  }

  dailyStats.save();
}
