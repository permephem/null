import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, FileText, Zap } from 'lucide-react';

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="section" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div className="text-center">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                width: '5rem', 
                height: '5rem', 
                backgroundColor: 'var(--null-accent)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'var(--null-dark)'
              }}>
                ∅
              </div>
              <h1 style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--null-light)' }}>Null</span>{' '}
                <span style={{ color: 'var(--null-accent)' }}>Protocol</span>
              </h1>
              <p style={{ 
                fontSize: '1.25rem', 
                color: 'var(--null-accent)', 
                maxWidth: '48rem', 
                margin: '0 auto 2rem',
                lineHeight: '1.6'
              }}>
                Digital networks have protocols for creation, exchange, and permanence, but none for closure.
                <br />
                <span style={{ color: 'var(--null-light)', fontWeight: '600' }}>
                  Null Protocol introduces absence as a digital primitive.
                </span>
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <Link to="/protocol" className="btn btn-primary">
                Explore Protocol
                <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
              </Link>
              <Link to="/whitepaper" className="btn btn-secondary">
                Read Whitepaper
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="section bg-null-gray">
        <div className="container">
          <div className="text-center mb-16">
            <h2 style={{ marginBottom: '1.5rem' }}>The Missing Primitive</h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              maxWidth: '48rem', 
              margin: '0 auto'
            }}>
              While blockchains provide immutable ledgers and NFTs anchor ownership, 
              society lacks an equally robust primitive for closure — the ability to 
              verifiably remove, deaccession, or memorialize digital information.
            </p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Current State</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Creation and permanence dominate; closure is absent',
                  'Deletion is claimed but rarely provable',
                  'Fragmented compliance across institutions',
                  'No symbolic void in digital culture'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '0.75rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#ef4444', marginRight: '0.5rem', marginTop: '0.25rem' }}>✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>With Null Protocol</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Verifiable, enforceable, and symbolic absence',
                  'Cryptographic proof of deletion',
                  'Interoperable closure standards',
                  'Ritualized digital closure ceremonies'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '0.75rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#22c55e', marginRight: '0.5rem', marginTop: '0.25rem' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Components */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 style={{ marginBottom: '1.5rem' }}>Protocol Architecture</h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              maxWidth: '48rem', 
              margin: '0 auto'
            }}>
              Three cryptographic instruments form the foundation of verifiable digital closure
            </p>
          </div>

          <div className="grid grid-3">
            <div className="text-center">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'var(--null-accent)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem'
              }}>
                <Shield size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Canon Ledger</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Append-only registry of closure attestations. Records hash of subject ID, 
                closure request, and proof-of-execution.
              </p>
            </div>

            <div className="text-center">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'var(--null-accent)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem'
              }}>
                <Zap size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Mask NFTs</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Cryptographic tombstones representing closure. Minted at the moment of deletion; 
                non-transferable and immutable.
              </p>
            </div>

            <div className="text-center">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'var(--null-accent)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem'
              }}>
                <FileText size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Null Warrants</h3>
              <p style={{ color: 'var(--null-accent)' }}>
                Enforceable instruments commanding deletion across storage domains. 
                Provide verifiable audit logs.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/protocol" className="btn btn-secondary">
              Learn More About the Protocol
              <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section bg-null-gray">
        <div className="container">
          <div className="text-center mb-16">
            <h2 style={{ marginBottom: '1.5rem' }}>Use Cases</h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              maxWidth: '48rem', 
              margin: '0 auto'
            }}>
              Null Protocol enables verifiable closure across diverse domains
            </p>
          </div>

          <div className="grid grid-3">
            {[
              { title: 'Art & Culture', desc: 'Archival closure of digital works and canonization via Mask NFTs' },
              { title: 'Healthcare', desc: 'Deletion of patient records after statutory retention periods' },
              { title: 'Finance & Compliance', desc: 'Lifecycle closure of financial records with audit trails' },
              { title: 'AI & Data Governance', desc: 'Proof that training data has been excluded (machine unlearning)' },
              { title: 'Messaging & Social', desc: 'Enforceable warrants for deletion of private messages' },
              { title: 'Archives & Memory', desc: 'Controlled deaccession in libraries and repositories' },
            ].map((useCase, index) => (
              <div key={index} className="card">
                <h3 style={{ color: 'var(--null-light)', marginBottom: '0.75rem' }}>{useCase.title}</h3>
                <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Join the Future of Digital Closure</h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--null-accent)', 
              marginBottom: '2rem'
            }}>
              Be part of the neutral foundation building the missing primitive for digital lifecycle governance.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <Link to="/governance" className="btn btn-primary">
                Learn About Governance
                <Users size={20} style={{ marginLeft: '0.5rem' }} />
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Get Involved
                <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}