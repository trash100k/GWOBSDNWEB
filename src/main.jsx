// GAELWORX brand type — self-hosted (bundled, loads in prod + offline).
// Cinzel Decorative = the ONLY display/brand serif (700 + 900, A+E ignited).
import '@fontsource/cinzel-decorative/latin-700.css'
import '@fontsource/cinzel-decorative/latin-900.css'
// Bricolage Grotesque = headlines. Hanken Grotesk = body + labels (legibility).
import '@fontsource-variable/bricolage-grotesque/wght.css'
import '@fontsource/hanken-grotesk/latin-400.css'
import '@fontsource/hanken-grotesk/latin-600.css'
import '@fontsource/hanken-grotesk/latin-700.css'

import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Note: intentionally NOT wrapped in <StrictMode> — double-invoked effects are
// hostile to the imperative GSAP/three animation pipeline.
createRoot(document.getElementById('root')).render(<App />)
