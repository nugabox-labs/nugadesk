import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/category/:categoryId" element={<CategoryDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
