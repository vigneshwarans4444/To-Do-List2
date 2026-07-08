import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create context
const TaskContext = createContext();

// Default initial state
const defaultProjects = [
  { id: 'proj-personal', name: 'Personal', color: '#34a853' }, // green
  { id: 'proj-work', name: 'Work', color: '#1a73e8' }, // blue
  { id: 'proj-shopping', name: 'Shopping', color: '#f9ab00' } // orange
];

const defaultTasks = [
  {
    id: 'task-1',
    title: 'Finish coding project',
    description: 'Implement the frontend using React/HTML/CSS and mock API calls. Add unit tests for the task actions.',
    completed: false,
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0], // Today
    projectId: 'proj-work',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    subtasks: [
      { id: 'sub-1-1', title: 'Create project structure', completed: true },
      { id: 'sub-1-2', title: 'Implement React context and hooks', completed: true },
      { id: 'sub-1-3', title: 'Create sidebar and layout components', completed: false },
      { id: 'sub-1-4', title: 'Verify responsive mobile views', completed: false }
    ]
  },
  {
    id: 'task-2',
    title: 'Buy fresh groceries',
    description: 'Get avocados, fresh sourdough bread, organic almond milk, coffee beans, and fresh spinach.',
    completed: false,
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    projectId: 'proj-shopping',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    subtasks: [
      { id: 'sub-2-1', title: 'Check pantry inventory', completed: true },
      { id: 'sub-2-2', title: 'Go to Farmer\'s Market', completed: false }
    ]
  },
  {
    id: 'task-3',
    title: 'Call Mom',
    description: 'Check in on her weekend trip and catch up on family news.',
    completed: false,
    priority: 'low',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
    projectId: 'proj-personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-4',
    title: 'Plan weekend hiking trip',
    description: 'Book the cabin, research trail options (Moderate skill level), and prepare gear checklist.',
    completed: true,
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago (completed)
    projectId: 'proj-personal',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-4-1', title: 'Book mountain cabin', completed: true },
      { id: 'sub-4-2', title: 'Download map maps for offline use', completed: true }
    ]
  }
];

// Reducer function
function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks]
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload, updatedAt: new Date().toISOString() } : task
        ),
        // If the selected task is updated, make sure it reflects here too
        selectedTaskId: state.selectedTaskId === action.payload.id ? state.selectedTaskId : state.selectedTaskId
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
            : task
        )
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };

    case 'DELETE_PROJECT':
      // Remove project and disassociate its tasks (or delete them)
      return {
        ...state,
        projects: state.projects.filter(proj => proj.id !== action.payload),
        tasks: state.tasks.map(task =>
          task.projectId === action.payload ? { ...task, projectId: null } : task
        ),
        // If current filter is the deleted project, switch to inbox
        filters: state.filters.status === action.payload
          ? { ...state.filters, status: 'inbox' }
          : state.filters
      };

    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          status: action.payload // inbox, today, upcoming, completed, or project ID
        }
      };

    case 'SET_PRIORITY_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          priority: action.payload // all, high, medium, low
        }
      };

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload // dueDate, priority, created, alphabetical
      };

    case 'SET_SEARCH':
      return {
        ...state,
        searchQuery: action.payload
      };

    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTaskId: action.payload // task ID or null
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload // light, dark, system
      };

    default:
      return state;
  }
}

// Context provider component
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, null, () => {
    try {
      const savedTasks = window.localStorage.getItem('todo_tasks');
      const savedProjects = window.localStorage.getItem('todo_projects');
      const savedTheme = window.localStorage.getItem('todo_theme') || 'light';

      return {
        tasks: savedTasks ? JSON.parse(savedTasks) : defaultTasks,
        projects: savedProjects ? JSON.parse(savedProjects) : defaultProjects,
        filters: {
          status: 'inbox',
          priority: 'all'
        },
        sortBy: 'dueDate',
        searchQuery: '',
        selectedTaskId: null,
        theme: savedTheme
      };
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
      return {
        tasks: defaultTasks,
        projects: defaultProjects,
        filters: {
          status: 'inbox',
          priority: 'all'
        },
        sortBy: 'dueDate',
        searchQuery: '',
        selectedTaskId: null,
        theme: 'light'
      };
    }
  });

  // Sync state with localStorage
  useEffect(() => {
    if (state) {
      window.localStorage.setItem('todo_tasks', JSON.stringify(state.tasks));
    }
  }, [state?.tasks]);

  useEffect(() => {
    if (state) {
      window.localStorage.setItem('todo_projects', JSON.stringify(state.projects));
    }
  }, [state?.projects]);

  useEffect(() => {
    if (state) {
      window.localStorage.setItem('todo_theme', state.theme);
      
      let appliedTheme = state.theme;
      if (state.theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        appliedTheme = systemPrefersDark ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', appliedTheme);
    }
  }, [state?.theme]);

  // Handle system theme updates dynamically if 'system' theme is selected
  useEffect(() => {
    if (state?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [state?.theme]);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

// Custom hook to use task context
export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
