import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Headphones, AlertCircle, Plus, Send, Clock, ArrowLeft } from 'lucide-react'
import { supportService, customerService } from '@/services'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  low: { label: 'Low Priority', badge: 'badge-gray' },
  medium: { label: 'Medium', badge: 'badge-blue' },
  high: { label: 'High Priority', badge: 'badge-red' },
  urgent: { label: 'CRITICAL SLA', badge: 'badge-red animate-pulse' },
}

const TICKET_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'badge-blue' },
  in_progress: { label: 'In Progress', badge: 'badge-blue' },
  resolved: { label: 'Resolved', badge: 'badge-green' },
  closed: { label: 'Closed', badge: 'badge-gray' },
}

function NewTicketModal({
  open, onClose, onSave
}: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const { data: customersData } = useQuery({
    queryKey: ['customers-list-tickets'],
    queryFn: () => customerService.list({ size: 100 }),
    enabled: open,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error('Select a customer')
      return
    }
    onSave({
      customer_id: customerId,
      subject,
      description,
      priority,
    })
    setSubject('')
    setDescription('')
  }

  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 450 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>File Support Ticket</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Customer Account *</label>
            <select className="input" required value={customerId || ''} onChange={e => setCustomerId(Number(e.target.value))}>
              <option value="">-- Choose Account --</option>
              {customersData?.items?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Subject / Issue *</label>
            <input className="input" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Delay in Autumn Delivery shipment" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Priority</label>
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent / SLA Breach</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Description Details *</label>
            <textarea className="input" required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe customer query in detail..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">File Ticket</button>
          </div>
        </form>
      </div>
    </>
  )
}

function TicketDetailView({
  ticket, onBack, onAddResponse, onUpdateStatus
}: { ticket: any; onBack: () => void; onAddResponse: (message: string) => void; onUpdateStatus: (status: string) => void }) {
  const [reply, setReply] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    onAddResponse(reply)
    setReply('')
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Ticket Center
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main Discussion Thread */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid hsl(var(--border))', paddingBottom: 14, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{ticket.subject}</h2>
              <div style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginTop: 4 }}>
                Ticket ID: TCK-{String(ticket.id).padStart(5, '0')} · Customer ID: #{ticket.customer_id}
              </div>
            </div>
            <div>
              <span className={`badge ${PRIORITY_CONFIG[ticket.priority]?.badge || 'badge-gray'}`}>
                {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
              </span>
            </div>
          </div>

          <div style={{ background: 'hsl(var(--bg-muted))', padding: 14, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Customer Inquiry:</div>
            <p style={{ fontSize: 13, margin: 0 }}>{ticket.description}</p>
          </div>

          {/* Timeline Discussion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Discussion Timeline</h3>
            {ticket.responses?.length === 0 ? (
              <div style={{ fontSize: 13, color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '20px 0' }}>No responses registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticket.responses?.map((res: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, background: res.is_internal ? 'rgba(59, 130, 246, 0.05)' : 'none', padding: '10px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))' }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: res.is_internal ? '#3b82f6' : '#10b981' }}>
                      {res.is_internal ? 'A' : 'C'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{res.responder_name || (res.is_internal ? 'Support Agent' : 'Client Representative')}</span>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>{formatDate(res.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, margin: 0 }}>{res.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="Type internal notes or official support response..." value={reply} onChange={e => setReply(e.target.value)} />
            <button className="btn btn-primary" type="submit" style={{ display: 'flex', gap: 6 }}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        {/* Side Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Ticket Management</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: 4 }}>Ticket Status</label>
                <select className="input" value={ticket.status} onChange={e => onUpdateStatus(e.target.value)}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 10, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>SLA Target Time</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                  <Clock size={14} /> 2h 15m remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', search, priority],
    queryFn: () => supportService.list({ search: search || undefined, priority: priority || undefined }),
  })
  const ticketsList = (ticketsData as any)?.items || []

  const { data: currentTicket } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: () => supportService.get(selectedTicketId!),
    enabled: selectedTicketId !== null,
  })

  const createMutation = useMutation({
    mutationFn: supportService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setModalOpen(false)
      toast.success('Ticket filed successfully!')
    },
    onError: () => toast.error('Failed to file support ticket'),
  })

  const replyMutation = useMutation({
    mutationFn: (message: string) =>
      supportService.addResponse(selectedTicketId!, { message, is_internal: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] })
      toast.success('Response registered!')
    },
    onError: () => toast.error('Failed to submit response'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      supportService.updateStatus(selectedTicketId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] })
      toast.success('Status updated!')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (selectedTicketId !== null && currentTicket) {
    return (
      <TicketDetailView
        ticket={currentTicket}
        onBack={() => setSelectedTicketId(null)}
        onAddResponse={replyMutation.mutate}
        onUpdateStatus={updateStatusMutation.mutate}
      />
    )
  }

  const urgentCount = ticketsList.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Support & Customer Service</h1>
          <p className="section-subtitle">
            Manage buyer disputes, apparel refund requests, and logistics delays.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> File Ticket
        </button>
      </div>

      {/* SLA Alert banner */}
      {urgentCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Attention: There are {urgentCount} support tickets with pending high/urgent SLA thresholds.
          </span>
        </div>
      )}

      {/* Ticket Grid */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search support tickets by keyword, subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 180 }} value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 52 }} />
            ))}
          </div>
        ) : ticketsList.length === 0 ? (
          <div className="empty-state">
            <Headphones />
            <h3>No tickets found</h3>
            <p>Customer accounts are fully settled and quiet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject / Inquiry</th>
                <th>Client Company</th>
                <th>Priority</th>
                <th>SLA Countdown</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {ticketsList.map((ticket: any) => {
                const priorityConfig = PRIORITY_CONFIG[ticket.priority]
                const statusConfig = TICKET_STATUS_CONFIG[ticket.status]
                return (
                  <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedTicketId(ticket.id)}>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>TCK-{String(ticket.id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{ticket.subject}</td>
                    <td>{ticket.customer_name || `Customer #${ticket.customer_id}`}</td>
                    <td>
                      <span className={`badge ${priorityConfig?.badge || 'badge-gray'}`}>
                        {priorityConfig?.label || ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: ticket.priority === 'urgent' ? '#ef4444' : 'inherit' }}>
                        {ticket.priority === 'urgent' ? '⏳ 1h remaining' : '3h response standard'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusConfig?.badge || 'badge-gray'}`}>
                        {statusConfig?.label || ticket.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(ticket.created_at)}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createMutation.mutate}
      />
    </div>
  )
}
