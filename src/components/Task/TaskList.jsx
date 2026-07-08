import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import TaskCard from './TaskCard';
import { Menu, Plus, CheckSquare, Calendar, SlidersHorizontal, Tag } from 'lucide-react';
import styles from './TaskList.module.css';

export default function TaskList({ onToggleSidebar }) {
  const { state, dispatch } = useTasks();
  const { tasks, projects, filters, sortBy, searchQuery } = state;

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const quickAddRef = useRef(null);

  // Set default form values depending on current view filter
  useEffect(() => {
    if (filters.status.startsWith('proj-')) {
      setNewProjectId(filters.status);
    } else {
      setNewProjectId('');
    }

    if (filters.status === 'today') {
      setNewDueDate(new Date().toISOString().split('T')[0]);
    } else {
      setNewDueDate('');
    }
  }, [filters.status, isAdding]);

  // Click outside listener to collapse quick add
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target) && !newTitle.trim()) {
        setIsAdding(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newTitle]);

  // Get active view title name
  const viewTitle = useMemo(() => {
    if (filters.status === 'inbox') return 'Inbox';
    if (filters.status === 'today') return 'Today';
    if (filters.status === 'upcoming') return 'Upcoming';
    if (filters.status === 'completed') return 'Completed';
    
    const proj = projects.find(p => p.id === filters.status);
    return proj ? proj.name : 'Tasks';
  }, [filters.status, projects]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return tasks.filter(task => {
      // 1. Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesSubtasks = task.subtasks?.some(s => s.title.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesDesc && !matchesSubtasks) {
          return false;
        }
      }

      // 2. Priority Filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // 3. Category/View Status Filter
      if (filters.status === 'inbox') {
        return !task.completed;
      }
      
      if (filters.status === 'today') {
        // Today view shows incomplete tasks due today or overdue
        const isOverdue = task.dueDate && task.dueDate < todayStr;
        const isToday = task.dueDate === todayStr;
        return !task.completed && (isToday || isOverdue);
      }

      if (filters.status === 'upcoming') {
        const isUpcoming = task.dueDate && task.dueDate > todayStr;
        return !task.completed && isUpcoming;
      }

      if (filters.status === 'completed') {
        return task.completed;
      }

      // If status is project ID, match projectId
      if (filters.status.startsWith('proj-')) {
        return task.projectId === filters.status;
      }

      return true;
    });
  }, [tasks, filters, searchQuery]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    return [...filteredTasks].sort((a, b) => {
      // Completed tasks always go to the bottom in Project views
      if (filters.status.startsWith('proj-')) {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
      }

      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }

      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }

      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });
  }, [filteredTasks, sortBy, filters.status]);

  const handleSortChange = (e) => {
    dispatch({ type: 'SET_SORT', payload: e.target.value });
  };

  const handlePriorityFilterChange = (e) => {
    dispatch({ type: 'SET_PRIORITY_FILTER', payload: e.target.value });
  };

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: '',
      completed: false,
      priority: newPriority,
      dueDate: newDueDate || null,
      projectId: newProjectId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: []
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    
    // Reset title and keep adding box open for subsequent additions
    setNewTitle('');
    // Retain custom settings if user wants to add multiple tasks under same project/priority
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.viewTitleContainer}>
          <button
            onClick={onToggleSidebar}
            className={styles.mobileNavToggle}
            aria-label="Open navigation sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className={styles.viewTitle}>{viewTitle}</h1>
        </div>

        <div className={styles.toolbar}>
          {/* Priority filter */}
          <div className={styles.selectWrapper}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            <label htmlFor="priority-filter" className="visually-hidden">Filter by priority</label>
            <select
              id="priority-filter"
              value={filters.priority}
              onChange={handlePriorityFilterChange}
              className={styles.select}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Sort Menu */}
          <div className={styles.selectWrapper}>
            <label htmlFor="task-sort">Sort by</label>
            <select
              id="task-sort"
              value={sortBy}
              onChange={handleSortChange}
              className={styles.select}
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Creation Date</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Add Task Box */}
      {filters.status !== 'completed' && (
        <form
          ref={quickAddRef}
          onSubmit={handleQuickAddSubmit}
          className={`${styles.quickAddBox} ${isAdding ? styles.quickAddBoxFocused : ''}`}
        >
          <div className={styles.quickAddInputRow}>
            <Plus size={20} className={styles.emptyIcon} style={{ color: 'var(--primary-color)' }} />
            <input
              type="text"
              className={styles.quickAddInput}
              placeholder="Add a task..."
              value={newTitle}
              onFocus={() => setIsAdding(true)}
              onChange={(e) => setNewTitle(e.target.value)}
              aria-label="Task Title"
            />
          </div>

          {isAdding && (
            <div className={styles.quickAddActionsRow}>
              <div className={styles.quickAddControls}>
                {/* Due Date Picker */}
                <div className={styles.controlItem}>
                  <Calendar size={14} />
                  <label htmlFor="quick-add-date" className="visually-hidden">Due date</label>
                  <input
                    id="quick-add-date"
                    type="date"
                    className={styles.controlInput}
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>

                {/* Priority Selection */}
                <div className={styles.controlItem}>
                  <SlidersHorizontal size={14} />
                  <label htmlFor="quick-add-priority" className="visually-hidden">Priority</label>
                  <select
                    id="quick-add-priority"
                    className={styles.controlSelect}
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                {/* Project Selection */}
                <div className={styles.controlItem}>
                  <Tag size={14} />
                  <label htmlFor="quick-add-project" className="visually-hidden">Project</label>
                  <select
                    id="quick-add-project"
                    className={styles.controlSelect}
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.quickAddButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle('');
                  }}
                  className={`${styles.btn} ${styles.btnCancel}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className={`${styles.btn} ${styles.btnSubmit}`}
                >
                  Add Task
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Tasks List */}
      <div className={styles.list}>
        {sortedTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className={styles.emptyState}>
          <CheckSquare size={48} className={styles.emptyIcon} strokeWidth={1.5} />
          <h2 className={styles.emptyTitle}>All clear!</h2>
          <p className={styles.emptyDesc}>
            {searchQuery 
              ? 'No tasks matched your search query. Try typing something else!'
              : 'Enjoy your day, or add a task to get started.'}
          </p>
        </div>
      )}
    </main>
  );
}
