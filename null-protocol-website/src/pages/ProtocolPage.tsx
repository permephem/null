export function ProtocolPage() {
  return (
    <div className="section">
      <div className="container text-center">
        <h1 className="mb-6">Protocol Architecture</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--null-accent)', maxWidth: '48rem', margin: '0 auto 1rem' }}>
          Null is the rights layer for the internet: verifiable deletion, auditable closure, and enforceable consent—backed by receipts, not promises.
        </p>
        <p style={{ fontSize: '1.1rem', color: 'var(--null-accent)', maxWidth: '42rem', margin: '0 auto 1.25rem' }}>
          What they take from your data, we take back for you—then prove it.
        </p>
        <div className="mt-4" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/contact">Get Null Verified</a>
          <a className="btn btn-secondary" href="/whitepaper">Read the Whitepaper</a>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <h2 className="text-center mb-16">Core Components</h2>
          <div className="grid grid-4">
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Null Warrants</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Deletion commands, enforced and verifiable.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Mask Receipts</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Soulbound tombstones — immutable proof of closure.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Canon Ledger</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Proof of absence, logged forever without revealing data.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>
                Obol<br />
                of the 13
              </h3>
              <p style={{ color: 'var(--null-accent)' }}>
                A covenantal tithe — extractors pay, rights endure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <h2 className="text-center mb-16">How Settlement Works</h2>
          <div className="grid grid-3">
            <div className="card">
              <h3>Enterprises Pay in Fiat</h3>
              <p style={{ color: 'var(--null-accent)' }}>Implementers invoice in USD/EUR. No crypto treasury required for adopters.</p>
            </div>
            <div className="card">
              <h3>Dynamic NULL Conversion</h3>
              <p style={{ color: 'var(--null-accent)' }}>Fees are pegged to fiat (e.g., $0.50 per receipt) and converted to NULL at settlement via price oracles.</p>
            </div>
            <div className="card">
              <h3>Obol Funds Stewardship</h3>
              <p style={{ color: 'var(--null-accent)' }}>One‑thirteenth of every enactment flows to the Foundation. The cost is borne by data holders—not by individuals.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <h2 className="text-center mb-16">What It Looks Like to Everyone Involved</h2>
          
          <div className="mb-12">
            <h3 className="mb-6">Roles</h3>
            <div className="grid grid-2">
              <div className="card">
                <h4>User</h4>
                <p style={{ color: 'var(--null-accent)' }}>Clicks "Delete my data."</p>
              </div>
              <div className="card">
                <h4>Enterprise (Pilot)</h4>
                <p style={{ color: 'var(--null-accent)' }}>Exposes a Null Closure Endpoint and runs a small "eraser" job.</p>
              </div>
              <div className="card">
                <h4>Null Engine (Implementer)</h4>
                <p style={{ color: 'var(--null-accent)' }}>Mediates requests, signatures, fees, logging.</p>
              </div>
              <div className="card">
                <h4>Null Foundation</h4>
                <p style={{ color: 'var(--null-accent)' }}>Receives the Obol (1/13) and operates the public registry.</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="mb-6">Flow (MVP, honest and enforceable-by-audit)</h3>
            <div className="grid grid-1">
              <div className="card">
                <h4>1. User Request</h4>
                <p style={{ color: 'var(--null-accent)' }}>User presses "Delete." Their wallet/app signs a Null Warrant that names the enterprise and the subject handle (a salted hash of their account identifier).</p>
              </div>
              <div className="card">
                <h4>2. Dispatch</h4>
                <p style={{ color: 'var(--null-accent)' }}>Null Engine posts the signed warrant to the enterprise's /null/closure endpoint and simultaneously anchors the request hash on Canon Ledger (append-only registry).</p>
              </div>
              <div className="card">
                <h4>3. Enterprise Executes</h4>
                <p style={{ color: 'var(--null-accent)' }}>Enterprise maps the subject handle to records and runs its Deletion Routine (API calls, SQL scripts, key destruction). It logs artifacts internally (what was touched).</p>
              </div>
              <div className="card">
                <h4>4. Enterprise Attests</h4>
                <p style={{ color: 'var(--null-accent)' }}>Enterprise responds with a Signed Attestation: "We completed deletion for subject S at time T, scope X." Engine writes this attestation hash to Canon.</p>
              </div>
              <div className="card">
                <h4>5. Mask Receipt (Soulbound)</h4>
                <p style={{ color: 'var(--null-accent)' }}>Engine mints a non-transferable Mask Receipt for the user (proof that the enterprise promised and when). This is the public anchor of accountability.</p>
              </div>
              <div className="card">
                <h4>6. Fee Settlement + Obol</h4>
                <p style={{ color: 'var(--null-accent)' }}>Enterprise pays service fees in USD; Engine converts the protocol portion to NULL at oracle price; the Obol (1/13) flows to the Foundation treasury.</p>
              </div>
              <div className="card">
                <h4>7. Verification/Audit</h4>
                <p style={{ color: 'var(--null-accent)' }}>Anyone can verify: warrant hash ↔ attestation hash ↔ receipt. If a regulator/auditor checks later and finds retained data, the public promise is incontrovertible evidence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <h2 className="text-center mb-16">Cryptographic Enhancements</h2>
          <div className="grid grid-4">
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Zero‑Knowledge Proofs</h3>
              <p style={{ color: 'var(--null-accent)' }}>Prove deletion occurred—without revealing what was deleted.</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Verifiable Deletion Proofs</h3>
              <p style={{ color: 'var(--null-accent)' }}>Attest irretrievability via key‑destruction proofs and runtime attestations.</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Trusted Execution Environments</h3>
              <p style={{ color: 'var(--null-accent)' }}>Hardware‑backed attestations that the prescribed deletion routine actually ran.</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Decentralized Identity</h3>
              <p style={{ color: 'var(--null-accent)' }}>Authenticate who can request closure—subjects, guardians, or lawful custodians.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}