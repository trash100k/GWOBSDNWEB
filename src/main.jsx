// Self-hosted Cinzel (bundled — loads in prod + offline, no Google Fonts dependency).
import '@fontsource/cinzel/latin-400.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/cinzel/latin-700.css'

import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Note: intentionally NOT wrapped in <StrictMode> — double-invoked effects are
// hostile to the imperative GSAP/three animation pipeline.
createRoot(document.getElementById('root')).render(<App />)
