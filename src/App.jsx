import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ForgeExperience from './ForgeExperience.jsx'
import Home from './pages/Home.jsx'
import Software from './pages/Software.jsx'
import Voice from './pages/Voice.jsx'
import Automations from './pages/Automations.jsx'
import Web from './pages/Web.jsx'
import Work from './pages/Work.jsx'
import Pricing from './pages/Pricing.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import StubPage from './pages/StubPage.jsx'

// Routed shell: ForgeExperience is the persistent layout (canvas + atmosphere +
// nav + cursor); each route renders into its <Outlet>. Every page is built on the
// shared PageShell placement system; specialists deepen each in the sprint.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ForgeExperience />}>
          <Route path="/" element={<Home />} />
          <Route path="/software" element={<Software />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/web" element={<Web />} />
          <Route path="/work" element={<Work />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<StubPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
