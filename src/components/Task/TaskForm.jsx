import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { X, Plus, Trash2, Check, Calendar, Tag, CheckSquare, Sparkles } from 'lucide-react';
import styles from './TaskForm.module.css';

export default function TaskForm() {
  const { state, dispatch } = useTasks();
  const { tasks, projects, selectedTaskId } = state;

  const task = tasks.find(t => t.id === selectedTaskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  // Sync local inputs when the selected task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [selectedTaskId, task?.id]);

  if (!task) return null;

  const handleClose = () => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: null });
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, title: title.trim() }
      });
    } else {
      // Revert if empty
      setTitle(task.title);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, description: description.trim() }
      });
    }
  };

  const handleDueDateChange = (e) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, dueDate: e.target.value || null }
    });
  };

  const handleProjectChange = (e) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, projectId: e.target.value || null }
    });
  };

  const handlePriorityChange = (priority) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, priority }
    });
  };

  // Toggle subtask completion
  const handleToggleSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.map(sub =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, subtasks: updatedSubtasks }
    });
  };

  // Add subtask
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    const newSubItem = {
      id: `sub-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false
    };

    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, subtasks: [...(task.subtasks || []), newSubItem] }
    });

    setNewSubtask('');
  };

  // Delete subtask
  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(sub => sub.id !== subtaskId);
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, subtasks: updatedSubtasks }
    });
  };

  // Delete full task
  const handleDeleteTask = () => {
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
    }
  };

  return (
    <aside className={`${styles.panel} ${selectedTaskId ? styles.panelOpen : ''}`}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Task Details</span>
        <button
          onClick={handleClose}
          className={styles.closeBtn}
          aria-label="Close task details panel"
          title="Close details"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.content}>
        {/* Title Inline Edit */}
        <div className={styles.field}>
          <label htmlFor="detail-title" className="visually-hidden">Task Title</label>
          <input
            id="detail-title"
            type="text"
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="Task title is required"
          />
        </div>

        {/* Description Inline Edit */}
        <div className={styles.field}>
          <label htmlFor="detail-desc" className={styles.label}>Description</label>
          <textarea
            id="detail-desc"
            className={styles.descriptionInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description to this task..."
          />
        </div>

        {/* Due Date Picker */}
        <div className={styles.field}>
          <label htmlFor="detail-date" className={styles.label}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Due Date
            </span>
          </label>
          <input
            id="detail-date"
            type="date"
            className={styles.dateInput}
            value={task.dueDate || ''}
            onChange={handleDueDateChange}
          />
        </div>

        {/* Project Selector */}
        <div className={styles.field}>
          <label htmlFor="detail-project" className={styles.label}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} /> Project Category
            </span>
          </label>
          <select
            id="detail-project"
            className={styles.selectInput}
            value={task.projectId || ''}
            onChange={handleProjectChange}
          >
            <option value="">No Project</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div className={styles.field}>
          <span className={styles.label}>Priority</span>
          <div className={styles.priorityGroup}>
            {['low', 'medium', 'high'].map(p => {
              const isActive = task.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePriorityChange(p)}
                  className={`${styles.priorityBtn} ${isActive ? styles[`priorityBtnActive_${p}`] : ''}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks Checklist */}
        <div className={`${styles.field} ${styles.subtasksContainer}`}>
          <span className={styles.label}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={14} /> Subtasks
            </span>
          </span>
          
          <ul className={styles.subtaskList}>
            {task.subtasks?.map(sub => (
              <li key={sub.id} className={styles.subtaskItem}>
                <div className={styles.subtaskLeft}>
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(sub.id)}
                    className={`${styles.subtaskCheckbox} ${sub.completed ? styles.subtaskCheckboxChecked : ''}`}
                    aria-label={sub.completed ? `Mark subtask ${sub.title} as incomplete` : `Mark subtask ${sub.title} as complete`}
                  >
                    {sub.completed && <Check size={10} strokeWidth={4} />}
                  </button>
                  <span className={`${styles.subtaskTitle} ${sub.completed ? styles.subtaskTitleChecked : ''}`}>
                    {sub.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(sub.id)}
                  className={styles.subtaskDeleteBtn}
                  aria-label={`Delete subtask ${sub.title}`}
                  title="Delete Subtask"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddSubtask} className={styles.subtaskAddForm}>
            <input
              type="text"
              placeholder="Add a subtask..."
              className={styles.subtaskAddInput}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              aria-label="New Subtask Title"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim()}
              className={styles.subtaskAddBtn}
              aria-label="Add subtask"
              title="Add Subtask"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          onClick={handleDeleteTask}
          className={styles.deleteTaskBtn}
          aria-label="Delete entire task"
          title="Delete Task"
        >
          <Trash2 size={14} /> Delete Task
        </button>
      </div>
    </aside>
  );
}
