import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProtocolPage } from './pages/ProtocolPage';
import { GovernancePage } from './pages/GovernancePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { WhitepaperPage } from './pages/WhitepaperPage';
import { ContactPage } from './pages/ContactPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/protocol" element={<ProtocolPage />} />
          <Route path="/governance" element={<GovernancePage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/whitepaper" element={<WhitepaperPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;