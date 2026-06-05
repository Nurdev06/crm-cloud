import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, UserCheck, TrendingUp, Package,
  Warehouse, ShoppingCart, Truck, FileText, Headphones,
  BarChart3, Bell, FolderOpen, Shield, Settings,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { getInitials, getAvatarColor, ROLE_CONFIG } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['all'] },
  { icon: Users, label: 'Customers', path: '/customers', roles: ['all'] },
  { icon: UserCheck, label: 'Leads', path: '/leads', roles: ['super_admin', 'sales_manager', 'sales_rep'] },
  { icon: TrendingUp, label: 'Pipeline', path: '/pipeline', roles: ['super_admin', 'sales_manager', 'sales_rep'] },
  { icon: Package, label: 'Products', path: '/products', roles: ['all'] },
  { icon: Warehouse, label: 'Inventory', path: '/inventory', roles: ['super_admin', 'sales_manager', 'warehouse_manager'] },
  { icon: ShoppingCart, label: 'Orders', path: '/orders', roles: ['all'] },
  { icon: Truck, label: 'Deliveries', path: '/deliveries', roles: ['super_admin', 'sales_manager', 'logistics_manager'] },
  { icon: FileText, label: 'Invoices', path: '/invoices', roles: ['super_admin', 'sales_manager', 'finance_manager'] },
  { icon: Headphones, label: 'Support', path: '/support', roles: ['super_admin', 'sales_manager', 'customer_support'] },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['super_admin', 'sales_manager', 'finance_manager'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['all'] },
  { icon: FolderOpen, label: 'Documents', path: '/documents', roles: ['all'] },
  { icon: Shield, label: 'Audit Logs', path: '/audit', roles: ['super_admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['all'] },
]

interface SidebarProps {
  mobile?: boolean
}

export default function Sidebar({ mobile }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebar } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const collapsed = !mobile && sidebarCollapsed

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role || '')
  )

  const handleMobileClose = () => setMobileSidebar(false)

  return (
    <>
      {/* Mobile overlay */}
      {mobile && mobileSidebarOpen && (
        <div
          className="overlay md:hidden"
          onClick={handleMobileClose}
          style={{ zIndex: 39 }}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${
          mobile ? `mobile-open` : ''
        }`}
        style={{ zIndex: mobile ? 50 : 40 }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">C</div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="logo-text">ClothCRM</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>Enterprise</div>
            </motion.div>
          )}
          {mobile && (
            <button
              className="btn btn-ghost btn-icon ml-auto"
              onClick={handleMobileClose}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Toggle (desktop) */}
        {!mobile && (
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-icon"
            style={{
              position: 'absolute',
              top: 20,
              right: -14,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border))',
              padding: 0,
              zIndex: 10,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => mobile && handleMobileClose()}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="nav-icon" size={18} />
                {!collapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              overflow: 'hidden',
            }}
          >
            <div
              className="avatar"
              style={{ background: getAvatarColor(user.full_name), flexShrink: 0 }}
            >
              {getInitials(user.full_name)}
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ minWidth: 0 }}
              >
                <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>
                  {user.full_name}
                </div>
                <div>
                  <span className={`badge ${ROLE_CONFIG[user.role]?.badge || 'badge-gray'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                    {ROLE_CONFIG[user.role]?.label}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
