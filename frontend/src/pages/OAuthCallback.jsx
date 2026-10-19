import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OAuthCallback({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate('/login?error=' + encodeURIComponent('Authentication token missing from Google callback'), { replace: true });
      return;
    }

    const completeOAuthLogin = async () => {
      try {
        // Store JWT token immediately
        localStorage.setItem('token', token);

        // Fetch user data using the new token
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Could not fetch user profile with received token');
        }

        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));

        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }

        // Redirect to user's account dashboard/home
        navigate('/home', { replace: true });
      } catch (err) {
        console.error('OAuth token verification failed:', err);
        setErrorMsg(err.message || 'Failed to complete Google authentication');
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(err.message || 'Authentication error')}`, { replace: true });
        }, 1500);
      }
    };

    completeOAuthLogin();
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-deep)',
      gap: '1.25rem',
      padding: '1.5rem'
    }}>
      {errorMsg ? (
        <div className="alert alert-danger" style={{ maxWidth: '400px' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      ) : (
        <>
          <Loader2 size={44} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            Signing in with Google...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Finalizing your session and loading your account
          </p>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
