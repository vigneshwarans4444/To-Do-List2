import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, User, Mail, Briefcase, Upload, AlertCircle, ArrowRight, Check } from 'lucide-react';
import styles from './auth.module.css';

const STEPS = ['Google Sign-In', 'Your Profile', 'Verify Email'];

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, dispatch } = useAuth();

  // Redirect if already logged in or not authenticated
  React.useEffect(() => {
    if (auth?.status === 'active') {
      navigate('/app', { replace: true });
    } else if (auth?.status === 'unauthenticated') {
      navigate('/auth/login', { replace: true });
    }
  }, [auth?.status, navigate]);

  // Pre-filled from Google OAuth if coming from login flow
  const googleAccount = location.state?.googleAccount || null;

  const [name, setName]       = useState(googleAccount?.name || '');
  const [email, setEmail]     = useState(googleAccount?.email || '');
  const [role, setRole]       = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [errors, setErrors]   = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (!name.trim())  errs.name  = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid email address.';
    return errs;
  };

  // Compress image to 128×128 JPEG ~80% quality so it safely fits in localStorage
  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const SIZE = 128;
          const canvas = document.createElement('canvas');
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          // Centre-crop to square
          const side = Math.min(img.width, img.height);
          const sx = (img.width  - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setAvatarUrl(compressed);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    // Simulate saving profile (API call delay)
    setTimeout(() => {
      dispatch({
        type: 'PROFILE_SAVED',
        payload: {
          name:  name.trim(),
          email: email.trim().toLowerCase(),
          role:  role.trim(),
          photo: avatarUrl,
        }
      });
      setIsSubmitting(false);
      // Proceed to email verification step
      navigate('/auth/verify-email');
    }, 1000);
  };

  const initials = name ? name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandMark}>
          <div className={styles.brandIcon}>
            <CheckSquare size={26} strokeWidth={2.5} />
          </div>
          <span className={styles.brandName}>FlowTodo</span>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Let's set up<br/>your workspace.
          </h1>
          <p className={styles.heroSubtitle}>
            Tell us a little about yourself. Your profile ties your account to your verified Google email — keeping everything secure and consistent.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>

          {/* Step indicator */}
          <div className={styles.stepRow} role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={3}>
            {STEPS.map((step, i) => {
              const isDone   = i < 1;
              const isActive = i === 1;
              return (
                <React.Fragment key={step}>
                  <div
                    className={`${styles.stepCircle} ${isDone ? styles.stepCircleDone : isActive ? styles.stepCircleActive : ''}`}
                    title={step}
                    aria-label={`Step ${i + 1}: ${step} — ${isDone ? 'completed' : isActive ? 'current' : 'upcoming'}`}
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
            <h2 className={styles.formTitle}>Complete your profile</h2>
            <p className={styles.formSubtitle}>
              Step 2 of 3 — Profile Setup
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formBody}>

              {/* Avatar Upload */}
              <div className={styles.avatarUpload}>
                <div className={styles.avatarPreview}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profile preview" />
                    : initials
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    type="button"
                    className={styles.avatarUploadBtn}
                    onClick={() => fileRef.current?.click()}
                    aria-label="Upload profile photo"
                  >
                    <Upload size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Upload Photo
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Optional · JPG or PNG
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className={styles.field}>
                <label htmlFor="profile-name" className={styles.label}>
                  <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Full Name <span style={{ color: 'var(--color-high)' }}>*</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="e.g. Alice Johnson"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                  autoFocus={!googleAccount}
                  autoComplete="name"
                />
                {errors.name && (
                  <span className={styles.errorMsg} role="alert">
                    <AlertCircle size={13} /> {errors.name}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className={styles.field}>
                <label htmlFor="profile-email" className={styles.label}>
                  <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Google Email Address <span style={{ color: 'var(--color-high)' }}>*</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                  autoComplete="email"
                  readOnly={!!googleAccount}  // Lock if pre-filled from Google
                  style={googleAccount ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                />
                {googleAccount && (
                  <span style={{ fontSize: '0.77rem', color: 'var(--success-color)' }}>
                    ✓ Imported from your Google account
                  </span>
                )}
                {errors.email && (
                  <span className={styles.errorMsg} role="alert">
                    <AlertCircle size={13} /> {errors.email}
                  </span>
                )}
              </div>

              {/* Role / Department (optional) */}
              <div className={styles.field}>
                <label htmlFor="profile-role" className={styles.label}>
                  <Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Role / Department <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— Optional</span>
                </label>
                <input
                  id="profile-role"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Product Manager, Developer..."
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  autoComplete="organization-title"
                />
              </div>

              {/* Info Banner */}
              <div className={`${styles.infoBanner} ${styles.infoBannerBlue}`} role="note">
                <Mail size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  After saving, we'll ask you to verify <strong>{email || 'your email'}</strong> via Google.
                  This email will become the permanent identity for your account.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
                id="profile-save-btn"
              >
                {isSubmitting ? (
                  <><span className={styles.spinner} /> Saving profile...</>
                ) : (
                  <>Save &amp; Continue <ArrowRight size={16} style={{ display: 'inline', marginLeft: 6 }} /></>
                )}
              </button>
            </div>
          </form>

          <p className={styles.formFooter}>
            Already have an account?{' '}
            <button className={styles.linkBtn} onClick={() => navigate('/auth/login')}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
