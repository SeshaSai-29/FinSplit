import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, LogOut, Home, Users, UsersRound, LayoutDashboard, Settings, Menu, X, BarChart3, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isGroupDashboardActive = location.pathname.startsWith('/group-dashboard');

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <Wallet size={26} style={{ color: 'var(--brand-primary)' }} />
          <span>FinSplit</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          <NavLink 
            to="/features" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            title="App Features & Guide"
          >
            <BookOpen size={18} />
            <span>Features</span>
          </NavLink>
          <NavLink 
            to="/home" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>
          <NavLink 
            to="/group-dashboard" 
            className={isGroupDashboardActive ? 'nav-link active' : 'nav-link'}
          >
            <UsersRound size={18} />
            <span>Group Dashboard</span>
          </NavLink>
          <NavLink 
            to="/groups" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <Users size={18} />
            <span>Groups</span>
          </NavLink>
        </div>

        {/* Desktop & Mobile User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Light / Dark Mode Toggle Button */}
          <ThemeToggle />

          <div className="nav-user" ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              className="user-avatar" 
              title={user?.name || 'User Profile'}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {getInitials(user?.name)}
            </div>

            {dropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '190px',
                  padding: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  zIndex: 1000,
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                }}
              >
                <div 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    borderBottom: '1px solid var(--border-color)', 
                    padding: '0.4rem 0.5rem 0.6rem 0.5rem',
                    marginBottom: '0.2rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user?.name}
                >
                  {user?.name}
                </div>
                
                <button 
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Settings size={16} />
                  <span>Profile Settings</span>
                </button>

                <button 
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-danger)',
                    textAlign: 'left',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-danger-subtle)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button 
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu">
          <NavLink 
            to="/features" 
            className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BookOpen size={18} />
            <span>Features</span>
          </NavLink>

          <NavLink 
            to="/home" 
            className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>

          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/analytics" 
            className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>

          <NavLink 
            to="/group-dashboard" 
            className={isGroupDashboardActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UsersRound size={18} />
            <span>Group Dashboard</span>
          </NavLink>

          <NavLink 
            to="/groups" 
            className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Users size={18} />
            <span>Groups</span>
          </NavLink>

          <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '0.4rem', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings size={18} />
              <span>Profile Settings</span>
            </NavLink>

            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="mobile-nav-link"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

