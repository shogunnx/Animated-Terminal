import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import BootScreen from './components/BootScreen';
import Layout from './components/Layout';
import Dashboard from './pages/index';
import CharacterPage from './pages/characters/CharacterPage';
import CharactersIndex from './pages/characters/CharactersIndex';
import RoomPage from './pages/rooms/RoomPage';
import TimelinePage from './pages/timeline/index';
import RaidsPage from './pages/raids/index';
import RestrictedPage from './pages/restricted/index';
import EvolutionsPage from './pages/evolutions/index';
import RelationshipsPage from './pages/relationships/index';

function AppContent() {
  const [booted, setBooted] = useState(false);
  const location = useLocation();

  // Reset scroll on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/characters" element={<CharactersIndex />} />
        <Route path="/characters/:id" element={<CharacterPage />} />
        <Route path="/rooms/:id" element={<RoomPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/raids" element={<RaidsPage />} />
        <Route path="/restricted" element={<RestrictedPage />} />
        <Route path="/evolutions" element={<EvolutionsPage />} />
        <Route path="/relationships" element={<RelationshipsPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
