import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Award, CheckCircle, RefreshCcw, User, Phone, Mail, DollarSign } from 'lucide-react'
import { leadService, customerService } from '@/services'
import { formatCurrency, formatDate, LEAD_STAGE_CONFIG } from '@/lib/utils'
import toast from 'react-hot-toast'

const SOURCES = ['referral', 'website', 'trade_show', 'cold_call', 'email_campaign', 'other']
const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost']

function LeadModal({
  open, onClose, onSave
}: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: '', first_name: '', last_name: '', company: '',
    email: '', phone: '', source: 'other', stage: 'new',
    estimated_value: 0, notes: '',
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
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add New Lead</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Deal Title / Interest *</label>
              <input className="input" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Autumn Jackets Bulk Order" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>First Name *</label>
              <input className="input" required value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Jane" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Last Name *</label>
              <input className="input" required value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Company</label>
              <input className="input" value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Retail Fashion Ltd" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Phone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@retailfashion.com" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Lead Source</label>
              <select className="input" value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Stage</label>
              <select className="input" value={form.stage}
                onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Estimated Value ($)</label>
              <input className="input" type="number" min={0} value={form.estimated_value}
                onChange={e => setForm({ ...form, estimated_value: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea className="input" value={form.notes} rows={2}
              onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Interested in bulk purchase of 500 units..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Lead</button>
          </div>
        </form>
      </div>
    </>
  )
}

function ConvertModal({
  open, onClose, onConvert, lead
}: { open: boolean; onClose: () => void; onConvert: (customerId: number) => void; lead: any }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  
  const { data: customersData } = useQuery({
    queryKey: ['customers-list-simple'],
    queryFn: () => customerService.list({ size: 100 }),
    enabled: open,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCustomerId) {
      onConvert(selectedCustomerId)
    } else {
      toast.error('Please select a customer')
    }
  }

  if (!open || !lead) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 450 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Convert Lead to Opportunity</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 20 }}>
          Convert "<strong>{lead.title}</strong>" by linking it to an existing corporate customer profile.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Select Customer Account *</label>
            <select className="input" required value={selectedCustomerId || ''} onChange={e => setSelectedCustomerId(Number(e.target.value))}>
              <option value="">-- Choose Account --</option>
              {customersData?.items?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>
              <CheckCircle size={16} /> Link & Convert
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [convertLead, setConvertLead] = useState<any | null>(null)
  
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, stage],
    queryFn: () => leadService.list({ page, size: 20, search: search || undefined, stage: stage || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: leadService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setModalOpen(false)
      toast.success('Lead created successfully!')
    },
    onError: () => toast.error('Failed to create lead'),
  })

  const convertMutation = useMutation({
    mutationFn: ({ id, customerId }: { id: number; customerId: number }) =>
      leadService.convert(id, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      setConvertLead(null)
      toast.success('Lead converted to sales pipeline opportunity!')
    },
    onError: () => toast.error('Failed to convert lead'),
  })

  const totalValue = data?.items?.reduce((acc: number, item: any) => acc + item.estimated_value, 0) || 0

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Leads Management</h1>
          <p className="section-subtitle">
            {data?.total || 0} active inquiries · {formatCurrency(totalValue)} pipeline value
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Lead Value</span>
            <DollarSign size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{formatCurrency(totalValue)}</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Average Score</span>
            <Award size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>82 / 100</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Auto Scoring Engine</span>
            <RefreshCcw size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: '#10b981' }}>Active & Calibrating</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search leads by name, company, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className="input" style={{ width: 160 }} value={stage} onChange={e => { setStage(e.target.value); setPage(1) }}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 52 }} />
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="empty-state">
            <User />
            <h3>No leads found</h3>
            <p>Add a new customer lead to kickstart your pipeline</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Contact Name</th>
                <th>Company</th>
                <th>Estimated Value</th>
                <th>Score</th>
                <th>Stage</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((lead: any) => {
                const stageConfig = LEAD_STAGE_CONFIG[lead.stage]
                return (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td style={{ fontWeight: 600 }}>{lead.title}</td>
                    <td>
                      <div>
                        <div>{lead.name}</div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', display: 'flex', gap: 8 }}>
                          {lead.phone && <span><Phone size={10} style={{ display: 'inline', marginRight: 2 }} />{lead.phone}</span>}
                          {lead.email && <span><Mail size={10} style={{ display: 'inline', marginRight: 2 }} />{lead.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{lead.company || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(lead.estimated_value)}</td>
                    <td>
                      <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                        {lead.score || 70}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${stageConfig?.badge || 'badge-gray'}`}>
                        {stageConfig?.label || lead.stage}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(lead.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, color: '#3b82f6', border: '1px solid #3b82f6' }}
                        onClick={() => setConvertLead(lead)}>
                        Convert
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createMutation.mutate}
      />

      <ConvertModal
        open={convertLead !== null}
        lead={convertLead}
        onClose={() => setConvertLead(null)}
        onConvert={customerId => convertMutation.mutate({ id: convertLead.id, customerId })}
      />
    </div>
  )
}
