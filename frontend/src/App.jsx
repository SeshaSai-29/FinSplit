import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PersonalDashboard from './pages/PersonalDashboard';
import GroupDashboard from './pages/GroupDashboard';
import Groups from './components/Groups';
import Navbar from './components/Navbar';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token validation on mount
  useEffect(() => {
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
        backgroundColor: '#080911',
        gap: '1rem'
      }}>
        <Loader2 size={48} style={{ color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontFamily: 'sans-serif', fontSize: '0.95rem' }}>Loading FinSplit Workspace...</p>
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
        {/* PUBLIC ROUTES */}
        <Route 
          path="/login" 
          element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/home" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register onRegisterSuccess={setUser} /> : <Navigate to="/home" replace />} 
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

        {/* DEFAULT FALLBACK */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}
