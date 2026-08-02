import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Projects from './pages/Projects'
import ProjectDetail from './pages/Projects/ProjectDetail'
import Gallery from './pages/Gallery'
import GalleryDetail from './pages/Gallery/GalleryDetail'
import Sales from './pages/Sales'
import ProductDetail from './pages/Sales/ProductDetail'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ChangePassword from './pages/Admin/ChangePassword'

/**
 * Qualquer rota desconhecida. As URLs do site estático antigo (/vendas.html,
 * /sobre.html…) continuam vindo de buscadores e favoritos; sem isso o React
 * não casa nenhuma rota e a página fica totalmente em branco.
 */
function LegacyRedirect() {
  const { pathname, search } = useLocation()
  if (/\.html$/i.test(pathname)) {
    const stripped = pathname.replace(/\.html$/i, '')
    return <Navigate to={stripped === '/index' ? '/' : stripped + search} replace />
  }
  return <Navigate to="/" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sobre" element={<About />} />
      <Route path="/servicos" element={<Services />} />
      <Route path="/contato" element={<Contact />} />
      <Route path="/projetos" element={<Projects />} />
      <Route path="/projetos/:slug" element={<ProjectDetail />} />
      <Route path="/galeria" element={<Gallery />} />
      <Route path="/galeria/:slug" element={<GalleryDetail />} />
      <Route path="/vendas" element={<Sales />} />
      <Route path="/vendas/:slug" element={<ProductDetail />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/change-password" element={<ChangePassword />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<LegacyRedirect />} />
    </Routes>
  )
}

export default App
