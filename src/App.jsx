import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MapExplorer from './pages/MapExplorer';
import MatchesList from './pages/MatchesList';
import MatchDetail from './pages/MatchDetail';
import Registration from './pages/Registration';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<MapExplorer />} />
        <Route path="/matches" element={<MatchesList />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/register" element={<Registration />} />
      </Routes>
    </>
  );
}

export default App;
