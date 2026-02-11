import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import DualDetail from './pages/DualDetail.jsx';
import Profile from './pages/Profile.jsx';
import Rankings from './pages/Rankings.jsx';
import Friends from './pages/Friends.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Market from './pages/Market.jsx';
import TeamPage from './pages/TeamPage.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/dual/:id" element={<DualDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/market" element={<Market />} />
          <Route path="/team/:id" element={<TeamPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}
