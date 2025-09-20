import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Users, FileText, Mail, Target } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: 'The Protocol', href: '/protocol', icon: Shield },
    { name: 'Governance', href: '/governance', icon: Users },
    { name: 'Roadmap', href: '/roadmap', icon: Target },
    { name: 'Whitepaper', href: '/whitepaper', icon: FileText },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">∅</div>
            <span>Null Foundation</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-links">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <div className="logo-icon" style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.875rem' }}>∅</div>
            <span>Null Foundation</span>
          </div>
          <div className="footer-copyright">
            © 2025 Null Foundation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
