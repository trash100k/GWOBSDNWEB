import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ForgeExperience from './ForgeExperience.jsx'
import Home from './pages/Home.jsx'
import StubPage from './pages/StubPage.jsx'
import { ROUTES } from './routes.js'

// Routed shell: ForgeExperience is the persistent layout (canvas + atmosphere +
// nav + cursor); each route renders into its <Outlet>. Home is the full journey;
// the other routes are Phase-0 stubs, replaced by real pages + scenes in Phase 1.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ForgeExperience />}>
          <Route path="/" element={<Home />} />
          {ROUTES.filter((r) => r.path !== '/').map((r) => (
            <Route key={r.path} path={r.path} element={<StubPage />} />
          ))}
          <Route path="*" element={<StubPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
