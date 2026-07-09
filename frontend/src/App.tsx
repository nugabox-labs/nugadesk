import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AssetManagementPage } from './pages/AssetManagementPage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { InfoManagementPage } from './pages/InfoManagementPage'
import { LoginPage } from './pages/LoginPage'
import { LinksPage } from './pages/LinksPage'
import { TaskManagementPage } from './pages/TaskManagementPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/tasks" element={<TaskManagementPage />} />
          <Route path="/assets" element={<AssetManagementPage />} />
          <Route path="/info" element={<InfoManagementPage />} />
          <Route path="/category/:categoryId" element={<CategoryDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
