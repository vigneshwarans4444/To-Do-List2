import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

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

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [auth, dispatch] = useReducer(authReducer, null, initialState);

  // Persist auth state
  useEffect(() => {
    try {
      localStorage.setItem('flowtodo_auth', JSON.stringify(auth));
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
