import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires an authenticated + verified user.
 * Redirects unauthenticated users to /auth/login.
 * Redirects pending-verification users to /auth/verify-email.
 */
export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  const location  = useLocation();

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (auth.status === 'pending_verification') {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // auth.status === 'active'
  return children;
}
