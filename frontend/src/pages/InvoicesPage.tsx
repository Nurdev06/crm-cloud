import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, FileText, DollarSign, Calendar, Landmark, CreditCard, Receipt } from 'lucide-react'
import { invoiceService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const INVOICE_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  unpaid: { label: 'Unpaid / Draft', badge: 'badge-gray' },
  paid: { label: 'Fully Paid', badge: 'badge-green' },
  partial: { label: 'Partially Paid', badge: 'badge-blue' },
  overdue: { label: 'Overdue Account', badge: 'badge-red' },
}

function PaymentModal({
  open, onClose, onSave, invoice
}: { open: boolean; onClose: () => void; onSave: (amount: number, notes: string) => void; invoice: any }) {
  const [amount, setAmount] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(amount, notes)
  }

  if (!open || !invoice) return null
  const remaining = invoice.total_amount - (invoice.paid_amount || 0)

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Record Client Payment</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 20 }}>
          Record payment for Invoice: <strong>INV-{String(invoice.id).padStart(5, '0')}</strong>.<br />
          Outstanding balance: <strong style={{ color: '#ef4444' }}>{formatCurrency(remaining)}</strong>.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Payment Amount ($) *</label>
            <input className="input" type="number" required min={1} max={remaining} value={amount}
              onChange={e => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Payment Notes / Method</label>
            <input className="input" value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="e.g. Bank Wire, check #10432" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>Record Transaction</button>
          </div>
        </form>
      </div>
    </>
  )
}

function InvoicePDFModal({
  open, onClose, invoice
}: { open: boolean; onClose: () => void; invoice: any }) {
  if (!open || !invoice) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 600, padding: 30, background: '#fff', color: '#1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>retakeCRM</h1>
            <p style={{ fontSize: 12, margin: '4px 0', color: '#64748b' }}>Wholesale Ready-Made Clothing Dist.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>INVOICE</h2>
            <p style={{ fontSize: 13, margin: '4px 0', fontFamily: 'monospace', color: '#0f172a' }}>
              INV-{String(invoice.id).padStart(5, '0')}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '20px 0', fontSize: 13 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Billed To:</span>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: 14 }}>{invoice.customer_name || `Customer #${invoice.customer_id}`}</div>
            <div style={{ color: '#475569' }}>Client Account ID: #{invoice.customer_id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><strong>Issue Date:</strong> {formatDate(invoice.created_at)}</div>
            <div><strong>Due Date:</strong> {formatDate(invoice.due_date)}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '20px 0' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Description</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 8px' }}>
                Wholesale apparel shipment for Order Ref #ORD-{String(invoice.order_id).padStart(5, '0')}
              </td>
              <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>
                {formatCurrency(invoice.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, fontSize: 13, borderTop: '2px solid #cbd5e1', paddingTop: 14 }}>
          <div>Subtotal: <strong>{formatCurrency(invoice.total_amount)}</strong></div>
          <div>Paid Amount: <strong style={{ color: '#10b981' }}>{formatCurrency(invoice.paid_amount || 0)}</strong></div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            Balance Due: <span style={{ color: '#ef4444' }}>{formatCurrency(invoice.total_amount - (invoice.paid_amount || 0))}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 30, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <button type="button" className="btn btn-secondary" style={{ color: '#475569', border: '1px solid #cbd5e1' }} onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" style={{ background: '#0f172a' }} onClick={() => window.print()}>Print / Download PDF</button>
        </div>
      </div>
    </>
  )
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null)
  const [pdfInvoice, setPdfInvoice] = useState<any | null>(null)
  
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, status],
    queryFn: () => invoiceService.list({ search: search || undefined, status: status || undefined }),
  })

  const { data: stats } = useQuery({
    queryKey: ['invoices-stats'],
    queryFn: invoiceService.stats,
  })

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, amount, notes }: { id: number; amount: number; notes?: string }) =>
      invoiceService.recordPayment(id, amount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices-stats'] })
      setPaymentInvoice(null)
      toast.success('Payment recorded successfully!')
    },
    onError: () => toast.error('Failed to record payment'),
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Invoicing & Billing</h1>
          <p className="section-subtitle">
            Generate invoice PDFs, audit transaction ledgers, and manage client balances.
          </p>
        </div>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Unpaid Invoices</span>
            <Landmark size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{stats?.overdue_count || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Collected</span>
            <CreditCard size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#10b981' }}>{formatCurrency(stats?.total_paid || 0)}</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Overdue Balances</span>
            <Receipt size={16} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#ef4444' }}>{formatCurrency(stats?.outstanding || 0)}</div>
        </div>
      </div>

      {/* Invoice Ledger */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search by invoice ID, client company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
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
            <FileText />
            <h3>No invoice records</h3>
            <p>Billing logs will compile dynamically as orders are approved and items dispatched</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client Company</th>
                <th>Status</th>
                <th>Invoice Value</th>
                <th>Collected</th>
                <th>Balance Due</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((invoice: any) => {
                const config = INVOICE_STATUS_CONFIG[invoice.status]
                const due = invoice.total_amount - (invoice.paid_amount || 0)
                return (
                  <motion.tr key={invoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>INV-{String(invoice.id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{invoice.customer_name || `Customer #${invoice.customer_id}`}</td>
                    <td>
                      <span className={`badge ${config?.badge || 'badge-gray'}`}>
                        {config?.label || invoice.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(invoice.total_amount)}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(invoice.paid_amount || 0)}</td>
                    <td style={{ color: due > 0 ? '#ef4444' : 'inherit', fontWeight: 700 }}>
                      {formatCurrency(due)}
                    </td>
                    <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(invoice.due_date)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px', border: '1px solid hsl(var(--border))' }}
                          onClick={() => setPdfInvoice(invoice)}>
                          Print PDF
                        </button>
                        {due > 0 && (
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 8px', background: '#10b981' }}
                            onClick={() => setPaymentInvoice(invoice)}>
                            Record Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <PaymentModal
        open={paymentInvoice !== null}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSave={(amount, notes) => recordPaymentMutation.mutate({ id: paymentInvoice.id, amount, notes })}
      />

      <InvoicePDFModal
        open={pdfInvoice !== null}
        invoice={pdfInvoice}
        onClose={() => setPdfInvoice(null)}
      />
    </div>
  )
}
