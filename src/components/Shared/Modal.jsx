import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../../context/TaskContext';
import { X, Check } from 'lucide-react';
import styles from './Modal.module.css';

const PRESET_COLORS = [
  '#1a73e8', // Blue
  '#34a853', // Green
  '#f9ab00', // Orange
  '#ea4335', // Red
  '#a142f4', // Purple
  '#e374ff', // Pink
  '#00bac4', // Teal
  '#70757a'  // Gray
];

export default function Modal({ isOpen, onClose }) {
  const { dispatch } = useTasks();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const inputRef = useRef(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor(PRESET_COLORS[0]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on Escape press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      color
    };

    dispatch({ type: 'ADD_PROJECT', payload: newProject });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>Create New Project</h2>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close project modal"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Project Name Input */}
            <div className={styles.field}>
              <label htmlFor="project-name-input" className={styles.label}>Project Name</label>
              <input
                ref={inputRef}
                id="project-name-input"
                type="text"
                className={styles.input}
                placeholder="e.g. Work, Groceries, Fitness..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                required
              />
            </div>

            {/* Project Color Picker */}
            <div className={styles.field}>
              <span className={styles.label}>Choose Color Theme</span>
              <div className={styles.colorGrid}>
                {PRESET_COLORS.map((c) => {
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorOption} ${isSelected ? styles.colorOptionSelected : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                      title={c}
                    >
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.btn} ${styles.btnCancel}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`${styles.btn} ${styles.btnSubmit}`}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
