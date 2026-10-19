import React, { useState, useEffect } from 'react';
import { Users, Loader2, Trash2, LogOut, Edit3, Edit2 } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function MembersDisplay({ 
  members = [], 
  loading = false, 
  group = null, 
  currentUser = null,
  onGroupDeleted = null,
  onGroupLeft = null,
  onGroupRenamed = null,
  onManageBudget = null
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null
  });

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

  const openDeleteGroupModal = () => {
    if (!group) return;
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Group',
      message: `Are you absolutely sure you want to delete the group "${group.name}"? This will delete all shared transactions and remove all members.`,
      confirmText: 'Delete Group',
      onConfirm: executeDeleteGroup
    });
  };

  const executeDeleteGroup = async () => {
    if (!group) return;

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

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (onGroupDeleted) {
        onGroupDeleted();
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openLeaveGroupModal = () => {
    if (!group) return;
    setConfirmModalConfig({
      isOpen: true,
      title: 'Leave Group',
      message: `Are you sure you want to leave the group "${group.name}"? You will lose access to all its transactions.`,
      confirmText: 'Leave Group',
      onConfirm: executeLeaveGroup
    });
  };

  const executeLeaveGroup = async () => {
    if (!group) return;

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

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
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
        <Users size={20} style={{ color: 'var(--brand-primary)' }} />
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
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--brand-primary)' }} />
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
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--brand-primary)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: 600
                  }}>Owner</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && group && (
        <div className="member-actions" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isOwner ? (
            <>
              {/* Rename Form */}
              <form onSubmit={handleRename} autoComplete="off" className="rename-group-section" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rename group..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', height: '36px' }}
                  autoComplete="off"
                  required
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newGroupName.trim() || newGroupName.trim() === group.name}
                  className="btn-primary"
                  style={{ padding: '0 1rem', fontSize: '0.85rem', height: '36px', minWidth: '80px', borderRadius: '6px' }}
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
              
              {/* Budget Management Button */}
              {onManageBudget && (
                <button
                  type="button"
                  onClick={onManageBudget}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: 'var(--brand-primary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  id="members-display-manage-budget-btn"
                >
                  <Edit2 size={15} />
                  <span>
                    {group.budget && group.budget > 0
                      ? 'Edit Budget'
                      : 'Set Budget'}
                  </span>
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={openDeleteGroupModal}
                disabled={actionLoading}
                className="btn-danger"
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
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
              onClick={openLeaveGroupModal}
              disabled={actionLoading}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
                borderRadius: '6px',
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

      <ConfirmDeleteModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        isDeleting={actionLoading}
      />
    </div>
  );
}
