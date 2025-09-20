
export function GovernancePage() {
  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 style={{ marginBottom: '1.5rem' }}>Governance Model</h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--null-accent)', 
            maxWidth: '48rem', 
            margin: '0 auto'
          }}>
            Null Protocol is stewarded by a neutral foundation, supported by Domain Advisory Councils (DACs) 
            and Technical Steering Committees (TSCs), ensuring broad applicability across diverse domains.
          </p>
        </div>

        {/* Null Foundation */}
        <section style={{ marginBottom: '5rem' }}>
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Null Foundation</h2>
            
            <div className="grid grid-2">
              <div>
                <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  Neutral steward incorporated as a non-profit. Oversees mission, governance, and neutrality. 
                  Rotating leadership; no permanent founder seat.
                </p>
                
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Board Composition</h3>
                <ul style={{ color: 'var(--null-accent)' }}>
                  <li>Rights & Privacy Advocates — defenders of digital freedoms</li>
                  <li>Compliance & Legal Experts — guardians of enforceable law</li>
                  <li>Technical Stewards — cryptographers & infrastructure maintainers</li>
                  <li>Cultural & Arts Voices — archivists, artists, and memory custodians</li>
                  <li>Global South Representatives — voices from the most impacted regions</li>
                  <li>Ethics & Archives Specialists — heritage and institutional stewards</li>
                </ul>
              </div>
              
              <div style={{ 
                backgroundColor: 'var(--null-dark)', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                border: '1px solid rgba(102, 102, 102, 0.2)'
              }}>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Key Principles</h3>
                <ul style={{ color: 'var(--null-accent)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>✓</span>
                    <span>Neutral stewardship of protocol</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>✓</span>
                    <span>Rotating leadership structure</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>✓</span>
                    <span>No permanent founder control</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>✓</span>
                    <span>Balanced representation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Governance Structure Clarification */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Governance Structure</h2>
          
          <div className="grid grid-3">
            {/* Foundation Board */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Foundation Board</h3>
              
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem', fontWeight: '600' }}>
                Digital Rights Defenders Only
              </p>
              
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>NGOs and digital rights organizations</li>
                <li style={{ marginBottom: '0.5rem' }}>Academic researchers and privacy advocates</li>
                <li style={{ marginBottom: '0.5rem' }}>Independent legal and policy experts</li>
                <li>Community representatives</li>
              </ul>

              <div style={{
                backgroundColor: 'var(--null-dark)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <p style={{ 
                  color: 'var(--null-light)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Why Defenders Only?
                </p>
                <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                  Mission clarity, optics, and precedent. The Foundation guards the covenant — 
                  extractors have conflicting incentives.
                </p>
              </div>
            </div>

            {/* Community Governance */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Community Governance</h3>
              
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem', fontWeight: '600' }}>
                Token Holders & Stewards
              </p>
              
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Voting on protocol parameters</li>
                <li style={{ marginBottom: '0.5rem' }}>Treasury allocation decisions</li>
                <li style={{ marginBottom: '0.5rem' }}>Protocol evolution proposals</li>
                <li>Community-driven initiatives</li>
              </ul>

              <div style={{
                backgroundColor: 'var(--null-dark)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <p style={{ 
                  color: 'var(--null-light)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Democratic Control
                </p>
                <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                  The community stays empowered through direct voting on key decisions 
                  that affect the protocol's direction.
                </p>
              </div>
            </div>

            {/* Domain Advisory Councils */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Domain Advisory Councils</h3>
              
              <p style={{ color: 'var(--null-accent)', marginBottom: '1rem', fontWeight: '600' }}>
                Enterprise Advisors
              </p>
              
              <ul style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Finance, Healthcare, SaaS sectors</li>
                <li style={{ marginBottom: '0.5rem' }}>Technical feasibility input</li>
                <li style={{ marginBottom: '0.5rem' }}>Cost models and integration issues</li>
                <li>Advisory role only — no direct control</li>
              </ul>

              <div style={{
                backgroundColor: 'var(--null-dark)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <p style={{ 
                  color: 'var(--null-light)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Structured Influence
                </p>
                <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                  Data storers get representation without veto power. They advise but do not govern.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--null-dark)',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(102, 102, 102, 0.2)',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Governance Layering</h3>
            <p style={{ color: 'var(--null-accent)', fontSize: '1rem', marginBottom: '1rem' }}>
              This structure ensures the covenant stays pure, the community stays empowered, 
              and extractors get influence through the advisory layer only.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#22c55e', fontWeight: '600', marginBottom: '0.5rem' }}>✓ Covenant Pure</div>
                <div style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>Defenders govern</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '0.5rem' }}>✓ Community Empowered</div>
                <div style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>Democratic control</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '0.5rem' }}>✓ Industry Heard</div>
                <div style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>Advisory influence</div>
              </div>
            </div>
          </div>
        </section>

        {/* Domain Advisory Councils */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Domain Advisory Councils (DACs)</h2>
          
          <div className="grid grid-3">
            {[
              { name: 'Art & Culture', desc: 'Digital deaccession ceremonies, cultural preservation' },
              { name: 'Healthcare', desc: 'Patient record lifecycle, HIPAA compliance' },
              { name: 'Finance & Compliance', desc: 'Financial record closure, regulatory audits' },
              { name: 'Infrastructure', desc: 'Storage systems, network protocols' },
              { name: 'Archives', desc: 'Library deaccession, memory institutions' },
              { name: 'Rights & Privacy', desc: 'Data protection, user rights' },
              { name: 'AI & Training Data', desc: 'Machine unlearning, model governance' },
              { name: 'Messaging & Social', desc: 'Private communication closure' },
            ].map((dac, index) => (
              <div key={index} className="card">
                <h3 style={{ fontSize: '1.125rem', color: 'var(--null-light)', marginBottom: '1rem' }}>{dac.name}</h3>
                <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>{dac.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Steering Committees */}
        <section style={{ marginBottom: '5rem' }}>
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Technical Steering Committees (TSCs)</h2>
            
            <div className="grid grid-2">
              <div>
                <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  Translate DAC requirements into technical specifications. Commission open-source implementations 
                  and ensure interoperability across the protocol ecosystem.
                </p>
                
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Core Functions</h3>
                <ul style={{ color: 'var(--null-accent)' }}>
                  <li>Technical specification development</li>
                  <li>Open-source implementation oversight</li>
                  <li>Interoperability standards</li>
                  <li>Security audit coordination</li>
                  <li>Protocol evolution guidance</li>
                </ul>
              </div>
              
              <div style={{ 
                backgroundColor: 'var(--null-dark)', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                border: '1px solid rgba(102, 102, 102, 0.2)'
              }}>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Working Groups</h3>
                <ul style={{ color: 'var(--null-accent)' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Cryptography & Security</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>SDK Development</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Canon Implementation</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Compliance Integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Foundation Roadmap */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Foundation Roadmap</h2>
          
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Financial Independence & Sustainability</h2>
            
            <div className="grid grid-2">
              <div>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Funding Sources</h3>
                <ul style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>ICO proceeds (seed capital)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Grants & NGO/philanthropy support</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Crypto public goods funds</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Obol tithe (1/13 of protocol revenue automatically directed to foundation treasury in NULL tokens)</span>
                  </li>
                </ul>
                
                <div style={{ 
                  backgroundColor: 'var(--null-dark)', 
                  padding: '1rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid rgba(102, 102, 102, 0.2)'
                }}>
                  <p style={{ 
                    color: 'var(--null-light)', 
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    Perpetual Core Revenue Stream
                  </p>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                    The Obol represents the ongoing cost of absence — a permanent sacrifice to the void, 
                    ensuring the foundation's neutrality and sustainability. One-thirteenth of protocol 
                    revenue is automatically directed to the foundation treasury in NULL tokens, 
                    written into the protocol itself to ensure ongoing stewardship.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Use of Funds</h3>
                <ul style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Governance & certification ("Null Verified")</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Public goods contracts (SDKs, APIs)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Independent audits, transparency logs</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>Advocacy + NGO partnerships</span>
                  </li>
                </ul>
                
                <div style={{ 
                  backgroundColor: 'var(--null-dark)', 
                  padding: '1rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid rgba(102, 102, 102, 0.2)'
                }}>
                  <h4 style={{ 
                    color: 'var(--null-light)', 
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    Goal
                  </h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Stay financially independent of any one implementer.
                  </p>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                    Guarantee neutrality and sustainability of the covenant.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              backgroundColor: 'var(--null-dark)', 
              borderRadius: '0.5rem', 
              border: '1px solid rgba(102, 102, 102, 0.2)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Timeline</h3>
              <p style={{ 
                color: 'var(--null-accent)', 
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                By Year 3+, the Foundation is largely self-funding from obols.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}