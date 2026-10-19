import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert, 
  IndianRupee,
  Target,
  Database,
  FileSpreadsheet,
  FileJson,
  Download
} from 'lucide-react';

export default function Profile({ user, onUserUpdate }) {
  const navigate = useNavigate();

  // Profile data fetch state
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Edit Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Financial Preferences (Monthly Budget Target) State
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState('');
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState('');
  const [budgetSuccess, setBudgetSuccess] = useState('');

  // Data Export & Backup State
  const [exportCsvLoading, setExportCsvLoading] = useState(false);
  const [exportJsonLoading, setExportJsonLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Danger Zone Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setFetchError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load profile details.');
      }

      const data = await response.json();
      setProfileData(data);
      setName(data.name);
      setEmail(data.email);
      setMonthlyBudgetLimit(data.monthlyBudgetLimit !== undefined ? data.monthlyBudgetLimit : (user?.monthlyBudgetLimit || 0));
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setBudgetError('');
    setBudgetSuccess('');

    const numericVal = Number(monthlyBudgetLimit);
    if (isNaN(numericVal) || numericVal < 0) {
      setBudgetError('Please enter a valid non-negative amount for the monthly budget target.');
      return;
    }

    setBudgetLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: name.trim() || user?.name, 
          email: email.trim().toLowerCase() || user?.email, 
          monthlyBudgetLimit: numericVal 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update monthly budget target.');
      }

      setProfileData((prev) => ({
        ...prev,
        monthlyBudgetLimit: data.monthlyBudgetLimit,
      }));

      if (onUserUpdate) {
        const updatedUser = {
          ...user,
          monthlyBudgetLimit: data.monthlyBudgetLimit,
        };
        onUserUpdate(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setBudgetSuccess('Monthly budget target saved successfully!');
      setTimeout(() => setBudgetSuccess(''), 3000);
    } catch (err) {
      setBudgetError(err.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const fetchExportPayload = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/export-data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to generate export backup data.');
    }

    return await response.json();
  };

  const handleExportCSV = async () => {
    setExportError('');
    setExportCsvLoading(true);
    try {
      const payload = await fetchExportPayload();
      
      const headers = [
        'Type',
        'Description',
        'Category',
        'Amount',
        'Currency',
        'Scope',
        'Date',
        'Split/Settlement Details'
      ];

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = [];

      // Add personal transactions
      (payload.personalTransactions || []).forEach((t) => {
        rows.push([
          t.type || 'expense',
          t.description || '',
          t.category || '',
          t.amount || 0,
          'INR',
          'Personal',
          t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
          'N/A'
        ].map(escapeCsv).join(','));
      });

      // Add group transactions
      (payload.groupTransactions || []).forEach((t) => {
        const payerName = t.userId && typeof t.userId === 'object' ? t.userId.name : 'Unknown';
        const splitDetail = `Payer: ${payerName} | Mode: ${t.splitType || 'equal'} | Splits: ${t.splits?.length || 0}`;
        rows.push([
          t.type || 'expense',
          t.description || '',
          t.category || '',
          t.amount || 0,
          'INR',
          t.category === 'Settlement' ? 'Group Settlement' : 'Group',
          t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
          splitDetail
        ].map(escapeCsv).join(','));
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().split('T')[0];
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FinSplit_Transactions_Backup_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
      setExportError(err.message);
    } finally {
      setExportCsvLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setExportError('');
    setExportJsonLoading(true);
    try {
      const payload = await fetchExportPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().split('T')[0];

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FinSplit_Data_Backup_${todayStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('JSON export error:', err);
      setExportError(err.message);
    } finally {
      setExportJsonLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim() || !email.trim()) {
      setProfileError('All fields are required.');
      return;
    }

    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      // Update local profile stats state
      setProfileData(prev => ({
        ...prev,
        name: data.name,
        email: data.email
      }));

      // Update global context user state
      if (onUserUpdate) {
        const updatedUser = {
          ...user,
          name: data.name,
          email: data.email
        };
        onUserUpdate(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password.');
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const handleDeleteAccount = async () => {
    setPasswordError('');
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account.');
      }

      // Log out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onUserUpdate) {
        onUserUpdate(null);
      }
      setShowDeleteConfirm(false);
      navigate('/login');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitials = (userName) => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      day: 'numeric',
    });
  };

  if (loadingProfile) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={40} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading settings details...</p>
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Settings size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--brand-primary)' }} />
          User Profile & Settings
        </h1>
        <p className="page-subtitle">
          Manage your personal details, modify security details, and adjust user preferences.
        </p>
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{fetchError}</span>
        </div>
      )}

      {profileData && (
        <div className="profile-grid">
          {/* Left Column: Overview and Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Overview Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2.5rem 2rem' }}>
              <div 
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'var(--brand-primary-subtle)',
                  border: '2px solid var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                }}
              >
                {getInitials(profileData.name)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>{profileData.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{profileData.email}</p>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }} />

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Member Since</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(profileData.createdAt)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Groups</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                    {profileData.groupCount} group{profileData.groupCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transactions</span>
                  <span style={{ color: 'var(--brand-positive)', fontWeight: 600 }}>
                    {profileData.standaloneTxnCount} records
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Preferences Card */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: 'var(--brand-primary)' }} />
                <span>Financial Preferences</span>
              </h3>
              
              <form onSubmit={handleUpdateBudget} autoComplete="off">
                {budgetError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{budgetError}</span>
                  </div>
                )}
                {budgetSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    <CheckCircle2 size={18} />
                    <span>{budgetSuccess}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="monthly-budget-input">
                    Monthly Budget Target (₹)
                  </label>
                  <div className="input-wrapper">
                    <IndianRupee className="input-icon" size={18} />
                    <input
                      id="monthly-budget-input"
                      className="form-input"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 15000"
                      value={monthlyBudgetLimit}
                      onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                      autoComplete="off"
                      disabled={budgetLoading}
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    Set to 0 to disable monthly personal budget tracking.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={budgetLoading}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                >
                  {budgetLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving Target...</span>
                    </>
                  ) : (
                    <span>Save Financial Preferences</span>
                  )}
                </button>
              </form>
            </div>

            {/* Data Export & Backup Card */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} style={{ color: 'var(--brand-primary)' }} />
                <span>Data Export & Backup</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Export and download your complete personal transaction ledger, group expenses, and settlements for offline accounting or backup.
              </p>

              {exportError && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} />
                  <span>{exportError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleExportCSV}
                  disabled={exportCsvLoading || exportJsonLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                >
                  {exportCsvLoading ? (
                    <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <FileSpreadsheet size={18} style={{ color: 'var(--brand-primary)' }} />
                  )}
                  <span>{exportCsvLoading ? 'Generating CSV...' : 'Export as CSV (.csv)'}</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleExportJSON}
                  disabled={exportCsvLoading || exportJsonLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                >
                  {exportJsonLoading ? (
                    <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <FileJson size={18} style={{ color: 'var(--brand-primary)' }} />
                  )}
                  <span>{exportJsonLoading ? 'Generating JSON...' : 'Export as JSON (.json)'}</span>
                </button>
              </div>
            </div>

            {/* Danger Zone Card */}
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
                <ShieldAlert size={20} />
                <span>Danger Zone</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Deleting your account will erase all standalone transaction ledger entries and split settings permanently. This cannot be undone.
              </p>
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  fontSize: '0.92rem',
                }}
              >
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editing and Security panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Edit Profile Info Panel */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} style={{ color: 'var(--brand-primary)' }} />
                <span>Edit Profile Information</span>
              </h3>
              
              <form onSubmit={handleUpdateProfile} autoComplete="off">
                {profileError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} />
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                    <CheckCircle2 size={18} />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      id="profile-name"
                      className="form-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="off"
                      disabled={profileLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input
                      id="profile-email"
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      disabled={profileLoading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={profileLoading || (name.trim() === profileData.name && email.trim().toLowerCase() === profileData.email)}
                  style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </form>
            </div>

            {/* Change Password Panel */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} style={{ color: 'var(--brand-primary)' }} />
                <span>Change Password</span>
              </h3>

              <form onSubmit={handleChangePassword} autoComplete="off">
                {passwordError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                    <CheckCircle2 size={18} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="current-password">Current Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="current-password"
                      className="form-input"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="off"
                      disabled={passwordLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="new-password"
                      className="form-input"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="off"
                      disabled={passwordLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="confirm-password"
                      className="form-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="off"
                      disabled={passwordLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Changing Password...</span>
                    </>
                  ) : (
                    <span>Change Password</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Portal Overlay */}
      {showDeleteConfirm && createPortal(
        <div
          className="settle-modal-overlay"
          onClick={() => {
            if (!deleteLoading) setShowDeleteConfirm(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="settle-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
              margin: 'auto 0',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ color: '#EF4444', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Delete Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>
              Are you absolutely sure you want to delete your account? This will permanently erase your transaction history and user profile. This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                }}
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
