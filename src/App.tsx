import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Projects from './pages/Projects'
import ProjectDetail from './pages/Projects/ProjectDetail'
import Sales from './pages/Sales'
import ProductDetail from './pages/Sales/ProductDetail'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ChangePassword from './pages/Admin/ChangePassword'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sobre" element={<About />} />
      <Route path="/servicos" element={<Services />} />
      <Route path="/contato" element={<Contact />} />
      <Route path="/projetos" element={<Projects />} />
      <Route path="/projetos/:slug" element={<ProjectDetail />} />
      <Route path="/vendas" element={<Sales />} />
      <Route path="/vendas/:slug" element={<ProductDetail />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/change-password" element={<ChangePassword />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
