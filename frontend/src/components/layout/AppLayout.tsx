import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuthStore, useUIStore } from '@/store'

export default function AppLayout() {
  const { user } = useAuthStore()
  const { sidebarCollapsed, mobileSidebarOpen } = useUIStore()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar */}
      {mobileSidebarOpen && <Sidebar mobile />}

      {/* Main content */}
      <div
        className={`main-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Topbar />
        <main className="page-content animate-fade-in" style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
