import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth, loadAccounts, saveAccounts } from '../../context/AuthContext';
import { X, Upload, Camera, User, Mail, Briefcase, Save, Check } from 'lucide-react';
import styles from './ProfileEditModal.module.css';

// ── Image compressor (128×128 JPEG ~80%) ─────────────────────
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 128;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileEditModal({ isOpen, onClose }) {
  const { auth, dispatch } = useAuth();
  const user = auth?.user;

  const [name, setName]     = useState('');
  const [role, setRole]     = useState('');
  const [photo, setPhoto]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const fileRef = useRef(null);

  // Sync fields whenever modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setRole(user.role || '');
      setPhoto(user.photo || null);
      setSaved(false);
      setError('');
    }
  }, [isOpen, user]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Don't render anything if closed or no user
  if (!isOpen || !user) return null;

  const initials = name
    ? name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const hue = name
    ? (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 17) % 360
    : 200;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    setSaving(true);
    setError('');

    setTimeout(() => {
      const updatedUser = {
        ...user,
        name: name.trim(),
        role: role.trim(),
        photo: photo,
      };

      // Update auth session
      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });

      // Also update flowtodo_accounts so sign-in page reflects the change
      const accounts = loadAccounts();
      const emailLower = updatedUser.email.toLowerCase();
      const idx = accounts.findIndex(a => a.email.toLowerCase() === emailLower);
      const entry = { name: updatedUser.name, email: emailLower, photo: updatedUser.photo || null };
      if (idx === -1) {
        saveAccounts([...accounts, entry]);
      } else {
        const updated = [...accounts];
        updated[idx] = { ...updated[idx], ...entry };
        saveAccounts(updated);
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 900);
    }, 700);
  };

  // ── Render via portal directly into document.body ──────────
  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <h2 id="profile-modal-title" className={styles.modalTitle}>User Profile</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close profile editor">
            <X size={18} />
          </button>
        </div>

        {/* ── Avatar section ── */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {photo ? (
              <img src={photo} alt={name} className={styles.avatarImg} />
            ) : (
              <div
                className={styles.avatarInitials}
                style={{ background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${(hue+60)%360},70%,38%))` }}
              >
                {initials}
              </div>
            )}

            {/* Camera overlay button */}
            <button
              className={styles.cameraBtn}
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              title="Change photo"
            >
              <Camera size={16} />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
            <Upload size={13} style={{ marginRight: 5 }} />
            Change Photo
          </button>

          {photo && (
            <button className={styles.removeBtn} onClick={() => setPhoto(null)}>
              Remove
            </button>
          )}
        </div>

        {/* ── Info rows ── */}
        <div className={styles.infoSection}>

          {/* Email — read-only */}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>
              <Mail size={13} style={{ marginRight: 6 }} />Email
            </span>
            <span className={styles.infoValue}>{user.verifiedEmail || user.email}</span>
          </div>

          <div className={styles.divider} />

          {/* Name — editable */}
          <div className={styles.infoRow}>
            <label htmlFor="profile-modal-name" className={styles.infoLabel}>
              <User size={13} style={{ marginRight: 6 }} />Name
            </label>
            <input
              id="profile-modal-name"
              type="text"
              className={styles.infoInput}
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Your full name"
              maxLength={50}
            />
          </div>

          <div className={styles.divider} />

          {/* Role — editable */}
          <div className={styles.infoRow}>
            <label htmlFor="profile-modal-role" className={styles.infoLabel}>
              <Briefcase size={13} style={{ marginRight: 6 }} />Role
            </label>
            <input
              id="profile-modal-role"
              type="text"
              className={styles.infoInput}
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Developer, Manager…"
              maxLength={50}
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        {/* ── Footer buttons ── */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Close
          </button>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
            disabled={saving || saved}
            id="profile-modal-save-btn"
          >
            {saving ? (
              <><span className={styles.spinner} /> Saving…</>
            ) : saved ? (
              <><Check size={15} style={{ marginRight: 5 }} /> Saved!</>
            ) : (
              <><Save size={15} style={{ marginRight: 5 }} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body   // ← portal target: bypasses all CSS stacking contexts
  );
}
