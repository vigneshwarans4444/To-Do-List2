import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider } from './context/AuthContext';

// Auth pages
import LoginPage          from './pages/auth/LoginPage';
import ProfileSetupPage   from './pages/auth/ProfileSetupPage';
import VerifyEmailPage    from './pages/auth/VerifyEmailPage';
import AlternativeEmailPage from './pages/auth/AlternativeEmailPage';

// App shell
import ProtectedRoute     from './components/Shared/ProtectedRoute';
import Header             from './components/Layout/Header';
import Sidebar            from './components/Layout/Sidebar';
import TaskList           from './components/Task/TaskList';
import TaskForm           from './components/Task/TaskForm';
import Modal              from './components/Shared/Modal';
import DashboardStats     from './components/Shared/DashboardStats';

import styles from './App.module.css';

// The protected inner app (task manager UI)
function AppShell() {
  const [isSidebarOpen,    setIsSidebarOpen]    = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isStatsOpen,      setIsStatsOpen]      = useState(false);

  return (
    <div className={styles.container}>
      <Header
        onToggleStats={() => setIsStatsOpen(prev => !prev)}
        isStatsOpen={isStatsOpen}
      />

      <div className={styles.main}>
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onAddProjectClick={() => setIsProjectModalOpen(true)}
        />
        <TaskList onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
        <TaskForm />
      </div>

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
      <DashboardStats
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <TaskProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/auth/login"             element={<LoginPage />} />
            <Route path="/auth/profile-setup"     element={<ProfileSetupPage />} />
            <Route path="/auth/verify-email"      element={<VerifyEmailPage />} />
            <Route path="/auth/alternative-email" element={<AlternativeEmailPage />} />

            {/* Protected app route */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />

            {/* Default redirect — send everyone to login first */}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </TaskProvider>
      </AuthProvider>
    </HashRouter>
  );
}
