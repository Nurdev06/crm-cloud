import { useThemeStore, useAuthStore } from '@/store'
import { Sun, Moon, Shield, RefreshCw, Check } from 'lucide-react'
import { ROLE_CONFIG, getAvatarColor, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const ROLES: Array<'super_admin' | 'sales_manager' | 'sales_rep' | 'warehouse_manager' | 'logistics_manager' | 'customer_support' | 'finance_manager'> = [
  'super_admin',
  'sales_manager',
  'sales_rep',
  'warehouse_manager',
  'logistics_manager',
  'customer_support',
  'finance_manager',
]

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { user, accessToken, refreshToken, setAuth } = useAuthStore()

  const handleRoleSwitch = (role: any) => {
    if (!user) return
    const updatedUser = { ...user, role }
    setAuth(updatedUser, accessToken || '', refreshToken || '')
    toast.success(`Switched role simulation to: ${ROLE_CONFIG[role]?.label || role}`)
  }

  return (
    <div style={{ maxWidth: 750 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">System Settings</h1>
          <p className="section-subtitle">
            Configure theme aesthetics, profile credentials, and role delegation simulation.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Card */}
        {user && (
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Profile Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                className="avatar"
                style={{ width: 64, height: 64, fontSize: 22, background: getAvatarColor(user.full_name) }}
              >
                {getInitials(user.full_name)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{user.full_name}</div>
                <div style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginTop: 2 }}>{user.email}</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${ROLE_CONFIG[user.role]?.badge || 'badge-gray'}`} style={{ padding: '4px 10px', fontSize: 11 }}>
                    Active: {ROLE_CONFIG[user.role]?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Settings Card */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Appearance Settings</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Theme Mode</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))', marginTop: 2 }}>
                Toggle between light and dark display modes
              </div>
            </div>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={toggleTheme}>
              {theme === 'dark' ? (
                <>
                  <Sun size={16} /> Light Mode
                </>
              ) : (
                <>
                  <Moon size={16} /> Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Role Delegation Simulation (Crucial for testing RBAC layout) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Shield size={18} style={{ color: '#8b5cf6' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>RBAC Simulation Engine</h3>
          </div>
          <p style={{ fontSize: 12, color: 'hsl(var(--text-muted))', margin: '0 0 16px 0' }}>
            Simulate views of other user roles. Selecting a role below will dynamically adapt the sidebar navigation and page permissions based on Role-Based Access Controls.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {ROLES.map((role) => {
              const isActive = user?.role === role
              return (
                <button
                  key={role}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    fontSize: 13,
                    borderColor: isActive ? 'transparent' : 'hsl(var(--border))',
                  }}
                  onClick={() => handleRoleSwitch(role)}
                >
                  <span>{ROLE_CONFIG[role]?.label || role}</span>
                  {isActive && <Check size={14} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
