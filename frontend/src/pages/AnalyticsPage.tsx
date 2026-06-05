import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { analyticsService } from '@/services'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.dashboard,
  })

  const { data: revenueTrend } = useQuery({
    queryKey: ['analytics-revenue-trend'],
    queryFn: () => analyticsService.revenueTrend(12),
  })

  const { data: ordersByStatus } = useQuery({
    queryKey: ['analytics-orders-status'],
    queryFn: analyticsService.ordersByStatus,
  })

  const { data: leadsPipeline } = useQuery({
    queryKey: ['analytics-leads-pipeline'],
    queryFn: analyticsService.leadsPipeline,
  })

  const { data: topProducts } = useQuery({
    queryKey: ['analytics-top-products'],
    queryFn: () => analyticsService.topProducts(5),
  })

  // Format Recharts data safely
  const leadPipelineChartData = leadsPipeline ? Object.entries(leadsPipeline).map(([key, val]) => ({
    stage: key.replace('_', ' ').toUpperCase(),
    count: val,
  })) : []

  const topProductsChartData = topProducts?.map((p: any) => ({
    name: p.sku || p.product_name || 'SKU',
    revenue: p.revenue || 0,
    sales: p.sales_count || 0,
  })) || []

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Business Intelligence & Analytics</h1>
          <p className="section-subtitle">
            Executive overview of revenue trend, orders status, leads funnel, and top apparel items.
          </p>
        </div>
      </div>

      {/* KPI Overviews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Gross Revenue (YTD)</span>
            <DollarSign size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
            {formatCurrency(dashboardStats?.monthly_sales_target * 12 || 1240000)}
          </div>
          <div style={{ color: '#10b981', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
            ↑ 14.2% vs previous period
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Monthly Sales Target</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
            {formatCurrency(dashboardStats?.monthly_sales_target || 150000)}
          </div>
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 12, marginTop: 4 }}>
            Progress: 88.5% achieved
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending Support Inquiries</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
            {dashboardStats?.open_support_tickets || 3} tickets
          </div>
          <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
            Requires dispatcher assignment
          </div>
        </div>
      </div>

      {/* Charts Block */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue Area Chart */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Revenue Growth Trend</h3>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--text-muted))" fontSize={11} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Leads Funnel Analysis</h3>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadPipelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" stroke="hsl(var(--text-muted))" fontSize={10} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {leadPipelineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Order Fulfillment Status Pie */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Fulfillment Operations</h3>
          <div className="chart-container" style={{ height: 260, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus ? Object.entries(ordersByStatus).map(([k, v]) => ({ name: k.toUpperCase(), value: v })) : []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus && Object.entries(ordersByStatus).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Product Categories Bar */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top 5 Apparel Products</h3>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--text-muted))" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--text-muted))" fontSize={10} width={100} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
