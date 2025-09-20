import { FileText, Download, ExternalLink } from 'lucide-react';

export function WhitepaperPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            backgroundColor: 'var(--null-accent)', 
            borderRadius: '0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem'
          }}>
            <FileText size={32} color="var(--null-dark)" />
          </div>
          <h1 style={{ marginBottom: '1.5rem' }}>Null Protocol Whitepaper v1.0</h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--null-accent)', 
            maxWidth: '48rem', 
            margin: '0 auto'
          }}>
            The complete technical specification and vision for verifiable digital closure
          </p>
        </div>

        {/* Whitepaper Info */}
        <div className="card mb-12">
          <div className="grid grid-2">
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Document Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: 'var(--null-accent)', marginRight: '0.75rem' }}>Published:</span>
                  <span style={{ color: 'var(--null-light)' }}>Today</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: 'var(--null-accent)', marginRight: '0.75rem' }}>Author:</span>
                  <span style={{ color: 'var(--null-light)' }}>Null Protocol Foundation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: 'var(--null-accent)', marginRight: '0.75rem' }}>Version:</span>
                  <span style={{ color: 'var(--null-light)' }}>v1.0</span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--null-dark)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem', 
              border: '1px solid rgba(102, 102, 102, 0.2)'
            }}>
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Download Options</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a 
                  href="/The_Null_Protocol_v29.pdf" 
                  download="The_Null_Protocol_v29.pdf"
                  className="btn btn-primary" 
                  style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Download size={16} style={{ marginRight: '0.5rem' }} />
                  PDF Version
                </a>
                <a 
                  href="/null_protocol_whitepaper_v1.0.tex" 
                  download="null_protocol_whitepaper_v1.0.tex"
                  className="btn btn-secondary" 
                  style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ExternalLink size={16} style={{ marginRight: '0.5rem' }} />
                  LaTeX Source
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Abstract</h2>
          <div className="card">
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              lineHeight: '1.6', 
              marginBottom: '1.5rem'
            }}>
              Digital networks have protocols for creation, exchange, and permanence, but none for closure. 
              <strong style={{ color: 'var(--null-light)' }}> Null Protocol</strong> introduces absence as a digital primitive, 
              enabling verifiable, enforceable, and symbolic lifecycle governance of digital records, assets, and identities.
            </p>
            
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              lineHeight: '1.6', 
              marginBottom: '1.5rem'
            }}>
              The protocol defines three cryptographic instruments — Canon, Mask NFTs, and Null Warrants — 
              which, together with the Obol of the 13, form a neutral framework for deletion, archival closure, 
              and rights-driven absence.
            </p>
            
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              lineHeight: '1.6', 
              marginBottom: '1.5rem'
            }}>
              To ensure trustless verifiability, Null Protocol integrates Zero-Knowledge Proofs (ZKPs), 
              Verifiable Deletion Proofs (VDPs), Trusted Execution Environments (TEEs), and Decentralized 
              Identity (DID) standards, enabling custodians to prove compliance without revealing underlying data.
            </p>
            
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              lineHeight: '1.6'
            }}>
              Null Protocol is stewarded by a neutral foundation, supported by Domain Advisory Councils (DACs) 
              and Technical Steering Committees (TSCs), ensuring broad applicability across art, healthcare, 
              finance, archives, AI, and beyond.
            </p>
          </div>
        </section>

        {/* Key Sections Preview */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Key Sections</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Problem Statement */}
            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Problem Statement</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Imbalance of primitives: Creation and permanence dominate; closure is absent',
                  'Unverifiable absence: Deletion is claimed but rarely provable',
                  'Fragmented compliance: Institutions lack interoperable closure standards',
                  'Symbolic void: Physical culture ritualizes closure, but digital culture does not'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '0.75rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#ef4444', marginRight: '0.5rem', marginTop: '0.25rem' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Use Cases */}
            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Use Cases</h3>
              <div className="grid grid-2">
                <div>
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>Art & Culture</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Archival closure of digital or mutating works. Canonization of significant works via Mask NFTs.
                  </p>
                  
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>Healthcare</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Deletion of patient records after statutory retention. Proof-of-compliance with health privacy mandates.
                  </p>
                  
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>Finance & Compliance</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                    Lifecycle closure of financial records. Cryptographically verifiable deletion audits for regulators.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>AI & Data Governance</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Proof that training data has been excluded ("machine unlearning"). Attested deletion of personal data from models.
                  </p>
                  
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>Messaging & Social Media</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Enforceable warrants for deletion of private messages. User-initiated closures with canonical receipts.
                  </p>
                  
                  <h4 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>Archives & Memory</h4>
                  <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                    Controlled deaccession in libraries and repositories. Balance between cultural memory and mandated erasure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Download CTA */}
        <section className="text-center">
          <div className="card" style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Ready to Dive Deeper?</h2>
            <p style={{ 
              color: 'var(--null-accent)', 
              marginBottom: '2rem',
              maxWidth: '32rem',
              margin: '0 auto 2rem'
            }}>
              Download the complete whitepaper to explore the full technical specification, 
              implementation details, and research foundations of Null Protocol.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <a 
                href="/The_Null_Protocol_v29.pdf" 
                download="The_Null_Protocol_v29.pdf"
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Download size={20} style={{ marginRight: '0.5rem' }} />
                Download PDF
              </a>
              <a 
                href="/null_protocol_whitepaper_v1.0.tex" 
                download="null_protocol_whitepaper_v1.0.tex"
                className="btn btn-secondary"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ExternalLink size={20} style={{ marginRight: '0.5rem' }} />
                Download LaTeX Source
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}