import React, { useRef } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { X, BarChart2, Download, Upload, Percent, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import styles from './DashboardStats.module.css';

export default function DashboardStats({ isOpen, onClose }) {
  const { state, dispatch } = useTasks();
  const { auth } = useAuth();
  const currentUserEmail = auth?.status === 'active' && auth.user?.email ? auth.user.email.toLowerCase() : null;
  
  const { tasks, projects } = state;
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Priority Stats
  const priorities = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length
  };

  const maxPriorityCount = Math.max(...Object.values(priorities), 1);

  // Project Stats
  const projectStats = projects.map(proj => {
    const count = tasks.filter(t => t.projectId === proj.id).length;
    return {
      ...proj,
      count
    };
  });

  const maxProjectCount = Math.max(...projectStats.map(p => p.count), 1);

  // Export data as JSON file
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify({
        tasks,
        projects
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flowtodo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    }
  };

  // Import data from JSON file
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result);
        
        // Basic schema validation
        if (!importedData.tasks || !Array.isArray(importedData.tasks)) {
          throw new Error('Missing or invalid "tasks" array');
        }
        if (importedData.projects && !Array.isArray(importedData.projects)) {
          throw new Error('Invalid "projects" array format');
        }

        if (window.confirm('Importing this file will overwrite all your current tasks and projects. Proceed?')) {
          dispatch({
            type: 'LOAD_USER_DATA',
            payload: {
              tasks: importedData.tasks,
              projects: importedData.projects || (state.projects.length > 0 ? state.projects : []),
              email: currentUserEmail
            }
          });
        }
      } catch (error) {
        alert('Failed to import backup file: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input selection
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="stats-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="stats-title" className={styles.title}>
            <BarChart2 size={22} style={{ color: 'var(--primary-color)' }} />
            Productivity Dashboard
          </h2>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close dashboard"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Completion Rate Circle/Bar */}
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Task Completion Rate</span>
              <span className={styles.progressValue}>
                <Percent size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                {completionRate}%
              </span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          {/* Core Tiles Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <BarChart2 size={20} className={styles.emptyIcon} style={{ color: 'var(--primary-color)' }} />
              <span className={styles.statValue}>{total}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statCard}>
              <CheckCircle size={20} className={styles.emptyIcon} style={{ color: 'var(--success-color)' }} />
              <span className={styles.statValue}>{completed}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.statCard}>
              <Clock size={20} className={styles.emptyIcon} style={{ color: 'var(--text-muted)' }} />
              <span className={styles.statValue}>{pending}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
            <div className={styles.statCard} style={{ borderColor: overdue > 0 ? 'rgba(239, 68, 68, 0.2)' : '' }}>
              <AlertCircle size={20} className={styles.emptyIcon} style={{ color: overdue > 0 ? 'var(--color-high)' : 'var(--text-muted)' }} />
              <span className={styles.statValue} style={{ color: overdue > 0 ? 'var(--color-high)' : '' }}>{overdue}</span>
              <span className={styles.statLabel}>Overdue</span>
            </div>
          </div>

          {/* Priority Breakdowns */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Task Priority Breakdown</h3>
            <div className={styles.distList}>
              {['high', 'medium', 'low'].map(p => {
                const count = priorities[p] || 0;
                const percent = total === 0 ? 0 : Math.round((count / maxPriorityCount) * 100);
                
                const priorityColors = {
                  high: 'var(--color-high)',
                  medium: 'var(--color-medium)',
                  low: 'var(--color-low)'
                };

                return (
                  <div key={p} className={styles.distItem}>
                    <span className={styles.distName} style={{ textTransform: 'capitalize' }}>{p}</span>
                    <div className={styles.distBarWrapper}>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${percent}%`,
                            backgroundColor: priorityColors[p]
                          }}
                        />
                      </div>
                      <span className={styles.distCount}>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Distribution */}
          {projectStats.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Project Allocations</h3>
              <div className={styles.distList}>
                {projectStats.map(proj => {
                  const percent = total === 0 ? 0 : Math.round((proj.count / maxProjectCount) * 100);

                  return (
                    <div key={proj.id} className={styles.distItem}>
                      <span className={`${styles.distName} text-truncate`}>{proj.name}</span>
                      <div className={styles.distBarWrapper}>
                        <div className={styles.distBarTrack}>
                          <div
                            className={styles.distBarFill}
                            style={{
                              width: `${percent}%`,
                              backgroundColor: proj.color
                            }}
                          />
                        </div>
                        <span className={styles.distCount}>{proj.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Backup & Restore utilities */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Backup & Restore Data</h3>
            <div className={styles.utilitiesGrid}>
              <div className={styles.utilCard}>
                <span className={styles.utilTitle}>Export Backup</span>
                <p className={styles.utilDesc}>Download all your tasks and custom projects to a JSON file.</p>
                <button onClick={handleExport} className={styles.btn}>
                  <Download size={14} /> Export JSON
                </button>
              </div>

              <div className={styles.utilCard}>
                <span className={styles.utilTitle}>Import Backup</span>
                <p className={styles.utilDesc}>Overwrite your current data from a FlowTodo JSON backup.</p>
                <button onClick={handleImportClick} className={styles.btn}>
                  <Upload size={14} /> Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className={styles.fileInput}
                  onChange={handleImportFile}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
