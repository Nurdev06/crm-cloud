import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, ChevronRight, Building2, Phone, Mail, MapPin, Star } from 'lucide-react'
import { customerService } from '@/services'
import { formatDate, formatCurrency, SEGMENT_CONFIG, truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

const SEGMENTS = ['vip', 'wholesale', 'regular', 'retail', 'new', 'inactive']

function CustomerModal({
  open, onClose, onSave
}: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    company_name: '', contact_person: '', email: '', phone: '',
    city: '', address: '', segment: 'new', credit_limit: 0,
    discount_percent: 0, tax_id: '', notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add New Customer</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Company Name *</label>
              <input className="input" required value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Company LLC" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Contact Person *</label>
              <input className="input" required value={form.contact_person}
                onChange={e => setForm({ ...form, contact_person: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@company.com" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Phone *</label>
              <input className="input" required value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>City</label>
              <input className="input" value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Tashkent" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Segment</label>
              <select className="input" value={form.segment}
                onChange={e => setForm({ ...form, segment: e.target.value })}>
                {SEGMENTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Credit Limit</label>
              <input className="input" type="number" value={form.credit_limit}
                onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Discount %</label>
              <input className="input" type="number" min={0} max={100} value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Address</label>
            <input className="input" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea className="input" value={form.notes} rows={2}
              onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Customer</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customers', page, search, segment],
    queryFn: () => customerService.list({ page, size: 20, search: search || undefined, segment: segment || undefined }),
  })
  const data = customerData as any

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setModalOpen(false)
      toast.success('Customer created successfully!')
    },
    onError: () => toast.error('Failed to create customer'),
  })

  const { data: statsData } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: customerService.stats,
  })
  const stats = statsData as any

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Customers</h1>
          <p className="section-subtitle">
            {stats?.total || 0} total · {stats?.active || 0} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Segment quick-filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={`badge ${!segment ? 'badge-blue' : 'badge-gray'}`}
          style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13 }}
          onClick={() => setSegment('')}
        >
          All
        </button>
        {SEGMENTS.map(s => (
          <button
            key={s}
            className={`badge ${segment === s ? SEGMENT_CONFIG[s]?.badge : 'badge-gray'}`}
            style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13 }}
            onClick={() => setSegment(s === segment ? '' : s)}
          >
            {s === 'vip' && '⭐ '}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {/* Search bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 52 }} />
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="empty-state">
            <Building2 />
            <h3>No customers found</h3>
            <p>Try adjusting your search or create a new customer</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>City</th>
                <th>Segment</th>
                <th>Credit Limit</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((customer: any) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {}}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="avatar"
                        style={{ width: 32, height: 32, fontSize: 12, background: '#3b82f6' }}
                      >
                        {customer.company_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {truncate(customer.company_name, 28)}
                        </div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>
                          {customer.contact_person}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(var(--text-secondary))' }}>
                        <Phone size={12} />{customer.phone}
                      </div>
                      {customer.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(var(--text-muted))', fontSize: 12 }}>
                          <Mail size={11} />{truncate(customer.email, 22)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'hsl(var(--text-secondary))' }}>
                      <MapPin size={13} />{customer.city || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${SEGMENT_CONFIG[customer.segment]?.badge || 'badge-gray'}`}>
                      {customer.segment === 'vip' && '⭐ '}
                      {SEGMENT_CONFIG[customer.segment]?.label || customer.segment}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>
                    {formatCurrency(customer.credit_limit)}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <span style={{ color: customer.current_balance > customer.credit_limit * 0.8 ? '#ef4444' : 'hsl(var(--text-primary))' }}>
                      {formatCurrency(customer.current_balance)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${customer.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>
                    {formatDate(customer.created_at)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="pagination">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total} customers</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, data.pages) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className="page-btn" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createMutation.mutate}
      />
    </div>
  )
}
