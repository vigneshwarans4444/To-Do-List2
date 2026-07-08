import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Zap, Shield, Layers } from 'lucide-react';
import styles from './auth.module.css';

// SVG inline Google logo for the button
const GoogleLogo = () => (
  <svg className={styles.googleLogo} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Simulated Google accounts pool — for demo / testing
const DEMO_ACCOUNTS = [
  { email: 'alice@gmail.com', name: 'Alice Johnson', photo: null },
  { email: 'bob@gmail.com',   name: 'Bob Williams',  photo: null },
  { email: 'carol@gmail.com', name: 'Carol Davis',   photo: null },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, dispatch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // If already logged in as active, go straight to app
  React.useEffect(() => {
    if (auth.status === 'active') navigate('/app', { replace: true });
    if (auth.status === 'pending_verification') navigate('/auth/verify-email', { replace: true });
  }, [auth.status, navigate]);

  const handleGoogleSignIn = () => {
    setShowAccountPicker(true);
  };

  const handleSelectAccount = (account) => {
    setShowAccountPicker(false);
    setIsLoading(true);

    // Simulate OAuth round-trip delay
    setTimeout(() => {
      setIsLoading(false);

      // Check if this email matches an existing verified account in localStorage
      const savedAuth = (() => {
        try { return JSON.parse(localStorage.getItem('flowtodo_auth')); } catch { return null; }
      })();

      const verifiedEmail = savedAuth?.user?.verifiedEmail;

      if (verifiedEmail && verifiedEmail !== account.email) {
        // Different email detected → redirect to Alternative Email page
        navigate(`/auth/alternative-email?hint=${encodeURIComponent(account.email)}`);
        return;
      }

      if (verifiedEmail && verifiedEmail === account.email) {
        // Returning verified user — log them in directly
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { ...account, verifiedEmail: account.email }
        });
        navigate('/app', { replace: true });
        return;
      }

      // Brand new user — go to profile setup with the chosen Google account pre-filled
      navigate('/auth/profile-setup', {
        state: { googleAccount: account }
      });
    }, 1400);
  };

  return (
    <div className={styles.page}>
      {/* Left hero panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandMark}>
          <div className={styles.brandIcon}>
            <CheckSquare size={26} strokeWidth={2.5} />
          </div>
          <span className={styles.brandName}>FlowTodo</span>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Get more done,<br />every single day.
          </h1>
          <p className={styles.heroSubtitle}>
            A premium task manager built for focus. Projects, priorities, subtasks, smart views — all in one beautifully simple workspace.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot}><Zap size={15} /></span>
              Lightning-fast task capture with smart quick-add
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot}><Layers size={15} /></span>
              Organize with Projects, Priorities &amp; Subtasks
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot}><Shield size={15} /></span>
              Secured by Google — your data, your email, always
            </li>
          </ul>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome back 👋</h2>
            <p className={styles.formSubtitle}>
              Sign in with your Google account to access your workspace. Your tasks are waiting for you.
            </p>
          </div>

          {!showAccountPicker ? (
            <>
              <button
                onClick={handleGoogleSignIn}
                className={styles.googleBtn}
                disabled={isLoading}
                id="google-signin-btn"
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <GoogleLogo />
                    Continue with Google
                  </>
                )}
              </button>

              <div
                className={`${styles.infoBanner} ${styles.infoBannerBlue}`}
                role="note"
              >
                <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  FlowTodo uses Google Sign-In for secure, passwordless access.
                  Your account is tied to one verified Google email for your security.
                </span>
              </div>
            </>
          ) : (
            /* Simulated Google account picker */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Choose a Google account to continue:
              </p>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a73e8, #a142f4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0
                  }}>
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowAccountPicker(false)}
                className={styles.linkBtn}
                style={{ marginTop: 8 }}
              >
                ← Back
              </button>
            </div>
          )}

          <p className={styles.formFooter}>
            New to FlowTodo?{' '}
            <button
              className={styles.linkBtn}
              onClick={() => navigate('/auth/profile-setup')}
            >
              Create a free account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
