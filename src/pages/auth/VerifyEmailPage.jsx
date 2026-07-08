import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateOTP, sendOTPEmail } from '../../utils/emailService';
import { EMAILJS_ENABLED } from '../../config/emailjs.config';
import {
  CheckSquare, RefreshCw, Check, ShieldCheck,
  AlertCircle, Mail, Info
} from 'lucide-react';
import styles from './auth.module.css';

const STEPS = ['Google Sign-In', 'Your Profile', 'Verify Email'];
const OTP_EXPIRY_SECONDS = 600; // 10 minutes

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { auth, dispatch } = useAuth();

  const [digits, setDigits]         = useState(['', '', '', '', '', '']);
  const [otpCode, setOtpCode]       = useState('');
  const [error, setError]           = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending]   = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [emailError, setEmailError] = useState('');
  const [mismatch, setMismatch]     = useState(false);
  const [timeLeft, setTimeLeft]     = useState(OTP_EXPIRY_SECONDS);
  const [isExpired, setIsExpired]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs   = useRef([]);
  const timerRef    = useRef(null);
  const cooldownRef = useRef(null);

  const userEmail = auth.user?.email || '';
  const userName  = auth.user?.name  || '';

  // ── Guard ─────────────────────────────────────────────
  useEffect(() => {
    if (auth.status === 'active')          navigate('/app', { replace: true });
    if (auth.status === 'unauthenticated') navigate('/auth/login', { replace: true });
  }, [auth.status, navigate]);

  // ── Generate & send OTP on mount ──────────────────────
  const generateAndSend = useCallback(async () => {
    setIsSending(true);
    setEmailError('');
    setEmailSent(false);
    setIsExpired(false);
    setTimeLeft(OTP_EXPIRY_SECONDS);

    // Clear old timer
    if (timerRef.current) clearInterval(timerRef.current);

    const code = generateOTP();
    setOtpCode(code);
    setDigits(['', '', '', '', '', '']);

    const result = await sendOTPEmail(userEmail, userName, code);
    setIsSending(false);

    if (result.success) {
      setEmailSent(true);

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setEmailError(result.error || 'Failed to send OTP. Please try again.');
    }

    // Focus first digit
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [userEmail, userName]);

  // Send on first mount
  useEffect(() => {
    generateAndSend();
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── OTP input handlers ────────────────────────────────
  const handleDigitChange = (value, idx) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[idx] = value;
    setDigits(next);
    setError('');

    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (value && next.every(d => d !== '')) submitCode(next.join(''));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft'  && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    if (pasted.length === 6) submitCode(pasted);
    else inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Verify OTP ────────────────────────────────────────
  const submitCode = (code) => {
    if (isExpired) {
      setError('This code has expired. Please request a new one.');
      return;
    }
    if (!otpCode) {
      setError('Code not yet generated. Please wait or click Resend.');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Small delay to show spinner (simulate network check)
    setTimeout(() => {
      setIsVerifying(false);
      if (code === otpCode) {
        clearInterval(timerRef.current);
        dispatch({ type: 'EMAIL_VERIFIED' });
        navigate('/app', { replace: true });
      } else {
        setError('Incorrect code. Please check your email and try again.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 800);
  };

  const handleManualSubmit = () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    submitCode(code);
  };

  // ── Resend with cooldown ──────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    await generateAndSend();

    // Start 60-second resend cooldown
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Format timer ─────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── Mismatch sub-view ────────────────────────────────
  if (mismatch) {
    return (
      <div className={styles.page}>
        <div className={styles.leftPanel}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon}><CheckSquare size={26} strokeWidth={2.5} /></div>
            <span className={styles.brandName}>FlowTodo</span>
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Email<br/>Mismatch</h1>
            <p className={styles.heroSubtitle}>
              Each account must be verified with exactly one consistent Google email address for your security.
            </p>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>⚠️ Different account chosen</h2>
              <p className={styles.formSubtitle}>
                The Google account you selected does not match your profile email.
              </p>
            </div>
            <div className={`${styles.infoBanner} ${styles.infoBannerAmber}`} role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Your profile email is <strong>{userEmail}</strong>. Please verify using
                that exact Google account.
              </span>
            </div>
            <button className={styles.googleBtn} onClick={() => setMismatch(false)}>
              ← Try again with <strong style={{ marginLeft: 4 }}>{userEmail}</strong>
            </button>
            <p className={styles.formFooter}>
              <button
                className={styles.linkBtn}
                onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/auth/profile-setup'); }}
              >
                Use a different email instead
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main verify view ─────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Left hero */}
      <div className={styles.leftPanel}>
        <div className={styles.brandMark}>
          <div className={styles.brandIcon}><CheckSquare size={26} strokeWidth={2.5} /></div>
          <span className={styles.brandName}>FlowTodo</span>
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Check your<br/>inbox.</h1>
          <p className={styles.heroSubtitle}>
            A 6-digit verification code was sent to your Google email address. Enter it here to activate your account.
          </p>

          {/* Dev mode hint */}
          {!EMAILJS_ENABLED && (
            <div style={{
              marginTop: 32, padding: '14px 18px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                🛠️ Dev Mode — EmailJS not configured
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Check your browser console for the OTP code. Configure{' '}
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>
                  src/config/emailjs.config.js
                </code>{' '}
                to send real emails.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right form */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>

          {/* Step indicator */}
          <div className={styles.stepRow} role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={3}>
            {STEPS.map((step, i) => {
              const isDone   = i < 2;
              const isActive = i === 2;
              return (
                <React.Fragment key={step}>
                  <div
                    className={`${styles.stepCircle} ${isDone ? styles.stepCircleDone : isActive ? styles.stepCircleActive : ''}`}
                    aria-label={`Step ${i + 1}: ${step}`}
                  >
                    {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Verify your email</h2>
            <p className={styles.formSubtitle}>
              {isSending
                ? 'Sending code to your email…'
                : emailSent
                ? <>Code sent to <strong style={{ color: 'var(--primary-color)' }}>{userEmail}</strong>. Expires in <strong>{formatTime(timeLeft)}</strong>.</>
                : `Enter the 6-digit code sent to ${userEmail}`
              }
            </p>
          </div>

          {/* Sending spinner */}
          {isSending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span className={styles.spinner} style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)' }} />
              Sending verification code to {userEmail}…
            </div>
          )}

          {/* Email send error */}
          {emailError && (
            <div className={`${styles.infoBanner} ${styles.infoBannerRed}`} role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>
                <strong>Failed to send email:</strong> {emailError}
                <br />
                <button className={styles.linkBtn} onClick={handleResend} style={{ marginTop: 4 }}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Dev mode info banner */}
          {!EMAILJS_ENABLED && !isSending && !emailError && (
            <div className={`${styles.infoBanner} ${styles.infoBannerAmber}`} role="note">
              <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong>Dev Mode:</strong> EmailJS is not configured yet. Your OTP code has been logged to the{' '}
                <strong>browser console</strong> (F12 → Console tab).
              </span>
            </div>
          )}

          {/* OTP Input boxes */}
          {!isSending && (
            <div>
              <div className={styles.codeBox} onPaste={handlePaste} aria-label="Enter 6-digit verification code">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.codeDigit}
                    value={d}
                    onChange={e => handleDigitChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    disabled={isExpired || isVerifying}
                    aria-label={`Digit ${i + 1} of 6`}
                    style={isExpired ? { opacity: 0.4 } : {}}
                  />
                ))}
              </div>

              {/* Expiry / error messages */}
              {isExpired && (
                <div className={`${styles.infoBanner} ${styles.infoBannerAmber}`} role="alert" style={{ marginTop: 12 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Code expired. Please request a new one.</span>
                </div>
              )}
              {error && !isExpired && (
                <div className={`${styles.infoBanner} ${styles.infoBannerRed}`} role="alert" style={{ marginTop: 12 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Verify button */}
          {!isSending && (
            <button
              className={styles.submitBtn}
              onClick={handleManualSubmit}
              disabled={isVerifying || isExpired || digits.some(d => d === '')}
              id="verify-email-btn"
            >
              {isVerifying
                ? <><span className={styles.spinner} /> Verifying…</>
                : <><ShieldCheck size={16} style={{ display: 'inline', marginRight: 6 }} /> Verify Email</>
              }
            </button>
          )}

          {/* Footer actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button
              className={styles.linkBtn}
              onClick={handleResend}
              disabled={resendCooldown > 0 || isSending}
              aria-label="Resend verification code"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : isSending
                ? <><RefreshCw size={13} style={{ display: 'inline', marginRight: 4 }} /> Sending…</>
                : '↻ Send a new code'
              }
            </button>

            <button
              className={styles.linkBtn}
              onClick={() => setMismatch(true)}
              style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}
            >
              I used the wrong Google account →
            </button>
          </div>

          {/* EmailJS setup prompt */}
          {!EMAILJS_ENABLED && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px dashed var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--text-main)' }}>📧 Enable real email delivery:</strong>
              <ol style={{ margin: '8px 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Create a free account at <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>emailjs.com</a></li>
                <li>Connect your Gmail &amp; create an email template</li>
                <li>Fill in your credentials in <code>src/config/emailjs.config.js</code></li>
                <li>Set <code>EMAILJS_ENABLED = true</code></li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
