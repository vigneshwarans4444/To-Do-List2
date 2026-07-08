import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadAccounts } from '../../context/AuthContext';
import { ChevronRight } from 'lucide-react';
import styles from './googleLogin.module.css';

// Exact multicolor Google "G" logo
const GoogleGLogo = () => (
  <svg className={styles.googleLogo} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Account avatar — photo or coloured initials
function AccountAvatar({ name, photo, size = 32 }) {
  const initials = name ? name.trim().charAt(0).toUpperCase() : '?';
  const hue = name
    ? (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 17) % 360
    : 200;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: photo
          ? 'transparent'
          : `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${(hue + 60) % 360},70%,40%))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {photo ? (
        <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, dispatch } = useAuth();

  const [registeredAccounts, setRegisteredAccounts] = useState(() => loadAccounts());

  // Re-read accounts from localStorage on every mount (e.g. after a profile edit)
  useEffect(() => {
    const fresh = loadAccounts();
    setRegisteredAccounts(fresh);
    setGoogleStep(fresh.length > 0 ? 'list' : 'input');
  }, []);

  const [isLoading, setIsLoading]     = useState(false);
  const [loadingEmail, setLoadingEmail] = useState('');
  // 'list' when accounts exist, 'input' for typing a new email
  const [googleStep, setGoogleStep]   = useState(
    registeredAccounts.length > 0 ? 'list' : 'input'
  );
  const [customEmail, setCustomEmail] = useState('');
  const [emailError, setEmailError]   = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtered suggestions for the email input dropdown
  const suggestions = useMemo(() => {
    const q = customEmail.trim().toLowerCase();
    if (!q) return registeredAccounts;
    return registeredAccounts.filter(
      a => a.email.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [customEmail, registeredAccounts]);

  // Navigation is handled here — after auth state actually updates
  React.useEffect(() => {
    if (auth.status === 'active')              navigate('/app', { replace: true });
    if (auth.status === 'pending_verification') navigate('/auth/verify-email', { replace: true });
  }, [auth.status, navigate]);

  // ── Click an existing account from the list ──
  const handleSelectAccount = (account) => {
    setLoadingEmail(account.email);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoadingEmail('');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { ...account, verifiedEmail: account.email },
      });
      // Do NOT call navigate() here — the useEffect above handles it
      // after the reducer state commits to avoid a ProtectedRoute race condition
    }, 800);
  };

  // ── Submit email from the input step ──
  const handleEmailSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = customEmail.trim().toLowerCase();

    if (!clean) { setEmailError('Enter an email or phone number'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setEmailError('Enter a valid email address'); return; }

    setIsLoading(true);
    setEmailError('');

    setTimeout(() => {
      setIsLoading(false);
      const existing = registeredAccounts.find(a => a.email === clean);
      if (existing) {
        // Existing account — dispatch and let useEffect navigate
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { ...existing, verifiedEmail: existing.email },
        });
      } else {
        // New account — initialize profile with default name from email and skip setup page
        const nameFromEmail = clean.split('@')[0]
          .split(/[\._-]/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        dispatch({
          type: 'PROFILE_SAVED',
          payload: {
            name: nameFromEmail,
            email: clean,
            photo: null,
            role: ''
          }
        });
      }
    }, 1000);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>

        {/* ── Left Column ── */}
        <div className={styles.leftCol}>
          <GoogleGLogo />
          <h1 className={styles.title}>
            {googleStep === 'list' ? 'Choose an account' : 'Sign in'}
          </h1>
          <p className={styles.subtitle}>
            {googleStep === 'list'
              ? 'to continue to FlowTodo'
              : 'Use your Google Account'}
          </p>
        </div>

        {/* ── Right Column ── */}
        <div className={styles.rightCol}>

          {/* STEP: Account list */}
          {googleStep === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div className={styles.accountListContainer}>
                {registeredAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    className={styles.accountItem}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isLoading}
                    id={`account-${acc.email.replace(/[@.]/g, '-')}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AccountAvatar name={acc.name} photo={acc.photo} size={36} />
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{acc.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#9e9e9e' }}>{acc.email}</span>
                      </div>
                    </div>
                    {isLoading && loadingEmail === acc.email ? (
                      <span className={styles.spinner} />
                    ) : (
                      <ChevronRight size={16} style={{ color: '#9e9e9e' }} />
                    )}
                  </button>
                ))}

                {/* Use another account */}
                <button
                  className={styles.useAnotherAccountBtn}
                  onClick={() => { setGoogleStep('input'); setCustomEmail(''); setEmailError(''); }}
                  disabled={isLoading}
                  id="use-another-account-btn"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1px solid #5f6368',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', color: '#e3e3e3',
                  }}>
                    +
                  </div>
                  <span style={{ fontSize: '0.9rem' }}>Use another account</span>
                </button>
              </div>

              <div className={styles.actionsRow} style={{ justifyContent: 'flex-end' }}>
                {/* spacer */}
              </div>
            </div>
          )}

          {/* STEP: Email input */}
          {googleStep === 'input' && (
            <form
              onSubmit={handleEmailSubmit}
              className={styles.formContainer}
              style={{ height: '100%', justifyContent: 'space-between' }}
            >
              <div>
                {/* Floating-label input */}
                <div className={styles.inputGroup}>
                  <input
                    id="google-email-input"
                    type="email"
                    placeholder=" "
                    className={`${styles.outlinedInput} ${emailError ? styles.inputError : ''}`}
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setEmailError('');
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                  <label htmlFor="google-email-input" className={styles.inputLabel}>
                    Email or phone
                  </label>

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestionsContainer}>
                      {suggestions.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          className={styles.suggestionItem}
                          onClick={() => { setCustomEmail(acc.email); setShowSuggestions(false); }}
                        >
                          <AccountAvatar name={acc.name} photo={acc.photo} size={24} />
                          <div className={styles.suggestionText}>
                            <span className={styles.suggestionName}>{acc.name}</span>
                            <span className={styles.suggestionEmail}>{acc.email}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {emailError && (
                  <div className={styles.errorText}>
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {emailError}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.forgotBtn}
                  style={{ marginTop: 16 }}
                  onClick={() => setEmailError('Enter your registered Gmail address to retrieve it.')}
                >
                  Forgot email?
                </button>

                <p className={styles.guestText}>
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <a
                    href="https://support.google.com/chrome/answer/6130773"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.learnMoreLink}
                  >
                    Learn more about using Guest mode
                  </a>
                </p>
              </div>

              {/* Action buttons row */}
              <div className={styles.actionsRow}>
                {registeredAccounts.length > 0 ? (
                  <button
                    type="button"
                    className={styles.createAccountBtn}
                    onClick={() => { setGoogleStep('list'); setEmailError(''); }}
                    disabled={isLoading}
                  >
                    Back to accounts
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.createAccountBtn}
                    onClick={() => navigate('/auth/profile-setup')}
                    disabled={isLoading}
                  >
                    Create account
                  </button>
                )}

                <button
                  type="submit"
                  className={styles.nextBtn}
                  disabled={isLoading}
                  id="google-email-next-btn"
                >
                  {isLoading ? <span className={styles.spinner} /> : 'Next'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.langSelector}>
          <span>English (United States)</span>
          <span style={{ fontSize: '0.5rem', marginLeft: 4 }}>▼</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink} onClick={(e) => e.preventDefault()}>Help</a>
          <a href="#" className={styles.footerLink} onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" className={styles.footerLink} onClick={(e) => e.preventDefault()}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
