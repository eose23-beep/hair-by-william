import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './fonts-body.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/** Display faces after first paint — optional + late = no booking CLS */
const loadDisplayFonts = () => {
  import('./fonts-display.css')
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadDisplayFonts, { timeout: 3500 })
} else {
  window.addEventListener('load', () => setTimeout(loadDisplayFonts, 1), { once: true })
}
