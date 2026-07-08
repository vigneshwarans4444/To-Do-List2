import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply theme before first render to prevent flash of unstyled content (FOUC)
;(function applyInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem('todo_theme') || 'light'
    let appliedTheme = savedTheme
    if (savedTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      appliedTheme = systemPrefersDark ? 'dark' : 'light'
    }
    document.documentElement.setAttribute('data-theme', appliedTheme)
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
