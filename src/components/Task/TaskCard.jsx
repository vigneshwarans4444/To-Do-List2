import React from 'react';
import { useTasks } from '../../context/TaskContext';
import { Check, Calendar, Trash2, CheckSquare } from 'lucide-react';
import styles from './TaskCard.module.css';

export default function TaskCard({ task }) {
  const { state, dispatch } = useTasks();
  const { projects, selectedTaskId } = state;
  const isSelected = selectedTaskId === task.id;

  const project = projects.find(p => p.id === task.projectId);

  // Toggle task completion
  const handleToggle = (e) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_TASK', payload: task.id });
  };

  // Select task for editing/detail view
  const handleSelect = () => {
    // Toggle: if already selected, close it; else open it
    const nextSelectedId = isSelected ? null : task.id;
    dispatch({ type: 'SET_SELECTED_TASK', payload: nextSelectedId });
  };

  // Delete task
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
    }
  };

  // Format due date label
  const getDueDateLabel = () => {
    if (!task.dueDate) return null;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Tomorrow helper
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Yesterday helper
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (task.dueDate === todayStr) {
      return { text: 'Today', type: 'today' };
    } else if (task.dueDate === tomorrowStr) {
      return { text: 'Tomorrow', type: 'upcoming' };
    } else if (task.dueDate === yesterdayStr) {
      return { text: 'Yesterday', type: 'overdue' };
    } else {
      const isOverdue = task.dueDate < todayStr && !task.completed;
      
      // Parse friendly date format (e.g. Jul 15)
      const dateParts = task.dueDate.split('-');
      if (dateParts.length === 3) {
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { text: formatted, type: isOverdue ? 'overdue' : 'normal' };
      }
      
      return { text: task.dueDate, type: isOverdue ? 'overdue' : 'normal' };
    }
  };

  const dueDateInfo = getDueDateLabel();

  // Get subtasks progress text (e.g., "1/3")
  const getSubtasksProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completedCount = task.subtasks.filter(s => s.completed).length;
    return `${completedCount}/${task.subtasks.length}`;
  };

  const subtasksProgress = getSubtasksProgress();

  return (
    <div
      onClick={handleSelect}
      className={`${styles.card} ${isSelected ? styles.cardActive : ''} fade-in`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Task: ${task.title}. ${task.completed ? 'Completed' : 'Pending'}. ${task.priority} priority. Due date ${task.dueDate || 'none'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSelect();
        }
      }}
    >
      {/* Custom Circular Checkbox */}
      <div className={styles.checkboxContainer}>
        <button
          onClick={handleToggle}
          className={`${styles.customCheckbox} ${task.completed ? styles.checkboxChecked : ''}`}
          aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
          title={task.completed ? "Mark Incomplete" : "Mark Complete"}
        >
          {task.completed && <Check size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* Task Content */}
      <div className={styles.content}>
        <h3 className={`${styles.title} ${task.completed ? styles.titleCompleted : ''}`}>
          {task.title}
        </h3>
        
        {task.description && (
          <p className={styles.description}>
            {task.description}
          </p>
        )}

        <div className={styles.metaRow}>
          {/* Project Tag */}
          {project && (
            <span
              className={`${styles.badge} ${styles.projectBadge}`}
              style={{ borderColor: `${project.color}33`, color: project.color, backgroundColor: `${project.color}0a` }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: project.color,
                  marginRight: '2px'
                }}
              />
              {project.name}
            </span>
          )}

          {/* Due Date */}
          {dueDateInfo && (
            <span
              className={`${styles.badge} ${styles.dateBadge} ${
                dueDateInfo.type === 'overdue' ? styles.dateOverdue : 
                dueDateInfo.type === 'today' ? styles.dateToday : ''
              }`}
            >
              <Calendar size={12} />
              {dueDateInfo.text}
            </span>
          )}

          {/* Subtasks Progress */}
          {subtasksProgress && (
            <span className={`${styles.badge} ${styles.subtasksBadge}`} title="Subtasks completion">
              <CheckSquare size={12} />
              {subtasksProgress}
            </span>
          )}

          {/* Priority */}
          <span className={`${styles.badge} ${styles.priorityBadge} ${styles[`priority_${task.priority}`]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Action buttons (Delete) */}
      <div className={styles.actionsSection}>
        <button
          onClick={handleDelete}
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          aria-label={`Delete task ${task.title}`}
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
