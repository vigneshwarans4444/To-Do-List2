import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, AlertTriangle, UserPlus, ArrowLeft, HelpCircle, ShieldOff } from 'lucide-react';
import styles from './auth.module.css';

// SVG inline Google logo
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AlternativeEmailPage() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const { auth, dispatch } = useAuth();

  // The unrecognised email that triggered this redirect
  const detectedEmail = params.get('hint') || 'unknown@gmail.com';

  // The email the account is registered with (if any existing session)
  const registeredEmail = auth?.user?.verifiedEmail || auth?.user?.email || null;

  const handleSignInRegistered = () => {
    // Re-trigger login flow — in a real app this would use login_hint param with Google OAuth
    navigate('/auth/login');
  };

  const handleCreateNew = () => {
    // Pre-fill profile setup with the detected alternative email
    navigate('/auth/profile-setup', {
      state: {
        googleAccount: { email: detectedEmail, name: '' }
      }
    });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/auth/login');
  };

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.leftPanel} style={{ background: 'linear-gradient(145deg, #2d1b69 0%, #6c3ec1 50%, #a142f4 100%)' }}>
        <div className={styles.brandMark}>
          <div className={styles.brandIcon}><CheckSquare size={26} strokeWidth={2.5} /></div>
          <span className={styles.brandName}>FlowTodo</span>
        </div>

        <div className={styles.heroText}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', color: '#fff'
          }}>
            <ShieldOff size={32} />
          </div>
          <h1 className={styles.heroTitle} style={{ fontSize: '2rem' }}>
            Different account<br/>detected.
          </h1>
          <p className={styles.heroSubtitle}>
            For your security, each FlowTodo account is permanently tied to one verified Google email. We can't log you in with a different address.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--color-high-bg)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-high)'
            }}>
              <AlertTriangle size={26} />
            </div>

            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Different Account Detected</h2>
              <p className={styles.formSubtitle}>
                You signed in with a Google account that is not registered in FlowTodo.
              </p>
            </div>
          </div>

          {/* Detected email card */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column', gap: 6
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              You signed in with
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GoogleLogo />
              <span style={{ fontWeight: 600, color: 'var(--color-high)' }}>{detectedEmail}</span>
            </div>
            {registeredEmail && (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Your registered account
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GoogleLogo />
                  <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>{registeredEmail}</span>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
            What would you like to do?
          </p>

          {/* Option 1 — Sign in with registered email */}
          <button
            onClick={handleSignInRegistered}
            className={styles.googleBtn}
            id="alt-email-signin-registered"
            style={{ justifyContent: 'flex-start', gap: 14 }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0
            }}>
              <GoogleLogo />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700 }}>Sign in with your registered account</div>
              {registeredEmail && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {registeredEmail}
                </div>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span>or</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Option 2 — Create new account */}
          <button
            onClick={handleCreateNew}
            id="alt-email-create-new"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              border: '1.5px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              cursor: 'pointer', textAlign: 'left',
              color: 'var(--text-main)', transition: 'all 0.15s ease',
              width: '100%'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.background = 'var(--bg-active)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg-input)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Create a new account</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Register <strong>{detectedEmail}</strong> as a new FlowTodo account
              </div>
            </div>
          </button>

          {/* Info note */}
          <div className={`${styles.infoBanner} ${styles.infoBannerBlue}`} role="note">
            <HelpCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              For security reasons, each account is strictly tied to one verified Google email.
              If you believe this is an error, please{' '}
              <a href="mailto:support@flowtodo.app" style={{ color: 'inherit', fontWeight: 700 }}>contact support</a>.
            </span>
          </div>

          {/* Back link */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button className={styles.linkBtn} onClick={handleLogout} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ArrowLeft size={13} style={{ display: 'inline', marginRight: 4 }} />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
