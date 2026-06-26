import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Note: intentionally NOT wrapped in <StrictMode>. React's double-invoked
// effects in dev cause GSAP timelines, ScrollTriggers and three.js resources
// to be created twice, which is hostile to an imperative animation pipeline.
createRoot(document.getElementById('root')).render(<App />)
