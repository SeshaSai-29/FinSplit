import React, { useState, useEffect } from 'react';
import { Plus, LogIn, Copy, Check, Users, AlertCircle, Loader2 } from 'lucide-react';

export default function Groups({ user, onUserUpdate }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState('');
  const [createBudget, setCreateBudget] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Fetch groups on mount
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  // Sync profile details so the top bar and workspace state updates
  const syncProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        onUserUpdate(data);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreateLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: createName, budget: createBudget ? Number(createBudget) : 0 })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not create group.');
      }

      setSuccess(`Group "${data.group.name}" created successfully with code: ${data.group.code}`);
      setCreateName('');
      setCreateBudget('');
      
      // Refresh list
      await fetchGroups();
      // Sync global user state
      await syncProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (joinCode.trim().length !== 6) {
      setError('Group code must be exactly 6 alphanumeric characters');
      return;
    }

    setJoinLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: joinCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not join group.');
      }

      setSuccess(`Successfully joined group "${data.group.name}"!`);
      setJoinCode('');

      // Refresh list
      await fetchGroups();
      // Sync global user state
      await syncProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Groups</h1>
        <p className="page-subtitle">Create a shared workspace to split expenses, or join your friends' existing groups.</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="groups-container">
        {/* LEFT COLUMN: ACTIVE GROUPS */}
        <div className="glass-card group-list-card">
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={22} style={{ color: '#06b6d4' }} />
            <span>Your Connected Groups</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Click a group code badge below to copy the invitation code to your clipboard.
          </p>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p style={{ fontWeight: 600 }}>No groups associated yet</p>
              <p style={{ fontSize: '0.85rem' }}>
                You are currently in solo mode. Fill in the forms on the right to start working together!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groups.map((group) => (
                <div key={group.code} className="group-item">
                  <div className="group-info">
                    <h4>{group.name}</h4>
                    <p>{group.members.length} member{group.members.length > 1 ? 's' : ''}</p>
                  </div>
                  <div 
                    className="code-display" 
                    onClick={() => handleCopyCode(group.code)}
                    title="Click to copy code"
                  >
                    <span>{group.code}</span>
                    {copiedCode === group.code ? (
                      <Check size={14} style={{ color: '#10b981' }} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIONS */}
        <div className="group-actions-column">
          {/* CREATE GROUP CARD */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Plus size={20} style={{ color: '#8b5cf6' }} />
              <span>Create New Group</span>
            </h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label" htmlFor="groupName">Group Name</label>
                <div className="input-wrapper" style={{ display: 'block' }}>
                  <input
                    id="groupName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Roomies 2026, Summer Trip"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="groupBudget">Group Budget (Optional)</label>
                <div className="input-wrapper" style={{ display: 'block' }}>
                  <input
                    id="groupBudget"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="e.g. 500 (Set group limit)"
                    value={createBudget}
                    onChange={(e) => setCreateBudget(e.target.value)}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%' }}
                disabled={createLoading}
              >
                {createLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Creating Group...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Create Group</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* JOIN GROUP CARD */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <LogIn size={20} style={{ color: '#22d3ee' }} />
              <span>Join Existing Group</span>
            </h2>
            <form onSubmit={handleJoinGroup}>
              <div className="form-group">
                <label className="form-label" htmlFor="joinCode">6-Character Invitation Code</label>
                <div className="input-wrapper" style={{ display: 'block' }}>
                  <input
                    id="joinCode"
                    type="text"
                    className="form-input"
                    placeholder="e.g. AX7B99"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={6}
                    style={{ paddingLeft: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', background: 'var(--secondary-glow)' }}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Joining Group...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Join Group</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
