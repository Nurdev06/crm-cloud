import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store'
import { authService } from '@/services'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nurbekcrm.com')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await authService.login(email, password)
      setAuth(data.user, data.access_token, data.refresh_token)
      toast.success(`Welcome back, ${data.user.full_name}!`)
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--bg-base))',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'hsl(var(--bg-card))',
          borderRadius: 24,
          border: '1px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-lg)',
          padding: 40,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            className="logo-icon"
            style={{ width: 48, height: 48, fontSize: 22, borderRadius: 14 }}
          >
            N
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 2 }}>NurbekCRM</h1>
            <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>
              Enterprise Distribution Platform
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
        <p style={{ fontSize: 14, color: 'hsl(var(--text-secondary))', marginBottom: 28 }}>
          Enter your credentials to access the dashboard
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Email address
            </label>
            <div className="input-with-icon">
              <Mail className="icon" />
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div className="input-with-icon">
                <Lock className="icon" />
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--text-muted))',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div
          style={{
            marginTop: 28,
            padding: 16,
            background: 'hsl(var(--bg-muted))',
            borderRadius: 12,
            border: '1px solid hsl(var(--border))',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'hsl(var(--text-secondary))' }}>
            🔑 Demo Accounts (password: Admin123!)
          </p>
          {[
            ['admin@nurbekcrm.com', 'Super Admin'],
            ['sales.rep@nurbekcrm.com', 'Sales Representative'],
            ['finance@nurbekcrm.com', 'Finance Manager'],
          ].map(([email, role]) => (
            <button
              key={email}
              type="button"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                fontSize: 12,
                padding: '4px 6px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#3b82f6',
                marginBottom: 2,
              }}
              onClick={() => setEmail(email)}
            >
              {email} <span style={{ color: 'hsl(var(--text-muted))' }}>— {role}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
