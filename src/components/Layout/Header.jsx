import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Laptop, BarChart2, CheckSquare, X, LogOut, User, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';
import ProfileEditModal from '../Shared/ProfileEditModal';

export default function Header({ onToggleStats, isStatsOpen }) {
  const { state, dispatch } = useTasks();
  const { auth, dispatch: authDispatch } = useAuth();
  const navigate = useNavigate();
  const { searchQuery, theme } = state;
  const user = auth?.user;

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    dispatch({ type: 'SET_SEARCH', payload: e.target.value });
  };

  const handleClearSearch = () => {
    dispatch({ type: 'SET_SEARCH', payload: '' });
  };

  const cycleTheme = () => {
    const cycle = { light: 'dark', dark: 'system', system: 'light' };
    dispatch({ type: 'SET_THEME', payload: cycle[theme] || 'light' });
  };

  const getThemeIcon = () => {
    if (theme === 'dark')   return <Moon size={20} />;
    if (theme === 'system') return <Laptop size={20} />;
    return <Sun size={20} />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark')   return 'Dark Mode';
    if (theme === 'system') return 'System Mode';
    return 'Light Mode';
  };

  const handleLogout = () => {
    setProfileOpen(false);
    authDispatch({ type: 'LOGOUT' });
  };

  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    // ProfileEditModal uses ReactDOM.createPortal → renders to document.body
    // so it can live anywhere in the JSX tree without z-index issues
    <header className={styles.header}>
      {/* Logo + title */}
      <div className={styles.leftSection}>
        <div className={styles.logoContainer} aria-hidden="true">
          <CheckSquare size={20} strokeWidth={2.5} />
        </div>
        <span className={styles.title}>FlowTodo</span>
      </div>

      {/* Search bar */}
      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} aria-hidden="true" />
          <label htmlFor="search-input" className="visually-hidden">Search tasks</label>
          <input
            id="search-input"
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks, descriptions, or subtasks..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className={styles.clearButton} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.rightSection}>
        {/* Stats */}
        <button
          onClick={onToggleStats}
          className={`${styles.actionButton} ${isStatsOpen ? styles.actionButtonActive : ''}`}
          aria-label="Toggle statistics dashboard"
          title="Productivity Statistics"
        >
          <BarChart2 size={20} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className={styles.actionButton}
          aria-label={`Change theme. Current: ${getThemeLabel()}`}
          title={`${getThemeLabel()} (click to toggle)`}
        >
          {getThemeIcon()}
        </button>

        {/* User profile dropdown */}
        {user && (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className={styles.profileBtn}
              aria-label="Open user menu"
              aria-expanded={profileOpen}
              title={user.name || 'Profile'}
            >
              {user.photo
                ? <img src={user.photo} alt={user.name} className={styles.profileImg} />
                : <span className={styles.profileInitials}>{initials}</span>
              }
              <ChevronDown size={14} className={`${styles.chevron} ${profileOpen ? styles.chevronOpen : ''}`} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className={styles.profileDropdown} role="menu">
                {/* User info header */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAvatar}>
                    {user.photo
                      ? <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initials
                    }
                  </div>
                  <div className={styles.dropdownUserInfo}>
                    <span className={styles.dropdownName}>{user.name}</span>
                    <span className={styles.dropdownEmail}>{user.verifiedEmail || user.email}</span>
                  </div>
                </div>

                <div className={styles.dropdownDivider} />

                {/* Verified email badge */}
                <div className={styles.dropdownVerifiedBadge}>
                  <span className={styles.verifiedDot} />
                  Email verified
                </div>

                <div className={styles.dropdownDivider} />

                {/* Edit Profile — opens popup modal (portal) */}
                <button
                  onClick={() => { setProfileOpen(false); setProfileModalOpen(true); }}
                  className={styles.dropdownItem}
                  role="menuitem"
                  id="edit-profile-btn"
                >
                  <User size={15} />
                  Edit Profile
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  role="menuitem"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portal modal — renders to document.body via ReactDOM.createPortal */}
      <ProfileEditModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}
