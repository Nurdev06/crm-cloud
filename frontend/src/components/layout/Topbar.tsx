import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react'
import { useThemeStore, useAuthStore, useUIStore } from '@/store'
import { getInitials, getAvatarColor } from '@/lib/utils'

export default function Topbar() {
  const { theme, toggleTheme } = useThemeStore()
  const { user, clearAuth } = useAuthStore()
  const { setMobileSidebar } = useUIStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="topbar">
      {/* Mobile hamburger */}
      <button
        className="btn btn-ghost btn-icon md:hidden"
        onClick={() => setMobileSidebar(true)}
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
        <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
        <input
          type="text"
          placeholder="Search customers, orders, products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="btn btn-ghost btn-icon"
          style={{ position: 'relative' }}
          onClick={() => navigate('/notifications')}
        >
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div
              className="avatar"
              style={{
                width: 32,
                height: 32,
                fontSize: 12,
                background: user ? getAvatarColor(user.full_name) : '#3b82f6',
              }}
            >
              {user ? getInitials(user.full_name) : 'U'}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="sm-block">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name}</div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setProfileOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: 220,
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 14,
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.full_name}</div>
                  <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>{user?.email}</div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <button
                    className="nav-item"
                    style={{ margin: '2px 8px', width: 'calc(100% - 16px)' }}
                    onClick={() => { setProfileOpen(false); navigate('/settings') }}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  <button
                    className="nav-item"
                    style={{ width: 'calc(100% - 16px)' }}
                    onClick={() => { setProfileOpen(false); navigate('/settings') }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <div style={{ borderTop: '1px solid hsl(var(--border))', margin: '4px 0' }} />
                  <button
                    className="nav-item"
                    style={{ width: 'calc(100% - 16px)', color: '#ef4444' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
