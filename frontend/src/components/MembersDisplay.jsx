import React, { useState, useEffect } from 'react';
import { Users, Loader2, Trash2, LogOut, Edit3 } from 'lucide-react';

export default function MembersDisplay({ 
  members = [], 
  loading = false, 
  group = null, 
  currentUser = null,
  onGroupDeleted = null,
  onGroupLeft = null,
  onGroupRenamed = null
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Sync input value with group name when active group changes
  useEffect(() => {
    if (group) {
      setNewGroupName(group.name || '');
    }
  }, [group]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentUserId = currentUser?.id || currentUser?._id;
  const isOwner = group && group.createdBy === currentUserId;

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !group) return;

    setActionLoading(true);
    setActionError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.code}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to rename group');
      }

      if (onGroupRenamed) {
        onGroupRenamed(data.group);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group || !window.confirm(`Are you absolutely sure you want to delete the group "${group.name}"? This will delete all shared transactions and remove all members.`)) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete group');
      }

      if (onGroupDeleted) {
        onGroupDeleted();
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!group || !window.confirm(`Are you sure you want to leave the group "${group.name}"? You will lose access to all its transactions.`)) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.code}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to leave group');
      }

      if (onGroupLeft) {
        onGroupLeft();
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="glass-card members-card">
      <h3 className="members-card__title">
        <Users size={20} style={{ color: '#06b6d4' }} />
        <span>Group Members</span>
        <span className="members-count-badge">{members.length}</span>
      </h3>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.85rem' }}>
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="members-loading">
          <Loader2 className="animate-spin" size={24} style={{ color: '#06b6d4' }} />
          <span>Loading members...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="members-empty">
          <p>No members in this group</p>
        </div>
      ) : (
        <div className="members-list">
          {members.map((member) => {
            const isMemberOwner = group && group.createdBy === (member._id || member.id);
            return (
              <div key={member._id || member.id} className="member-row" id={`member-${member._id || member.id}`}>
                <div className="member-avatar">
                  {getInitials(member.name)}
                </div>
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-email">{member.email}</span>
                </div>
                {isMemberOwner && (
                  <span className="owner-badge" style={{
                    marginLeft: 'auto',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    color: '#06b6d4',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    fontWeight: 600
                  }}>Owner</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && group && (
        <div className="member-actions" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isOwner ? (
            <>
              {/* Rename Form */}
              <form onSubmit={handleRename} className="rename-group-section" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rename group..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', height: '36px' }}
                  required
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newGroupName.trim() || newGroupName.trim() === group.name}
                  className="btn-primary"
                  style={{ padding: '0 1rem', fontSize: '0.85rem', height: '36px', minWidth: '80px', borderRadius: '8px' }}
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <Edit3 size={14} />
                      <span>Rename</span>
                    </>
                  )}
                </button>
              </form>
              
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="btn-danger-custom"
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Group</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Leave Button */
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="btn-warning-custom"
              style={{
                width: '100%',
                height: '36px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>
                  <LogOut size={14} />
                  <span>Leave Group</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
