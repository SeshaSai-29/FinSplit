import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, CreditCard, Users, Landmark, AlertCircle, ArrowRight } from 'lucide-react';

export default function Home({ user }) {
  const navigate = useNavigate();
  const groupCount = user?.groupIds?.length || 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}!</h1>
        <p className="page-subtitle">Here is a quick overview of your personal finance dashboard workspace.</p>
      </div>

      <div className="home-grid">
        <div className="workspace-card">
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.25rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} style={{ color: '#8b5cf6' }} />
              <span>User Profile Info</span>
            </h2>
            
            <div className="user-profile-summary">
              <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="profile-details">
                <h3>{user?.name}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <Mail size={14} style={{ color: '#9ca3af' }} />
                  <span>{user?.email}</span>
                </p>
                <div style={{ marginTop: '0.4rem' }}>
                  {groupCount === 0 ? (
                    <span className="badge badge-purple">Standalone User Workspace</span>
                  ) : (
                    <span className="badge badge-cyan">{groupCount} Group{groupCount > 1 ? 's' : ''} Associated</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#ffffff' }}>Your Current Workspace</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                {groupCount === 0 
                  ? "You currently operate in standalone mode. You can track individual expenses, or join/create a shared group for automatic expense splitting with family, roommates, or team members."
                  : `You are connected to ${groupCount} active group workspace(s). Head to the Groups page to inspect details, invite members, or join new groups.`}
              </p>
              <button className="btn-primary" onClick={() => navigate('/groups')}>
                <span>Manage Groups</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="info-card-list">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Personal Balance</span>
                <Landmark size={18} style={{ color: '#06b6d4' }} />
              </div>
              <div className="stat-value">$0.00</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standalone personal assets</p>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Active Groups</span>
                <Users size={18} style={{ color: '#8b5cf6' }} />
              </div>
              <div className="stat-value">{groupCount}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connected shared networks</p>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: '#22d3ee' }} />
            <span>Phase 1 Sandbox</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            We've successfully created the basic scaffolding, secure routes, persistent mock file database, and frontend styling frameworks.
          </p>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.5rem' }}>Completed Milestones:</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ Scaffolding folders & layouts</li>
              <li>✓ Secure JSON-backed models</li>
              <li>✓ JWT Register & Login routes</li>
              <li>✓ 6-char group codes</li>
              <li>✓ Beautiful glassmorphic UI screens</li>
            </ul>
          </div>
          <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Note: Expense tracking, ledger balance logs, and split percentage algorithms will be unlocked in Phase 2.
          </div>
        </div>
      </div>
    </div>
  );
}
