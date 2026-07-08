import React from 'react';
import { useTasks } from '../../context/TaskContext';
import { Inbox, Calendar, CalendarDays, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar({ isSidebarOpen, onCloseSidebar, onAddProjectClick }) {
  const { state, dispatch } = useTasks();
  const { tasks, projects, filters } = state;
  const activeStatus = filters.status;

  // Helper to check if task is due today
  const isToday = (dueDateStr) => {
    if (!dueDateStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dueDateStr === todayStr;
  };

  // Helper to check if task is upcoming (due in future)
  const isUpcoming = (dueDateStr) => {
    if (!dueDateStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dueDateStr > todayStr;
  };

  // Calculate counts for nav categories (active tasks only, except for Completed category)
  const counts = {
    inbox: tasks.filter(t => !t.completed).length,
    today: tasks.filter(t => !t.completed && isToday(t.dueDate)).length,
    upcoming: tasks.filter(t => !t.completed && isUpcoming(t.dueDate)).length,
    completed: tasks.filter(t => t.completed).length
  };

  // Calculate counts for projects
  const getProjectTaskCount = (projectId) => {
    return tasks.filter(t => !t.completed && t.projectId === projectId).length;
  };

  const handleFilterClick = (status) => {
    dispatch({ type: 'SET_FILTER', payload: status });
    if (window.innerWidth <= 768 && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project? Tasks in this project will not be deleted but will be moved to no project.')) {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={onCloseSidebar} />
      )}

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <nav className={styles.navSection} aria-label="Main Navigation">
          <h2 className={styles.sectionTitle}>Views</h2>
          <ul className={styles.navList}>
            <li>
              <button
                onClick={() => handleFilterClick('inbox')}
                className={`${styles.navItem} ${activeStatus === 'inbox' ? styles.navItemActive : ''}`}
                aria-current={activeStatus === 'inbox' ? 'page' : undefined}
              >
                <span className={styles.navLinkLeft}>
                  <Inbox size={18} />
                  Inbox
                </span>
                <span className={styles.badge}>{counts.inbox}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleFilterClick('today')}
                className={`${styles.navItem} ${activeStatus === 'today' ? styles.navItemActive : ''}`}
                aria-current={activeStatus === 'today' ? 'page' : undefined}
              >
                <span className={styles.navLinkLeft}>
                  <Calendar size={18} />
                  Today
                </span>
                <span className={styles.badge}>{counts.today}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleFilterClick('upcoming')}
                className={`${styles.navItem} ${activeStatus === 'upcoming' ? styles.navItemActive : ''}`}
                aria-current={activeStatus === 'upcoming' ? 'page' : undefined}
              >
                <span className={styles.navLinkLeft}>
                  <CalendarDays size={18} />
                  Upcoming
                </span>
                <span className={styles.badge}>{counts.upcoming}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleFilterClick('completed')}
                className={`${styles.navItem} ${activeStatus === 'completed' ? styles.navItemActive : ''}`}
                aria-current={activeStatus === 'completed' ? 'page' : undefined}
              >
                <span className={styles.navLinkLeft}>
                  <CheckCircle2 size={18} />
                  Completed
                </span>
                <span className={styles.badge}>{counts.completed}</span>
              </button>
            </li>
          </ul>
        </nav>

        <nav className={styles.navSection} aria-label="Projects Navigation">
          <div className={styles.projectsHeader}>
            <h2>Projects</h2>
            <button
              onClick={onAddProjectClick}
              className={styles.addProjectBtn}
              aria-label="Add project"
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <ul className={styles.navList}>
            {projects.map((proj) => {
              const isActive = activeStatus === proj.id;
              const count = getProjectTaskCount(proj.id);
              
              return (
                <li key={proj.id} className={styles.projectListItem}>
                  {/* Nav area — uses div to avoid nested button violation */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFilterClick(proj.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFilterClick(proj.id); }}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={styles.navLinkLeft}>
                      <span
                        className={styles.projectColorDot}
                        style={{ backgroundColor: proj.color }}
                        aria-hidden="true"
                      />
                      <span className="text-truncate">{proj.name}</span>
                    </span>
                    <span className={styles.badge}>{count}</span>
                  </div>
                  {/* Delete button — sibling to nav div, not nested inside it */}
                  <button
                    onClick={(e) => handleDeleteProject(e, proj.id)}
                    className={styles.deleteProjectBtn}
                    aria-label={`Delete project ${proj.name}`}
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
            
            {projects.length === 0 && (
              <li style={{ padding: '0 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No projects. Click '+' to create one.
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
