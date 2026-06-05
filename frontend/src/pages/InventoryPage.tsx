import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Archive, AlertTriangle, Layers, Edit, Check } from 'lucide-react'
import { inventoryService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

function AdjustModal({
  open, onClose, onSave, item
}: { open: boolean; onClose: () => void; onSave: (quantity: number, notes: string) => void; item: any }) {
  const [qty, setQty] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(qty, notes)
  }

  if (!open || !item) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Adjust Inventory Stock</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 20 }}>
          Adjust current quantity for product SKU <strong>{item.sku}</strong> at <strong>{item.warehouse_name || 'Warehouse'}</strong>.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>New Absolute Quantity *</label>
            <input className="input" type="number" required min={0} value={qty}
              onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Reason / Notes</label>
            <input className="input" value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="e.g. Discrepancy correction, returned order" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Apply Adjustment</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [adjustItem, setAdjustItem] = useState<any | null>(null)
  
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search, warehouse],
    queryFn: () => inventoryService.list({ search: search || undefined, warehouse: warehouse || undefined }),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity, notes }: { id: number; quantity: number; notes?: string }) =>
      inventoryService.adjust(id, quantity, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setAdjustItem(null)
      toast.success('Inventory balance updated!')
    },
    onError: () => toast.error('Failed to adjust inventory'),
  })

  const handleAdjustClick = (item: any) => {
    setAdjustItem(item)
  }

  // Count items below safety stocks
  const lowStockCount = data?.items?.filter((i: any) => i.quantity <= 15).length || 0

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Warehouse Inventory</h1>
          <p className="section-subtitle">
            Stock counts, batch numbers and tracking across logistics centers
          </p>
        </div>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Low Stock SKUs</span>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#ef4444' }}>{lowStockCount} items</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Warehouse Coverage</span>
            <Layers size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>3 Locations</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Physical Stock Auditing</span>
            <Check size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: '#10b981' }}>Synchronized with WMS</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search by SKU, product name, batch number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 180 }} value={warehouse} onChange={e => setWarehouse(e.target.value)}>
            <option value="">All Warehouses</option>
            <option value="Central Hub">Central Hub</option>
            <option value="East Logistics Center">East Logistics Center</option>
            <option value="West Distribution Depot">West Distribution Depot</option>
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
            <Archive />
            <h3>No inventory records</h3>
            <p>Warehouse ledger is currently empty or no matches found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Apparel Description</th>
                <th>Warehouse</th>
                <th>Batch / Lot No.</th>
                <th>Safety stock</th>
                <th>Current Stock</th>
                <th>Last Inspected</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any) => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.product_sku}</td>
                  <td>{item.product_name}</td>
                  <td>{item.warehouse_name || '—'}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-muted))', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      {item.batch_number || 'LOT-2026-X'}
                    </span>
                  </td>
                  <td>15 pcs</td>
                  <td style={{ fontWeight: 700, color: item.quantity <= 15 ? '#ef4444' : 'inherit' }}>
                    {item.quantity} pcs
                  </td>
                  <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(item.updated_at)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleAdjustClick(item)} title="Adjust Stock">
                      <Edit size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdjustModal
        open={adjustItem !== null}
        item={adjustItem}
        onClose={() => setAdjustItem(null)}
        onSave={(quantity, notes) => adjustMutation.mutate({ id: adjustItem.id, quantity, notes })}
      />
    </div>
  )
}
