import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

// ── Registered-accounts helpers ──────────────────────────────
export const ACCOUNTS_KEY = 'flowtodo_accounts';

export function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
}

export function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) { /* ignore */ }
}

// ── Auth session state ───────────────────────────────────────
// Auth states: 'unauthenticated' | 'pending_verification' | 'active'
const initialState = () => {
  try {
    const saved = localStorage.getItem('flowtodo_auth');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return { user: null, status: 'unauthenticated' };
};

function authReducer(state, action) {
  switch (action.type) {
    case 'PROFILE_SAVED':
      return {
        ...state,
        user: action.payload,      // { name, email, photo }
        status: 'pending_verification'
      };

    case 'EMAIL_VERIFIED':
      return {
        ...state,
        status: 'active',
        user: { ...state.user, verifiedEmail: state.user.email }
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        status: 'active',
        user: action.payload       // { name, email, verifiedEmail, photo }
      };

    case 'LOGOUT':
      return { user: null, status: 'unauthenticated' };

    // Save a verified account to the persistent accounts registry.
    // State itself doesn't change — side effect handled by the provider.
    case 'REGISTER_ACCOUNT':
      return state;

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [auth, dispatch] = useReducer(authReducer, null, initialState);

  // Persist auth state and sync to registered accounts registry
  useEffect(() => {
    try {
      localStorage.setItem('flowtodo_auth', JSON.stringify(auth));

      // Auto-register the active user to flowtodo_accounts if logged in
      if (auth && auth.status === 'active' && auth.user && auth.user.email) {
        const existing = loadAccounts();
        const alreadyThere = existing.some(
          a => a.email.toLowerCase() === auth.user.email.toLowerCase()
        );
        if (!alreadyThere) {
          saveAccounts([...existing, {
            name: auth.user.name || '',
            email: auth.user.email.toLowerCase(),
            photo: auth.user.photo || null
          }]);
        }
      }
    } catch (e) { /* ignore */ }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
