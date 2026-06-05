import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, ShoppingBag, Truck, ClipboardList, Trash2, CheckCircle2 } from 'lucide-react'
import { orderService, customerService, productService } from '@/services'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import toast from 'react-hot-toast'

interface OrderLineItem {
  product_id: number
  quantity: number
  unit_price: number
  name?: string
  sku?: string
}

function OrderModal({
  open, onClose, onSave
}: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [items, setItems] = useState<OrderLineItem[]>([])
  
  // For adding a new line
  const [selProductId, setSelProductId] = useState<number | null>(null)
  const [selQty, setSelQty] = useState(1)

  const { data: customersData } = useQuery({
    queryKey: ['customers-list-orders'],
    queryFn: () => customerService.list({ size: 100 }),
    enabled: open,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-list-orders'],
    queryFn: () => productService.list(),
    enabled: open,
  })

  const handleAddItem = () => {
    if (!selProductId) return
    const prod = productsData?.find((p: any) => p.id === selProductId)
    if (!prod) return

    // Check if product already added
    const existsIndex = items.findIndex(item => item.product_id === selProductId)
    if (existsIndex > -1) {
      const updated = [...items]
      updated[existsIndex].quantity += selQty
      setItems(updated)
    } else {
      setItems([
        ...items,
        {
          product_id: selProductId,
          quantity: selQty,
          unit_price: prod.wholesale_price,
          name: prod.name,
          sku: prod.sku,
        }
      ])
    }
    setSelQty(1)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error('Please select a customer')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    const payload = {
      customer_id: customerId,
      items: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      notes: 'Web sales order booking'
    }
    onSave(payload)
    setItems([])
    setCustomerId(null)
  }

  const orderTotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)

  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 650 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Book Wholesale Order</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Customer Account *</label>
              <select className="input" required value={customerId || ''} onChange={e => setCustomerId(Number(e.target.value))}>
                <option value="">-- Choose Account --</option>
                {customersData?.items?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Order Line Items</h3>
            
            {/* Add Item Form */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <select className="input" style={{ flex: 1 }} value={selProductId || ''} onChange={e => setSelProductId(Number(e.target.value))}>
                <option value="">-- Select Product --</option>
                {productsData?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {formatCurrency(p.wholesale_price)}</option>
                ))}
              </select>
              <input className="input" style={{ width: 80 }} type="number" min={1} value={selQty} onChange={e => setSelQty(Number(e.target.value))} />
              <button type="button" className="btn btn-secondary" onClick={handleAddItem}>Add</button>
            </div>

            {/* List */}
            {items.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '16px 0' }}>No items added yet.</p>
            ) : (
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-muted))', padding: '8px 12px', borderRadius: 6 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>SKU: {item.sku} · Qty: {item.quantity} x {formatCurrency(item.unit_price)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(item.quantity * item.unit_price)}</span>
                      <button type="button" className="btn btn-ghost" style={{ color: '#ef4444', padding: 0 }} onClick={() => handleRemoveItem(index)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: 10, marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Order Total:</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#10b981' }}>{formatCurrency(orderTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Book Order</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status],
    queryFn: () => orderService.list({ search: search || undefined, status: status || undefined }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: orderService.stats,
  })
  const stats = statsData as any

  const createMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] })
      setModalOpen(false)
      toast.success('Wholesale order booked successfully!')
    },
    onError: () => toast.error('Failed to create order'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] })
      toast.success('Order status updated!')
    },
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Sales Orders</h1>
          <p className="section-subtitle">
            {stats?.total_orders || 0} wholesale bookings · {formatCurrency(stats?.total_revenue || 0)} gross volume
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Book Order
        </button>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending Orders</span>
            <ClipboardList size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{stats?.pending_orders || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Shipped Orders</span>
            <Truck size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#3b82f6' }}>{stats?.by_status?.shipped || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Fulfilling / Completed</span>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#10b981' }}>{stats?.by_status?.delivered || 0}</div>
        </div>
      </div>

      {/* Order List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search by order ID, company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 52 }} />
            ))}
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag />
            <h3>No orders found</h3>
            <p>Initiate a customer order booking to start billing</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client Company</th>
                <th>Status</th>
                <th>Order Total</th>
                <th>Items summary</th>
                <th>Placement Date</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order: any) => {
                const config = ORDER_STATUS_CONFIG[order.status]
                return (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>ORD-{String(order.id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{order.customer_name || `Customer #${order.customer_id}`}</td>
                    <td>
                      <span className={`badge ${config?.badge || 'badge-gray'}`}>
                        {config?.label || order.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(order.total_amount)}</td>
                    <td style={{ fontSize: 13 }}>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} style={{ color: 'hsl(var(--text-secondary))' }}>
                          • {item.quantity}x {item.product_name}
                        </div>
                      ))}
                    </td>
                    <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(order.created_at)}</td>
                    <td>
                      <select className="input" style={{ width: 130, padding: '4px 8px', fontSize: 12 }} value={order.status}
                        onChange={e => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <OrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createMutation.mutate}
      />
    </div>
  )
}
