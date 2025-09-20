import { Mail, Users, MessageSquare, Github, Twitter, Linkedin } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 style={{ marginBottom: '1.5rem' }}>Get Involved</h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--null-accent)', 
            maxWidth: '48rem', 
            margin: '0 auto'
          }}>
            Join the Null Protocol community and help build the future of verifiable digital closure. 
            Whether you're a developer, researcher, or advocate, there's a place for you.
          </p>
        </div>

        {/* Contact Methods */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Connect With Us</h2>
          
          <div className="grid grid-3">
            <div className="card text-center">
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
                <Mail size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>General Inquiries</h3>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                Questions about the protocol, partnerships, or general information
              </p>
              <a 
                href="mailto:hello@nullprotocol.org"
                className="btn btn-primary"
              >
                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                hello@nullprotocol.org
              </a>
            </div>

            <div className="card text-center">
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
                <Users size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Partnerships</h3>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                Interested in implementing Null Protocol or becoming a DAC member
              </p>
              <a 
                href="mailto:partnerships@nullprotocol.org"
                className="btn btn-secondary"
              >
                <Users size={16} style={{ marginRight: '0.5rem' }} />
                partnerships@nullprotocol.org
              </a>
            </div>

            <div className="card text-center">
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
                <MessageSquare size={32} color="var(--null-dark)" />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Technical Support</h3>
              <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                Developer questions, SDK issues, or technical implementation help
              </p>
              <a 
                href="mailto:dev@nullprotocol.org"
                className="btn btn-secondary"
              >
                <MessageSquare size={16} style={{ marginRight: '0.5rem' }} />
                dev@nullprotocol.org
              </a>
            </div>
          </div>
        </section>

        {/* Community Channels */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Community Channels</h2>
          
          <div className="grid grid-4">
            <a 
              href="https://github.com/nullprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: 'none', transition: 'border-color 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '0.75rem'
                }}>
                  <Github size={20} color="var(--null-dark)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--null-light)' }}>GitHub</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                Source code, issues, and development discussions
              </p>
            </a>

            <a 
              href="https://twitter.com/nullprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: 'none', transition: 'border-color 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '0.75rem'
                }}>
                  <Twitter size={20} color="var(--null-dark)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--null-light)' }}>Twitter</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                Updates, announcements, and community discussions
              </p>
            </a>

            <a 
              href="https://linkedin.com/company/nullprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: 'none', transition: 'border-color 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '0.75rem'
                }}>
                  <Linkedin size={20} color="var(--null-dark)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--null-light)' }}>LinkedIn</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                Professional network and business partnerships
              </p>
            </a>

            <a 
              href="https://discord.gg/nullprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: 'none', transition: 'border-color 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: 'var(--null-accent)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '0.75rem'
                }}>
                  <MessageSquare size={20} color="var(--null-dark)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--null-light)' }}>Discord</h3>
              </div>
              <p style={{ color: 'var(--null-accent)', fontSize: '0.875rem' }}>
                Real-time community chat and collaboration
              </p>
            </a>
          </div>
        </section>

        {/* Ways to Contribute */}
        <section style={{ marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '3rem', textAlign: 'center' }}>Ways to Contribute</h2>
          
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1.5rem' }}>For Developers</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Contribute to core SDK development (Rust, Go, TypeScript)',
                  'Build custodian integrations (Arweave, Filecoin, AWS, Azure)',
                  'Develop client applications and wallets',
                  'Implement cryptographic enhancements (ZKPs, VDPs, TEEs)',
                  'Create compliance layer integrations'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#22c55e', marginRight: '0.75rem', marginTop: '0.25rem' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1.5rem' }}>For Researchers</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Advance homomorphic commitments research',
                  'Develop Oblivious RAM (ORAM) techniques',
                  'Explore post-quantum cryptography applications',
                  'Study verifiable deletion proof systems',
                  'Research privacy-preserving audit mechanisms'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#3b82f6', marginRight: '0.75rem', marginTop: '0.25rem' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1.5rem' }}>For Domain Experts</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Join Domain Advisory Councils (DACs)',
                  'Define sector-specific requirements',
                  'Pilot protocol implementations',
                  'Establish compliance frameworks',
                  'Guide technical specifications'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#a855f7', marginRight: '0.75rem', marginTop: '0.25rem' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--null-light)', marginBottom: '1.5rem' }}>For Advocates</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Promote digital rights and privacy',
                  'Advocate for regulatory adoption',
                  'Organize community events and workshops',
                  'Create educational content and documentation',
                  'Build partnerships with institutions'
                ].map((item, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    color: 'var(--null-accent)'
                  }}>
                    <span style={{ color: '#eab308', marginRight: '0.75rem', marginTop: '0.25rem' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Foundation Information */}
        <section style={{ marginBottom: '5rem' }}>
          <div className="card">
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Null Protocol Foundation</h2>
            
            <div className="grid grid-2">
              <div>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Mission</h3>
                <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  To provide the missing primitive for digital closure through neutral stewardship, 
                  open standards, and cryptographic verifiability. We believe that if permanence 
                  defines one boundary of digital existence, closure defines the other.
                </p>
                
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Values</h3>
                <ul style={{ color: 'var(--null-accent)' }}>
                  <li>Neutral governance and stewardship</li>
                  <li>Open standards and interoperability</li>
                  <li>Cryptographic verifiability</li>
                  <li>Privacy-preserving technologies</li>
                  <li>Community-driven development</li>
                </ul>
              </div>
              
              <div>
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Legal Status</h3>
                <p style={{ color: 'var(--null-accent)', marginBottom: '1.5rem' }}>
                  The Null Protocol Foundation is incorporated as a non-profit organization 
                  dedicated to advancing the protocol and supporting its ecosystem. 
                  We operate with transparency and accountability to our community.
                </p>
                
                <h3 style={{ color: 'var(--null-light)', marginBottom: '1rem' }}>Contact Information</h3>
                <div style={{ color: 'var(--null-accent)' }}>
                  <p>Null Protocol Foundation</p>
                  <p>Email: foundation@nullprotocol.org</p>
                  <p>Legal: legal@nullprotocol.org</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="text-center">
          <div className="card" style={{ maxWidth: '32rem', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Stay Updated</h2>
            <p style={{ color: 'var(--null-accent)', marginBottom: '2rem' }}>
              Subscribe to our newsletter for protocol updates, research developments, 
              and community announcements.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--null-dark)',
                  border: '1px solid rgba(102, 102, 102, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'var(--null-light)',
                  fontSize: '1rem'
                }}
              />
              <button className="btn btn-primary">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}