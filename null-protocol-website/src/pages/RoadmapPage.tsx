import { Target, Users, Shield, Building, Zap, FileText } from 'lucide-react';

export function RoadmapPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 style={{ marginBottom: '1.5rem' }}>Strategic Brief for Collaborators</h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--null-accent)', 
            maxWidth: '48rem', 
            margin: '0 auto'
          }}>
            Null exists to defend the digital rights of everyday people — most critically, the right to deletion.
            Where regulators make promises on paper, Null enforces them in code.
          </p>
          <div style={{
            backgroundColor: 'var(--null-dark)',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(102, 102, 102, 0.2)',
            marginTop: '2rem',
            maxWidth: '32rem',
            margin: '2rem auto 0'
          }}>
            <p style={{ 
              color: 'var(--null-light)', 
              fontFamily: 'JetBrains Mono, monospace', 
              fontSize: '1rem',
              fontStyle: 'italic'
            }}>
              "Delete means delete. Not a checkbox. Not a policy. A covenant."
            </p>
          </div>
        </div>

        {/* Model & Differentiation */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Model & Differentiation</h2>
          
          <div className="grid grid-2">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem'
                }}>
                  <Shield size={24} color="var(--null-dark)" />
                </div>
                <h3>Covenant, Not Token</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem' }}>
                NULL is a covenant coin — participation in a shared rights contract.
              </p>
              <p style={{ color: 'var(--null-accent)' }}>
                Buying NULL = signing into the defense of your own data rights.
              </p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem'
                }}>
                  <Target size={24} color="var(--null-dark)" />
                </div>
                <h3>Anti-Institution Institution</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem' }}>
                Funded by the community, not VCs or corporations.
              </p>
              <p style={{ color: 'var(--null-accent)' }}>
                Exists to dismantle data hoarding, not entrench itself.
              </p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem'
                }}>
                  <Users size={24} color="var(--null-dark)" />
                </div>
                <h3>Community as First Signatories</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem' }}>
                Early adopters are founding signatories, not speculators.
              </p>
              <p style={{ color: 'var(--null-accent)' }}>
                The upside flows to the people, not extractive investors.
              </p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem'
                }}>
                  <Zap size={24} color="var(--null-dark)" />
                </div>
                <h3>Protocol-Enforced Rights</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem' }}>
                Null Engine turns deletion into a verifiable proof, not a promise.
              </p>
              <p style={{ color: 'var(--null-accent)' }}>
                Rights backed by receipts and transparency logs.
              </p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                backgroundColor: 'var(--null-accent)', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: '1rem'
              }}>
                <Building size={24} color="var(--null-dark)" />
              </div>
              <h3>Alignment of Incentives</h3>
            </div>
            <p style={{ color: 'var(--null-accent)', marginBottom: '1rem' }}>
              Institutions pay, not individuals.
            </p>
            <p style={{ color: 'var(--null-accent)' }}>
              Obols (fees) flow from controllers → verifiers, Foundation, and ecosystem.
            </p>
          </div>
        </section>

        {/* Structure */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Structure</h2>
          
          <div className="grid grid-3">
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Null Foundation</h3>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                (nonprofit/DAO)
              </p>
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Guardian of the covenant</li>
                <li style={{ marginBottom: '0.5rem' }}>Issues "Null Verified" certification</li>
                <li>Manages governance, parameters, and protocol legitimacy</li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Null Engine Co.</h3>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                (commercial entity)
              </p>
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Publishes canonical SDKs, APIs, and builds</li>
                <li style={{ marginBottom: '0.5rem' }}>Enterprise support, bundles, and managed services</li>
                <li>Commercializes certified extensions and integrations</li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Developers & Ecosystem</h3>
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Build SDKs, APIs, and integrations on top of Null Engine</li>
                <li style={{ marginBottom: '0.5rem' }}>Earn via certification, revenue share, grants, and staking rewards</li>
                <li>Innovations live in layers around the stable covenant core</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Commercial Model */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Commercial Model</h2>
          
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Revenue Streams</h3>
              <ul style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Certification-as-a-Service: Fees for "Null Verified" status</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Enterprise Support: SLAs, compliance reports, integration help</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Marketplace & Extensions: Certified third-party APIs, with platform cut</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Managed Services: Hosted Null Cloud subscriptions</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Token Utility: NULL required for staking, certification, and compliance</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Value Loops</h3>
              <ul style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Institutions pay to prove compliance</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Null Engine Co. monetizes distribution, certification, and services</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Foundation sustains governance via certification and obol fees</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                  <span>Developers innovate at the edges and share in revenue/recognition</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ecosystem Philosophy */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Ecosystem Philosophy</h2>
          
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Open Core</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Null Engine code is open-sourced to maximize adoption.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Canonical Distribution</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Only Null Engine publishes the official, audited builds.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Certification Moat</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                "Null Verified" is Foundation-controlled and cannot be forked.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Extensible Layers</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Developers free to innovate; best work can be certified.
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--null-dark)',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(102, 102, 102, 0.2)',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--null-accent)', fontSize: '1rem' }}>
              👉 This balance ensures transparency, adoption, and trust — while preserving Null's legitimacy as the steward of the covenant.
            </p>
          </div>
        </section>

        {/* Closing Thought */}
        <section>
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Closing Thought</h2>
            <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
              <p style={{ 
                fontSize: '1.125rem', 
                color: 'var(--null-accent)', 
                marginBottom: '1.5rem'
              }}>
                Null is not "another ICO." It is a <strong style={{ color: 'var(--null-light)' }}>constitutional framework for digital rights</strong>, 
                where people don't just fund a project, they sign into a covenant. The upside belongs to the community. 
                The stewardship remains independent. And the protocol enforces what regulators cannot: your right to delete.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

