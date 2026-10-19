import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PersonalDashboard from './pages/PersonalDashboard';
import Analytics from './pages/Analytics';
import GroupDashboard from './pages/GroupDashboard';
import Groups from './components/Groups';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Features from './pages/Features';
import OAuthCallback from './pages/OAuthCallback';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize theme and sync token validation on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      // Pre-populate cached details immediately so UI loads fast
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth sync failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-deep)',
        gap: '1rem'
      }}>
        <Loader2 size={48} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>Loading FinSplit Workspace...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* PUBLIC & AUTH ROUTES */}
        <Route 
          path="/login" 
          element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/home" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register onRegisterSuccess={setUser} /> : <Navigate to="/home" replace />} 
        />
        <Route 
          path="/auth/callback" 
          element={<OAuthCallback onLoginSuccess={setUser} />} 
        />

        {/* FEATURES & EXPLANATION PAGE */}
        <Route 
          path="/features" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <Features user={user} />
              </>
            ) : (
              <Features user={null} />
            )
          } 
        />

        {/* PROTECTED ROUTES */}
        <Route 
          path="/home" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <Home user={user} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/groups" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <Groups user={user} onUserUpdate={setUser} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <PersonalDashboard user={user} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/analytics" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <Analytics user={user} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/profile" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <Profile user={user} onUserUpdate={setUser} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/group-dashboard" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <GroupDashboard user={user} onUserUpdate={setUser} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/group-dashboard/:groupId" 
          element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <GroupDashboard user={user} onUserUpdate={setUser} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* DEFAULT FALLBACK */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}
