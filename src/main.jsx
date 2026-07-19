import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './fonts.css'
import './index.css'

const rootEl = document.getElementById('root')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/* Hide static LCP shell once React has painted the real hero (same URL = cached). */
function markHydrated() {
  document.body.classList.add('is-hydrated')
  const shell = document.getElementById('lcp-shell')
  if (shell) shell.remove()
}

requestAnimationFrame(() => {
  requestAnimationFrame(markHydrated)
})
