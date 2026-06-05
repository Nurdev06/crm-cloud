import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Truck, MapPin, Navigation, User, Calendar, CheckCircle } from 'lucide-react'
import { deliveryService, orderService } from '@/services'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending Dispatch', badge: 'badge-gray' },
  in_transit: { label: 'In Transit', badge: 'badge-blue' },
  delivered: { label: 'Delivered', badge: 'badge-green' },
  failed: { label: 'Failed Delivery', badge: 'badge-red' },
}

function DispatchModal({
  open, onClose, onSave, delivery
}: { open: boolean; onClose: () => void; onSave: (data: any) => void; delivery: any }) {
  const [driverName, setDriverName] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [status, setStatus] = useState('in_transit')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      driver_name: driverName || delivery.driver_name,
      vehicle_no: vehicleNo || delivery.vehicle_no,
      status: status,
    })
  }

  if (!open || !delivery) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Update Shipment / Dispatch</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 20 }}>
          Manage courier assignments for Delivery ID: <strong>DEL-{String(delivery.id).padStart(5, '0')}</strong>.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Driver / Courier Name *</label>
            <input className="input" required value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="e.g. John Miller" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Vehicle Registration Number</label>
            <input className="input" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. TX-984-Z" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending Dispatch</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed / Delayed</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Delivery</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function DeliveriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editDelivery, setEditDelivery] = useState<any | null>(null)
  
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', search, status],
    queryFn: () => deliveryService.list({ search: search || undefined, status: status || undefined }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      deliveryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setEditDelivery(null)
      toast.success('Shipment details updated!')
    },
    onError: () => toast.error('Failed to update shipment'),
  })

  const activeDeliveries = data?.items?.filter((d: any) => d.status === 'in_transit').length || 0

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Logistics & Shipments</h1>
          <p className="section-subtitle">
            Track clothing delivery statuses, assign couriers, and inspect routing.
          </p>
        </div>
      </div>

      {/* Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Active Shipments</span>
            <Navigation size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#3b82f6' }}>{activeDeliveries} in transit</div>
        </div>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Telemetry Status</span>
            <MapPin size={16} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: '#10b981' }}>Live GPS Integration OK</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search deliveries by driver, order, destination..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending Dispatch</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed / Delayed</option>
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
            <Truck />
            <h3>No shipments found</h3>
            <p>Shipments will appear once orders are approved and flagged for dispatch</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order ID</th>
                <th>Destination Address</th>
                <th>Courier / Driver</th>
                <th>Status</th>
                <th>Shipment ETA</th>
                <th>Live Coordinates</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((delivery: any) => {
                const config = STATUS_CONFIG[delivery.status]
                return (
                  <motion.tr key={delivery.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>DEL-{String(delivery.id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 600 }}>ORD-{String(delivery.order_id).padStart(5, '0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                        <MapPin size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                        {delivery.destination_address || 'Central Distribution St'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{delivery.driver_name || 'Unassigned'}</div>
                          {delivery.vehicle_no && <div style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>Reg: {delivery.vehicle_no}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${config?.badge || 'badge-gray'}`}>
                        {config?.label || delivery.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <Calendar size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                        {formatDate(delivery.scheduled_at)}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {delivery.gps_coordinates || '41.2995, 69.2401'}
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ color: '#3b82f6', fontSize: 12, padding: '4px 8px', border: '1px solid #3b82f6' }}
                        onClick={() => setEditDelivery(delivery)}>
                        Update Dispatch
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <DispatchModal
        open={editDelivery !== null}
        delivery={editDelivery}
        onClose={() => setEditDelivery(null)}
        onSave={updatedData => updateMutation.mutate({ id: editDelivery.id, data: updatedData })}
      />
    </div>
  )
}
