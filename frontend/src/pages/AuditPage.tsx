import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ShieldAlert, FileText, CheckCircle2, User, Key, RefreshCcw } from 'lucide-react'

interface AuditEntry {
  id: number
  actor: string
  action: string
  entity: string
  ip_address: string
  created_at: string
  details: string
  status: 'success' | 'failed'
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [logs] = useState<AuditEntry[]>([
    {
      id: 1,
      actor: 'super@admin.com',
      action: 'ROLE_DELEGATION',
      entity: 'User #3 (sales_rep -> sales_manager)',
      ip_address: '192.168.1.52',
      created_at: '2026-06-04T14:22:00Z',
      details: 'Elevated permissions to manager role for region compliance.',
      status: 'success',
    },
    {
      id: 2,
      actor: 'rep@sales.com',
      action: 'CUSTOMER_DELETE_ATTEMPT',
      entity: 'Customer #14 (Fashion Hub LLC)',
      ip_address: '10.0.4.15',
      created_at: '2026-06-04T11:05:00Z',
      details: 'User does not possess requested write scope for deletion.',
      status: 'failed',
    },
    {
      id: 3,
      actor: 'finance@manager.com',
      action: 'INVOICE_RECORD_PAYMENT',
      entity: 'Invoice #2 (INV-00002)',
      ip_address: '192.168.1.109',
      created_at: '2026-06-04T08:30:00Z',
      details: 'Recorded payment of $5,000 for Autumn jackets bulk shipment.',
      status: 'success',
    },
    {
      id: 4,
      actor: 'warehouse@manager.com',
      action: 'INVENTORY_RECONCILIATION',
      entity: 'SKU W-HD-NVY-002',
      ip_address: '192.168.3.11',
      created_at: '2026-06-03T17:15:00Z',
      details: 'Adjusted quantity from 50 to 52 due to returns auditing.',
      status: 'success',
    }
  ])

  const filteredLogs = logs.filter(l =>
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Security & Audit Logs</h1>
          <p className="section-subtitle">
            System transaction records, credential checks, and role delegation tracking.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="search-bar" style={{ maxWidth: 400 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Filter by actor, action code, or target entity..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert />
            <h3>No audit records matched</h3>
            <p>Modify search filters</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor User</th>
                <th>Action Event</th>
                <th>Target Scope</th>
                <th>Status</th>
                <th>Origin IP</th>
                <th>Transaction Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <User size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                      {log.actor}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#8b5cf6' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{log.entity}</td>
                  <td>
                    <span className={`badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}`}>
                      {log.status === 'success' ? <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 4 }} /> : <ShieldAlert size={10} style={{ display: 'inline', marginRight: 4 }} />}
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ip_address}</td>
                  <td style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>{log.details}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
