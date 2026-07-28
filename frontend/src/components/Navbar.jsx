import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, Home, Users, UsersRound, LayoutDashboard } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

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

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
        <Wallet size={28} style={{ color: '#06b6d4' }} />
        <span>FinSplit</span>
      </div>

      <div className="nav-links">
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
          to="/group-dashboard" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
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

      <div className="nav-user">
        <div className="user-avatar" title={user?.name}>
          {getInitials(user?.name)}
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
