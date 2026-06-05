import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, AlertTriangle, Headphones,
  ArrowUpRight, Truck, Target, Activity
} from 'lucide-react'
import { analyticsService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6']

function KPICard({
  title, value, subtitle, icon: Icon, color, trend, trendLabel
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  color: string
  trend?: number
  trendLabel?: string
}) {
  const isUp = trend !== undefined && trend >= 0
  return (
    <motion.div
      className={`kpi-card ${color}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'hsl(var(--bg-muted))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' :
              color === 'purple' ? '#8b5cf6' : color === 'orange' ? '#f59e0b' :
              color === 'red' ? '#ef4444' : '#14b8a6',
          }}
        >
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: isUp ? '#10b981' : '#ef4444',
            }}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--text-secondary))', marginBottom: 2 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>{subtitle}</div>
      )}
      {trendLabel && (
        <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>{trendLabel}</div>
      )}
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: 'var(--shadow-md)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000
              ? formatCurrency(p.value)
              : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsService.dashboard,
  })
  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => analyticsService.revenueTrend(12),
  })
  const { data: ordersByStatus } = useQuery({
    queryKey: ['orders-by-status'],
    queryFn: analyticsService.ordersByStatus,
  })
  const { data: leadsPipeline } = useQuery({
    queryKey: ['leads-pipeline'],
    queryFn: analyticsService.leadsPipeline,
  })
  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => analyticsService.topProducts(6),
  })
  const { data: customerGrowth } = useQuery({
    queryKey: ['customer-growth'],
    queryFn: () => analyticsService.customerGrowth(6),
  })

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {greeting}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: 14 }}>
          {formatDate(today, 'EEEE, MMMM dd yyyy')} · Here's what's happening today
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <KPICard
          title="Monthly Revenue"
          value={formatCurrency(stats?.revenue?.this_month || 0)}
          trend={stats?.revenue?.growth_percent}
          trendLabel="vs last month"
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Total Orders"
          value={stats?.orders?.total || 0}
          subtitle={`${stats?.orders?.pending || 0} pending approval`}
          icon={ShoppingCart}
          color="green"
        />
        <KPICard
          title="Active Customers"
          value={stats?.customers?.active || 0}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Leads"
          value={stats?.leads?.active || 0}
          icon={Target}
          color="orange"
        />
        <KPICard
          title="Open Tickets"
          value={stats?.support?.open_tickets || 0}
          icon={Headphones}
          color="teal"
        />
        <KPICard
          title="Low Stock Items"
          value={stats?.inventory?.low_stock_items || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" subtitle="Last 12 months">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Orders by Status */}
        <ChartCard title="Orders by Status" subtitle="Current distribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 280 }}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={3}
                >
                  {(ordersByStatus || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ordersByStatus || []).map((item: any, i: number) => (
                <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: 'hsl(var(--text-secondary))', textTransform: 'capitalize', flex: 1 }}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontWeight: 600 }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Top Products */}
        <ChartCard title="Top Products" subtitle="By units sold">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
                  tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_sold" name="Units Sold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Customer Growth */}
        <ChartCard title="Customer Growth" subtitle="New customers per month">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="new_customers"
                  name="New Customers"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Pipeline Summary */}
      {leadsPipeline && leadsPipeline.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sales Pipeline Summary</h3>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {leadsPipeline.map((stage: any, i: number) => (
              <div
                key={stage.stage}
                style={{
                  flex: '0 0 auto',
                  minWidth: 130,
                  padding: '12px 14px',
                  background: 'hsl(var(--bg-muted))',
                  borderRadius: 12,
                  borderTop: `3px solid ${COLORS[i % COLORS.length]}`,
                }}
              >
                <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', textTransform: 'capitalize', marginBottom: 6 }}>
                  {stage.stage.replace('_', ' ')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{stage.count}</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--text-secondary))' }}>
                  {formatCurrency(stage.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
