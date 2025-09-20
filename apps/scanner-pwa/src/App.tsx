import React, { useState } from "react";

const RELAYER_VERIFY_URL = import.meta.env.VITE_VERIFY_URL || "https://relay.null.xyz/tickets/verify";

export default function App() {
  const [payload, setPayload] = useState("");
  const [holderProof, setHolderProof] = useState("");
  const [result, setResult] = useState<{decision?: string; reason?: string; canonRef?: string}>({});

  async function verify() {
    setResult({});
    const res = await fetch(RELAYER_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticketQrPayload: payload, holderProof })
    });
    const json = await res.json();
    setResult(json);
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui", margin: "2rem", maxWidth: 480 }}>
      <h1>Null Scanner ∅</h1>
      <p>Scan or paste ticket payload (e.g., <code>TICKET:0xabc...:session123</code>)</p>

      <label>Ticket Payload</label>
      <textarea value={payload} onChange={e=>setPayload(e.target.value)} rows={3} style={{width:"100%", marginBottom:12}} />

      <label>Holder Proof (OTP or signature)</label>
      <input value={holderProof} onChange={e=>setHolderProof(e.target.value)} style={{width:"100%", marginBottom:12}} />

      <button onClick={verify} style={{padding:"8px 16px"}}>Verify</button>

      {result.decision && (
        <div style={{marginTop:16, padding:12, border:"1px solid #333", borderRadius:8}}>
          <strong>Decision:</strong> {result.decision}<br/>
          {result.reason && <><strong>Reason:</strong> {result.reason}<br/></>}
          {result.canonRef && <><strong>Canon Tx:</strong> {result.canonRef}</>}
        </div>
      )}
    </div>
  );
}
