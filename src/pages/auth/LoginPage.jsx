import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadAccounts } from '../../context/AuthContext';
import { CheckSquare, Zap, Shield, Layers, UserPlus, ChevronRight, ArrowLeft } from 'lucide-react';
import styles from './auth.module.css';
import accountStyles from './accountPicker.module.css';

// SVG inline Google logo
const GoogleLogo = () => (
  <svg className={styles.googleLogo} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Avatar component helper
function Avatar({ name, photo, size = 44 }) {
  const initials = name ? name.trim().charAt(0).toUpperCase() : '?';
  const hue = name
    ? (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 17) % 360
    : 200;

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: photo ? 'transparent' : `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,45%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.38,
        flexShrink: 0, overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {photo
        ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, dispatch } = useAuth();

  // Load actually registered accounts from localStorage
  const registeredAccounts = useMemo(() => loadAccounts(), []);

  const [isLoading, setIsLoading]               = useState(false);
  const [loadingEmail, setLoadingEmail]         = useState('');
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const [googleStep, setGoogleStep]             = useState('list'); // 'list' | 'input'
  const [customEmail, setCustomEmail]           = useState('');
  const [emailError, setEmailError]             = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (auth.status === 'active')              navigate('/app', { replace: true });
    if (auth.status === 'pending_verification') navigate('/auth/verify-email', { replace: true });
  }, [auth.status, navigate]);

  // Handle click on Continue with Google
  const handleGoogleSignInClick = () => {
    setShowGoogleSignIn(true);
    if (registeredAccounts.length > 0) {
      setGoogleStep('list');
    } else {
      setGoogleStep('input');
    }
  };

  // Sign in with a selected registered account
  const handleSelectAccount = (account) => {
    setLoadingEmail(account.email);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setLoadingEmail('');

      // Returning verified user — log in directly
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { ...account, verifiedEmail: account.email }
      });
      navigate('/app', { replace: true });
    }, 1200);
  };

  // Handle submission of a custom email in the simulation
  const handleCustomEmailSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setEmailError('');

    setTimeout(() => {
      setIsLoading(false);

      // Check if this email is already registered
      const existing = registeredAccounts.find(a => a.email === cleanEmail);
      if (existing) {
        // Log in existing account directly
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { ...existing, verifiedEmail: existing.email }
        });
        navigate('/app', { replace: true });
      } else {
        // Go to profile setup pre-filled with this email
        navigate('/auth/profile-setup', {
          state: { googleAccount: { email: cleanEmail, name: '' } }
        });
      }
    }, 1000);
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

          {/* ── VIEW 1: Main Welcome Screen ── */}
          {!showGoogleSignIn && (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Welcome to FlowTodo 👋</h2>
                <p className={styles.formSubtitle}>
                  Sign in with your Google account to access your workspace. Your tasks are waiting for you.
                </p>
              </div>

              <button
                onClick={handleGoogleSignInClick}
                className={styles.googleBtn}
                id="google-signin-btn"
              >
                <GoogleLogo />
                Continue with Google
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
          )}

          {/* ── VIEW 2: Google Account Picker / Custom Input Screen ── */}
          {showGoogleSignIn && (
            <>
              {/* LIST STEP: Choose from registered accounts */}
              {googleStep === 'list' && (
                <>
                  <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>Choose an account</h2>
                    <p className={styles.formSubtitle}>
                      to continue to <strong style={{ color: 'var(--text-main)' }}>FlowTodo</strong>
                    </p>
                  </div>

                  <div className={accountStyles.accountList} role="list">
                    {registeredAccounts.map(acc => (
                      <button
                        key={acc.email}
                        className={accountStyles.accountCard}
                        onClick={() => handleSelectAccount(acc)}
                        disabled={isLoading}
                        role="listitem"
                        id={`account-${acc.email.replace(/[@.]/g, '-')}`}
                        aria-label={`Sign in as ${acc.name}, ${acc.email}`}
                      >
                        <div className={accountStyles.accountLeft}>
                          <Avatar name={acc.name} photo={acc.photo} size={46} />
                          <div className={accountStyles.accountInfo}>
                            <span className={accountStyles.accountName}>{acc.name}</span>
                            <span className={accountStyles.accountEmail}>{acc.email}</span>
                          </div>
                        </div>
                        <div className={accountStyles.accountRight}>
                          {isLoading && loadingEmail === acc.email ? (
                            <span className={accountStyles.spinner} />
                          ) : (
                            <ChevronRight size={18} className={accountStyles.chevron} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Option to use a new/another account */}
                  <button
                    className={accountStyles.addAccountBtn}
                    onClick={() => { setGoogleStep('input'); setCustomEmail(''); setEmailError(''); }}
                    disabled={isLoading}
                    id="use-another-account-btn"
                  >
                    <div className={accountStyles.addIcon}>
                      <UserPlus size={18} />
                    </div>
                    <div className={accountStyles.accountInfo}>
                      <span className={accountStyles.accountName}>Use another account</span>
                      <span className={accountStyles.accountEmail}>Sign in with a different Gmail</span>
                    </div>
                    <ChevronRight size={18} className={accountStyles.chevron} />
                  </button>

                  <button
                    className={styles.linkBtn}
                    onClick={() => setShowGoogleSignIn(false)}
                    disabled={isLoading}
                    style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={16} /> Cancel
                  </button>
                </>
              )}

              {/* INPUT STEP: Enter custom Gmail address */}
              {googleStep === 'input' && (
                <>
                  <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>Sign in with Google</h2>
                    <p className={styles.formSubtitle}>
                      to continue to <strong style={{ color: 'var(--text-main)' }}>FlowTodo</strong>
                    </p>
                  </div>

                  <form onSubmit={handleCustomEmailSubmit} noValidate>
                    <div className={styles.formBody}>
                      <div className={styles.field}>
                        <label htmlFor="google-email-input" className={styles.label}>
                          Email or phone
                        </label>
                        <input
                          id="google-email-input"
                          type="email"
                          className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                          placeholder="Enter your Gmail address"
                          value={customEmail}
                          onChange={(e) => { setCustomEmail(e.target.value); setEmailError(''); }}
                          disabled={isLoading}
                          autoFocus
                          autoComplete="email"
                        />
                        {emailError && (
                          <span className={styles.errorMsg} role="alert" style={{ marginTop: 4 }}>
                            {emailError}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                        id="google-email-next-btn"
                      >
                        {isLoading ? (
                          <><span className={styles.spinner} /> Connecting...</>
                        ) : (
                          'Next'
                        )}
                      </button>
                    </div>
                  </form>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <button
                      className={styles.linkBtn}
                      onClick={() => {
                        if (registeredAccounts.length > 0) {
                          setGoogleStep('list');
                        } else {
                          setShowGoogleSignIn(false);
                        }
                      }}
                      disabled={isLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
